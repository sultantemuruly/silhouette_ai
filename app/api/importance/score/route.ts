import { NextRequest, NextResponse } from "next/server";
import { ImportanceAgent, MessagePreview } from "@/agents/importance/importance-agent";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, threshold = 0.6, userHint = "" } = await req.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing or invalid messages array." }, { status: 400 });
    }
    const agent = new ImportanceAgent();
    const BATCH_SIZE = 20;
    const batches = chunkArray(messages as MessagePreview[], BATCH_SIZE);
    let important: MessagePreview[] = [];
    for (const batch of batches) {
      const batchImportant = await agent.selectImportant(batch, { threshold, userHint });
      important = important.concat(batchImportant);
    }
    return NextResponse.json({ important });
  } catch (err: any) {
    console.error("Importance scoring error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
} 