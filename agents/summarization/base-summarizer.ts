import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { SummaryOptions, SummaryResult } from "@/types";

export class BaseSummarizationAgent {
  private llm: ChatOpenAI;
  private outputParser: StringOutputParser;

  constructor(temperature: number = 0.3) {
    this.llm = new ChatOpenAI({
      temperature,
      maxRetries: 3,
      timeout: 30000,
      modelName: "gpt-3.5-turbo",
    });
    this.outputParser = new StringOutputParser();
  }

  private createSummaryPrompt(options: SummaryOptions): PromptTemplate {
    return PromptTemplate.fromTemplate(`
You are an expert summarization assistant. Your task is to create clear, concise, and actionable summaries.

CONTENT TO SUMMARIZE:
{content}

INSTRUCTIONS:
- Create a {tone} summary in approximately {maxLength} words
- Focus on: {focusAreas}
- Highlight the most important information
- Identify key themes and main points
${
  options.includeActionItems
    ? "- Extract any action items, deadlines, or next steps"
    : ""
}
${options.includeKeyPoints ? "- List 3-5 key points separately" : ""}

FORMAT YOUR RESPONSE AS JSON:
{{
  "summary": "Main summary text here",
  "keyPoints": ["point 1", "point 2", "point 3"],
  ${
    options.includeActionItems ? '"actionItems": ["action 1", "action 2"],' : ""
  }
  "sentiment": "positive/negative/neutral",
  "urgencyLevel": "low/medium/high"
}}

Ensure the JSON is valid and properly formatted.
    `);
  }

  async summarize(
    content: string,
    options: SummaryOptions = {}
  ): Promise<SummaryResult> {
    try {
      const prompt = this.createSummaryPrompt(options);

      const chain = RunnableSequence.from([
        prompt,
        this.llm,
        this.outputParser,
      ]);

      const result = await chain.invoke({
        content,
        maxLength: options.maxLength || 200,
        tone: options.tone || "professional",
        focusAreas:
          options.focusAreas?.join(", ") ||
          "main topics and important information",
      });

      // Parse the JSON response
      try {
        const parsed = JSON.parse(result);
        return {
          summary: parsed.summary,
          keyPoints: parsed.keyPoints || [],
          actionItems: parsed.actionItems,
          sentiment: parsed.sentiment,
          urgencyLevel: parsed.urgencyLevel,
        };
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        return {
          summary: result,
          keyPoints: [],
          sentiment: "neutral",
          urgencyLevel: "low",
        };
      }
    } catch (error) {
      console.error("Error in summarization:", error);
      throw new Error("Failed to generate summary");
    }
  }

  async summarizeMultiple(
    contents: string[],
    options: SummaryOptions = {}
  ): Promise<SummaryResult[]> {
    const summaries = await Promise.allSettled(
      contents.map((content) => this.summarize(content, options))
    );

    return summaries.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error(`Failed to summarize content ${index}:`, result.reason);
        return {
          summary: "Failed to generate summary for this content.",
          keyPoints: [],
          sentiment: "neutral" as const,
          urgencyLevel: "low" as const,
        };
      }
    });
  }
}
