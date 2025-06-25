import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

export interface MessagePreview {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

export interface ImportanceOptions {
  /** 0–1 float; only messages scoring ≥ this are considered important */
  threshold?: number;
  /** optional hint like 'billing', 'family', 'urgent' */
  userHint?: string;
}

export interface ImportanceResult {
  /** Total number of messages scored */
  total: number;
  /** List of important messages (score ≥ threshold) */
  important: MessagePreview[];
  /** Raw scores for all messages */
  scores: { id: string; score: number }[];
}

export class ImportanceAgent {
  private llm: ChatOpenAI;
  private parser: StringOutputParser;
  private prompt: PromptTemplate;

  /**
   * @param apiKey OpenAI API key (falls back to process.env.OPENAI_API_KEY)
   */
  constructor(
    temperature = 0.3,
    apiKey: string = process.env.OPENAI_API_KEY ?? ""
  ) {
    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      temperature,
      maxRetries: 3,
      timeout: 30_000,
      modelName: "gpt-4",
    });
    this.parser = new StringOutputParser();

    // Prompt with escaped double-braces
    this.prompt = PromptTemplate.fromTemplate(
      `
You are an assistant that scores each email’s importance from 0 (irrelevant) to 1 (critical).
User hint: "{userHint}"

Here are the messages to score (JSON array):
{messages}

Respond only with a JSON array of objects, e.g.:
[
  {{ "id": "<message id>", "score": <float 0–1> }}
]

Ensure valid JSON.
`.trim()
    );
  }

  /**
   * Scores and filters the provided messages by LLM-scored importance.
   * Returns total count, raw scores, and filtered important messages.
   */
  public async scoreAndFilter(
    messages: MessagePreview[],
    options: ImportanceOptions = {}
  ): Promise<ImportanceResult> {
    const threshold = options.threshold ?? 0.5;
    const userHint = options.userHint ?? "";

    const chain = RunnableSequence.from([this.prompt, this.llm, this.parser]);

    // Invoke with variables matching the prompt template
    const raw = await chain.invoke({
      userHint,
      messages: JSON.stringify(messages, null, 2),
    });

    let scores: Array<{ id: string; score: number }> = [];
    try {
      scores = JSON.parse(raw as string) as typeof scores;
    } catch (e) {
      console.error("ImportanceAgent JSON parse error:", e, raw);
      throw new Error("Failed to parse importance scores");
    }

    const important = messages.filter((m) =>
      scores.some((s) => s.id === m.id && s.score >= threshold)
    );

    return {
      total: messages.length,
      important,
      scores,
    };
  }

  /**
   * Alias for scoreAndFilter, returns only important messages.
   */
  public async selectImportant(
    messages: MessagePreview[],
    options: ImportanceOptions = {}
  ): Promise<MessagePreview[]> {
    const result = await this.scoreAndFilter(messages, options);
    return result.important;
  }
}
