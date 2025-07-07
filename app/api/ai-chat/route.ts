import { NextRequest, NextResponse } from "next/server";
import * as chrono from "chrono-node";

function extractFallback(prompt: string) {
  // Extract recipient (email)
  const emailMatch = prompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const recipient = emailMatch ? emailMatch[0] : null;

  // Extract date using chrono-node
  const dateParsed = chrono.parseDate(prompt);
  const date = dateParsed ? dateParsed.toISOString().slice(0, 16) + ":00" : null;

  // Fallback subject: try to extract after 'about' or 'regarding', else generic
  let subject = null;
  const aboutMatch = prompt.match(/about ([^\n\r]+?)( to | for |$)/i);
  if (aboutMatch) {
    subject = aboutMatch[1].trim();
  } else {
    const regardingMatch = prompt.match(/regarding ([^\n\r]+?)( to | for |$)/i);
    if (regardingMatch) subject = regardingMatch[1].trim();
  }
  if (!subject && recipient) {
    // Try to use words before the email as subject
    const beforeEmail = prompt.split(recipient)[0];
    if (beforeEmail) subject = beforeEmail.trim().split(/\s+/).slice(-5).join(' ');
  }
  if (!subject) subject = "(No Subject)";

  // Fallback body: everything after 'about' or the whole prompt
  let body = null;
  if (aboutMatch) {
    body = prompt.slice(aboutMatch.index! + aboutMatch[0].length).trim();
  } else {
    body = prompt;
  }

  return {
    recipient,
    subject,
    body,
    date,
  };
}

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const apiKey = process.env.AZURE_OPENAI_API_KEY!;
  const endpoint = process.env.AZURE_OPENAI_API_ENDPOINT_1!;

  const url = endpoint;

  const systemPrompt = `You are an email assistant. For every user prompt, do two things:\n1. Write a friendly, helpful message to the user (e.g., "I've scheduled the email for you!" or "Here's your draft!").\n2. On a new line, return ONLY a JSON object with these keys: recipient, subject, body, date.\n\n- recipient: the email address to send to (if present, else null)\n- subject: the subject of the email (if present, else null)\n- body: the main content/message (if present, else null)\n- date: the scheduled date/time in ISO 8601 format (if present, else null)\n\nThe date/time may appear anywhere in the prompt, including phrases like "schedule it for", "send it at", "tomorrow at 10:15", etc. Always extract the intended scheduled time if present.\n\nIf a field is not specified, set it to null.\n\nExamples:\n\nPrompt: "please send email about hang out invitation to someone@gmail.com and schedule it for tomorrow at 10:15"\nOutput:\nI've scheduled the email for you!\n{\n  "recipient": "someone@gmail.com",\n  "subject": "Hang Out Invitation",\n  "body": "Let's hang out! Here are the details...",
  "date": "2024-06-07T10:15:00"\n}\n\nPrompt: "write a follow up email"\nOutput:\nHere's your follow up email draft!\n{\n  "recipient": null,\n  "subject": "Follow Up",\n  "body": "I'm following up regarding...",
  "date": null\n}\n\nNow, for this prompt:\n"${prompt}"\nReturn the message, then the JSON object on a new line.`;

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
      max_tokens: 256,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch from Azure OpenAI" }, { status: 500 });
  }

  const data = await response.json();
  const aiReply = data.choices?.[0]?.message?.content || "";

  // Log the raw LLM output for debugging
  console.log("[AI RAW OUTPUT]", aiReply);

  // Split the message and JSON
  let userMessage = aiReply;
  let jsonPart = null;
  const jsonStart = aiReply.indexOf('{');
  if (jsonStart !== -1) {
    userMessage = aiReply.slice(0, jsonStart).trim();
    jsonPart = aiReply.slice(jsonStart);
  }

  // Try to parse as JSON
  let parsed: unknown = null;
  try {
    // Remove code block markers if present
    const cleaned = (jsonPart || '').replace(/^```json|```$/gim, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.warn("[AI JSON PARSE FAIL]", e);
  }

  // Type guard for expected object shape
  function isValidAIResult(obj: unknown): obj is { recipient: string|null, subject: string|null, body: string|null, date: string|null } {
    if (!obj || typeof obj !== 'object') return false;
    const o = obj as Record<string, unknown>;
    return (
      ('recipient' in o) && (typeof o.recipient === 'string' || o.recipient === null) &&
      ('subject' in o) && (typeof o.subject === 'string' || o.subject === null) &&
      ('body' in o) && (typeof o.body === 'string' || o.body === null) &&
      ('date' in o) && (typeof o.date === 'string' || o.date === null)
    );
  }

  let recipient: string|null = null;
  let subject: string|null = null;
  let body: string|null = null;
  let date: string|null = null;

  let needsFallback = true;
  if (isValidAIResult(parsed)) {
    recipient = parsed.recipient;
    subject = parsed.subject;
    body = parsed.body;
    date = parsed.date;
    needsFallback = false;
  }

  let fallbackUsed = false;
  if (needsFallback) {
    fallbackUsed = true;
    const fallback = extractFallback(prompt);
    recipient = fallback.recipient;
    subject = fallback.subject;
    body = fallback.body;
    date = fallback.date;
  }

  if (fallbackUsed) {
    console.log('[AI FALLBACK USED]', { recipient, subject, body, date });
  }

  return NextResponse.json({
    recipient,
    subject,
    body,
    date,
    message: userMessage,
    raw: aiReply,
    fallbackUsed
  });
}