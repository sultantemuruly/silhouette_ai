import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { EmailSummarizationAgent } from "@/agents";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emails, query } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Emails array is required" },
        { status: 400 }
      );
    }

    const emailSummarizer = new EmailSummarizationAgent();
    const summary = await emailSummarizer.summarizeEmails(
      emails,
      query || "email search results",
      {
        maxLength: 250,
        tone: "professional",
        includeContacts: false,
        
      }
    );

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error in email summarization:", error);
    return NextResponse.json(
      { error: "Failed to summarize emails" },
      { status: 500 }
    );
  }
}
