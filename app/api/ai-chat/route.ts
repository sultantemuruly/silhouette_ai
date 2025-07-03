import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt, subject, body } = await req.json();

  const apiKey = process.env.AZURE_OPENAI_API_KEY!;
  const endpoint = process.env.AZURE_OPENAI_API_ENDPOINT_1!;

  const url = endpoint;

  const messages = [
    { role: "system", content: "You are an AI assistant helping users write email subjects and bodies." },
    { role: "user", content: `Current subject: ${subject}\nCurrent body: ${body}\nUser prompt: ${prompt}` }
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages,
      max_tokens: 256,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch from Azure OpenAI" }, { status: 500 });
  }

  const data = await response.json();
  const aiReply = data.choices?.[0]?.message?.content || "";

  return NextResponse.json({ reply: aiReply });
}