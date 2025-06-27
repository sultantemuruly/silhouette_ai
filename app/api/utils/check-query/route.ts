import { NextRequest, NextResponse } from "next/server";
import { AzureChatOpenAI } from "@langchain/openai";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ isMeaningful: false });
  }

  const llm = new AzureChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
    maxRetries: 2,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION!,
  });
  const prompt = `
You are a classifier. 
Given an input string, respond with JSON:
  {"isMeaningful": true} if it contains normal words (not random letters), else
  {"isMeaningful": false}

Here's the text to judge: "${query.replace(/"/g, '\\"')}"
  `.trim();

  try {
    const res = await llm.invoke([
      {
        role: "system",
        content: "Classify whether a search query is meaningful.",
      },
      { role: "user", content: prompt },
    ]);

    // Handle both string and complex content types
    const content =
      typeof res.content === "string"
        ? res.content
        : JSON.stringify(res.content);

    const out = JSON.parse(content);
    return NextResponse.json({ isMeaningful: !!out.isMeaningful });
  } catch {
    const simple = /[aeiouyAEIOUY]{1}/.test(query) && query.trim().length >= 3;
    return NextResponse.json({ isMeaningful: simple });
  }
}
