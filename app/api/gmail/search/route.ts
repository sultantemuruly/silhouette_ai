import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { google, gmail_v1 } from "googleapis";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "langchain/document";
import { ChatOpenAI } from "@langchain/openai";
import { db } from "@/lib/db";
import { google_accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

// Add interface for enhanced email analysis
interface EnhancedEmailMatch {
  id: string;
  subject: string;
  from: string;
  date: string;
  to: string;
  preview: string;
  body: string;
  analysis: {
    summary: string;
    urgency: "low" | "medium" | "high" | "critical";
    significance: "low" | "medium" | "high";
    category: string;
    keyPoints: string[];
    actionRequired: boolean;
    reasoning: string;
  };
}

// helper functions
function findPlainTextBody(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";

  // 1) If there's a text/plain part, decode it
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    try {
      return Buffer.from(payload.body.data, "base64").toString("utf-8").trim();
    } catch {
      return "";
    }
  }

  // 2) Otherwise recurse into parts
  for (const part of payload.parts ?? []) {
    const txt = findPlainTextBody(part);
    if (txt) return txt;
  }

  // 3) Fallback: if it's HTML, strip tags to plain text
  if (payload.mimeType === "text/html" && payload.body?.data) {
    const html = Buffer.from(payload.body.data, "base64").toString("utf-8");
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return "";
}

function findHtmlBody(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";

  if (payload.mimeType === "text/html" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  for (const part of payload.parts ?? []) {
    const html = findHtmlBody(part);
    if (html) return html;
  }

  return "";
}

async function fetchAllMessages(
  gmail: gmail_v1.Gmail,
  query: string
): Promise<gmail_v1.Schema$Message[]> {
  let pageToken: string | undefined;
  const all: gmail_v1.Schema$Message[] = [];
  do {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 500,
      pageToken,
    });
    all.push(...(res.data.messages ?? []));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
  return all;
}

function extractEmailMetadata(
  headers: gmail_v1.Schema$MessagePartHeader[],
  id: string
) {
  const get = (name: string) =>
    headers.find((h) => h.name === name)?.value?.trim() ?? "";
  return {
    id,
    subject: get("Subject") || "(no subject)",
    from: get("From") || "(unknown)",
    date: get("Date") || "",
    to: get("To") || "",
  };
}

function isValidDocumentContent(txt: string): boolean {
  const t = txt.trim();
  return t.length >= 5 && /[A-Za-z]{2,}/.test(t);
}

async function analyzeEmailWithLLM(
  email: {
    subject: string;
    from: string;
    date: string;
    content: string;
  },
  queryContext: string
): Promise<EnhancedEmailMatch["analysis"]> {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini", // or "gpt-4" for better quality
    temperature: 0.1,
    maxTokens: 1000,
  });

  const prompt = `Analyze this email in the context of the user's search query: "${queryContext}"

Email Details:
- Subject: ${email.subject}
- From: ${email.from}
- Date: ${email.date}
- Content: ${email.content.slice(0, 2000)}...

Please provide a JSON response with the following analysis:
{
  "summary": "A concise 2-3 sentence summary of the email's main content and relevance to the query",
  "urgency": "low|medium|high|critical", // Based on time-sensitivity, deadlines, urgent language
  "significance": "low|medium|high", // Based on importance to user, business impact, personal relevance
  "category": "work|personal|financial|travel|shopping|notifications|other",
  "keyPoints": ["bullet point 1", "bullet point 2", "bullet point 3"], // 2-4 key takeaways
  "actionRequired": true/false, // Whether email requires user action/response
  "reasoning": "Brief explanation of urgency and significance ratings"
}

Urgency Guidelines:
- Critical: Immediate action needed, emergency, security alerts
- High: Deadlines within 24-48 hours, important meetings, time-sensitive decisions
- Medium: Deadlines within a week, follow-ups needed
- Low: FYI, newsletters, non-time-sensitive

Significance Guidelines:
- High: Major business decisions, personal milestones, financial matters, legal documents
- Medium: Work projects, important personal communications, travel confirmations
- Low: Newsletters, promotional emails, routine notifications

Return only valid JSON.`;

  try {
    const response = await llm.invoke(prompt);
    const analysis = JSON.parse(response.content as string);

    // Validate and set defaults
    return {
      summary: analysis.summary || "No summary available",
      urgency: ["low", "medium", "high", "critical"].includes(analysis.urgency)
        ? analysis.urgency
        : "medium",
      significance: ["low", "medium", "high"].includes(analysis.significance)
        ? analysis.significance
        : "medium",
      category: analysis.category || "other",
      keyPoints: Array.isArray(analysis.keyPoints)
        ? analysis.keyPoints.slice(0, 4)
        : [],
      actionRequired: Boolean(analysis.actionRequired),
      reasoning: analysis.reasoning || "Analysis not available",
    };
  } catch (error) {
    console.error("LLM analysis failed:", error);
    // Fallback analysis
    return {
      summary: "Email analysis unavailable - showing original content",
      urgency: "medium" as const,
      significance: "medium" as const,
      category: "other",
      keyPoints: [],
      actionRequired: false,
      reasoning: "Automated analysis failed",
    };
  }
}

