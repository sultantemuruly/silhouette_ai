import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { MessagePreview } from "@/types";

export interface ImportanceOptions {
  /** 0–1 float; only messages scoring ≥ this are returned */
  threshold?: number;
  /** optional hint like “billing”, “family”, “urgent” */
  userHint?: string;
}

export class ImportanceAgent {
  private llm: ChatOpenAI;
  private parser: StringOutputParser;
  private prompt: PromptTemplate;

  constructor(temperature = 0.3) {
    this.llm = new ChatOpenAI({
      temperature,
      maxRetries: 3,
      timeout: 30_000,
      modelName: "gpt-4",
    });
    this.parser = new StringOutputParser();

    this.prompt = PromptTemplate.fromTemplate(
      `
You are an assistant that scores each email’s importance from 0 (irrelevant) to 1 (critical).
User hint: "{userHint}"

Here are the messages to score (JSON array):
{messages}

Respond only with a JSON array of objects:
[
  { "id": "<message id>", "score": <float 0–1> },
  …
]

Ensure valid JSON.`.trim()
    );
  }

  /**
   * Filters the provided messages by LLM-scored importance.
   */
  public async selectImportant(
    messages: MessagePreview[],
    options: ImportanceOptions = {}
  ): Promise<MessagePreview[]> {
    const threshold = options.threshold ?? 0.5;
    const userHint = options.userHint ?? "";

    const chain = RunnableSequence.from([this.prompt, this.llm, this.parser]);

    const raw = await chain.invoke({
      userHint,
      messages: JSON.stringify(messages, null, 2),
    });

    let scores: Array<{ id: string; score: number }> = [];
    try {
      scores = JSON.parse(raw) as typeof scores;
    } catch (e) {
      console.error("ImportanceAgent JSON parse error:", e, raw);
      throw new Error("Failed to parse importance scores");
    }

    const keep = new Set(
      scores.filter((s) => s.score >= threshold).map((s) => s.id)
    );
    return messages.filter((m) => keep.has(m.id));
  }
}
