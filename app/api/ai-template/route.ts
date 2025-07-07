import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const apiKey = process.env.AZURE_OPENAI_API_KEY!;
  const endpoint = process.env.AZURE_OPENAI_API_ENDPOINT_1!;

  const url = endpoint;

  const systemPrompt = `You are an expert email designer. Generate a complete, professional HTML email template based on the following user description. Only return the HTML code, nothing else. Do not include explanations or markdown code blocks.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt }
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages,
      max_tokens: 1024,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch from Azure OpenAI" }, { status: 500 });
  }

  const data = await response.json();
  let html = data.choices?.[0]?.message?.content || "";

  // Remove code block markers if present
  html = html.replace(/^```html|```$/gim, '').trim();

  return NextResponse.json({ html });
} 