// Batch analysis function for efficiency
async function batchAnalyzeEmails(
  emails: Array<{
    id: string;
    subject: string;
    from: string;
    date: string;
    to: string;
    content: string;
    body: string;
  }>,
  queryContext: string
): Promise<EnhancedEmailMatch[]> {
  // Process in smaller batches to avoid rate limits
  const batchSize = 3;
  const results: EnhancedEmailMatch[] = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const analyses = await Promise.all(
      batch.map((email) =>
        analyzeEmailWithLLM(
          {
            subject: email.subject,
            from: email.from,
            date: email.date,
            content: email.content,
          },
          queryContext
        )
      )
    );

    batch.forEach((email, index) => {
      results.push({
        ...email,
        preview:
          email.content.slice(0, 300).replace(/\s+/g, " ").trim() +
          (email.content.length > 300 ? "…" : ""),
        analysis: analyses[index],
      });
    });

    // Small delay between batches to respect rate limits
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// API handler
export async function POST(req: NextRequest) {
  try {
    // --- 1) Auth ---
    const { userId } = getAuth(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // --- 2) Parse body ---
    const { queryText } = await req.json().catch(() => ({}));
    if (
      !queryText ||
      typeof queryText !== "string" ||
      queryText.trim().length < 3
    ) {
      return NextResponse.json(
        { error: "Please provide a non-empty query of at least 3 characters." },
        { status: 400 }
      );
    }

    // --- 3) Load OAuth tokens ---
    const [acct] = await db
      .select()
      .from(google_accounts)
      .where(eq(google_accounts.clerk_user_id, userId));
    if (!acct) {
      return NextResponse.json(
        { error: "Connect your Gmail account first." },
        { status: 400 }
      );
    }

    // --- 4) Setup Gmail client ---
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );
    oauth2.setCredentials({
      access_token: acct.access_token,
      refresh_token: acct.refresh_token,
      expiry_date: acct.expiry_date,
    });
    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    // --- 5) Fetch all message IDs ---
    const metaList = await fetchAllMessages(gmail, "in:all");
    if (metaList.length === 0) {
      return NextResponse.json({
        matches: [],
        summary: "No emails found in your inbox.",
      });
    }

    // --- 6) Load & index text documents ---
    const allDocs: Document[] = [];
    for (let i = 0; i < metaList.length; i += 50) {
      const batch = metaList.slice(i, i + 50);
      const docs = await Promise.all(
        batch.map(async (m) => {
          try {
            const msg = await gmail.users.messages.get({
              userId: "me",
              id: m.id!,
              format: "full",
            });
            const headers = msg.data.payload?.headers ?? [];
            const meta = extractEmailMetadata(headers, m.id!);
            const txt = findPlainTextBody(msg.data.payload);
            if (!isValidDocumentContent(txt)) return null;
            return new Document({ pageContent: txt, metadata: meta });
          } catch {
            return null;
          }
        })
      );
      allDocs.push(...(docs.filter((d) => d) as Document[]));
    }

    // --- 7) Semantic search ---
    const embeddings = new OpenAIEmbeddings({ maxRetries: 3, timeout: 60000 });
    let topDocs: Document[];
    try {
      const store = await MemoryVectorStore.fromDocuments(allDocs, embeddings);
      topDocs = await store.similaritySearch(queryText.trim(), 5);
    } catch {
      topDocs = await performSimilaritySearch(
        allDocs,
        queryText.trim(),
        embeddings,
        5
      );
    }

    // --- 8) Re-fetch HTML and prepare for LLM analysis ---
    const emailsForAnalysis = await Promise.all(
      topDocs.map(async (doc) => {
        const full = await gmail.users.messages.get({
          userId: "me",
          id: doc.metadata.id,
          format: "full",
        });
        const htmlBody = findHtmlBody(full.data.payload);

        return {
          id: doc.metadata.id,
          subject: doc.metadata.subject,
          from: doc.metadata.from,
          date: doc.metadata.date,
          to: doc.metadata.to,
          content: doc.pageContent,
          body: htmlBody || doc.pageContent,
        };
      })
    );

    // --- 9) Enhanced LLM Analysis ---
    const enhancedMatches = await batchAnalyzeEmails(
      emailsForAnalysis,
      queryText.trim()
    );

    // --- 10) Sort by relevance score (urgency + significance) ---
    const sortedMatches = enhancedMatches.sort((a, b) => {
      const scoreA = getRelevanceScore(a.analysis);
      const scoreB = getRelevanceScore(b.analysis);
      return scoreB - scoreA;
    });

    // --- 11) Generate overall summary ---
    const overallSummary = generateOverallSummary(
      sortedMatches,
      queryText.trim()
    );

    return NextResponse.json({
      matches: sortedMatches,
      summary: overallSummary,
      totalEmailsProcessed: allDocs.length,
      validEmailsForSearch: allDocs.length,
      analytics: {
        urgencyBreakdown: getUrgencyBreakdown(sortedMatches),
        categoryBreakdown: getCategoryBreakdown(sortedMatches),
        actionRequiredCount: sortedMatches.filter(
          (m) => m.analysis.actionRequired
        ).length,
      },
    });
  } catch (err) {
    console.error("Unexpected error in POST /search:", err);
    return NextResponse.json(
      { error: "Server error while searching emails." },
      { status: 500 }
    );
  }
}

// Helper functions for scoring and analytics
function getRelevanceScore(analysis: EnhancedEmailMatch["analysis"]): number {
  const urgencyScore = { low: 1, medium: 2, high: 3, critical: 4 }[
    analysis.urgency
  ];
  const significanceScore = { low: 1, medium: 2, high: 3 }[
    analysis.significance
  ];
  const actionBonus = analysis.actionRequired ? 1 : 0;

  return urgencyScore + significanceScore + actionBonus;
}

function generateOverallSummary(
  matches: EnhancedEmailMatch[],
  query: string
): string {
  if (matches.length === 0) return "No relevant emails found.";

  const criticalCount = matches.filter(
    (m) => m.analysis.urgency === "critical"
  ).length;
  const highUrgencyCount = matches.filter(
    (m) => m.analysis.urgency === "high"
  ).length;
  const actionRequiredCount = matches.filter(
    (m) => m.analysis.actionRequired
  ).length;

  let summary = `Found ${matches.length} emails relevant to "${query}".`;

  if (criticalCount > 0) {
    summary += ` ${criticalCount} require immediate attention.`;
  } else if (highUrgencyCount > 0) {
    summary += ` ${highUrgencyCount} are high priority.`;
  }

  if (actionRequiredCount > 0) {
    summary += ` ${actionRequiredCount} need your response or action.`;
  }

  return summary;
}

function getUrgencyBreakdown(matches: EnhancedEmailMatch[]) {
  return {
    critical: matches.filter((m) => m.analysis.urgency === "critical").length,
    high: matches.filter((m) => m.analysis.urgency === "high").length,
    medium: matches.filter((m) => m.analysis.urgency === "medium").length,
    low: matches.filter((m) => m.analysis.urgency === "low").length,
  };
}

function getCategoryBreakdown(matches: EnhancedEmailMatch[]) {
  const categories: Record<string, number> = {};
  matches.forEach((m) => {
    categories[m.analysis.category] =
      (categories[m.analysis.category] || 0) + 1;
  });
  return categories;
}

// Fallback similarity search (untouched)

async function performSimilaritySearch(
  documents: Document[],
  queryText: string,
  embeddings: OpenAIEmbeddings,
  topK = 5
): Promise<Document[]> {
  const docTexts = documents.map((d) => d.pageContent);
  const docEmbs = await embeddings.embedDocuments(docTexts);
  const queryEmb = await embeddings.embedQuery(queryText);
  const sims = docEmbs.map((emb, i) => ({
    document: documents[i],
    score: embeddingsCosine(emb, queryEmb),
  }));
  return sims
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.document);
}

function embeddingsCosine(a: number[], b: number[]) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (magA * magB);
}
