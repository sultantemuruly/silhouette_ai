import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { google, gmail_v1 } from "googleapis";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "langchain/document";
import { db } from "@/lib/db";
import { google_accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

////////////////////////////////////////////////////////////////////////////////
// Helpers: extract text, extract HTML, filter content, fetch all message IDs //
////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////
// API Handler                                                            //
////////////////////////////////////////////////////////////////////////////////

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

    // --- 8) Re-fetch HTML for topDocs ---
    const htmlPairs = await Promise.all(
      topDocs.map(async (doc) => {
        const full = await gmail.users.messages.get({
          userId: "me",
          id: doc.metadata.id,
          format: "full",
        });
        return [doc.metadata.id, findHtmlBody(full.data.payload)] as [
          string,
          string
        ];
      })
    );
    const htmlMap = new Map<string, string>(htmlPairs);

    // --- 9) Format output ---
    const formattedMatches = topDocs.map((d) => {
      const plain = d.pageContent;
      const html = htmlMap.get(d.metadata.id) || plain;
      return {
        id: d.metadata.id,
        subject: d.metadata.subject,
        from: d.metadata.from,
        date: d.metadata.date,
        to: d.metadata.to,
        preview:
          plain.slice(0, 300).replace(/\s+/g, " ").trim() +
          (plain.length > 300 ? "…" : ""),
        body: html,
      };
    });

    // --- 10) Return JSON ---
    return NextResponse.json({
      matches: formattedMatches,
      summary: `Found ${formattedMatches.length} relevant emails.`,
      totalEmailsProcessed: allDocs.length,
      validEmailsForSearch: allDocs.length,
    });
  } catch (err) {
    console.error("Unexpected error in POST /search:", err);
    return NextResponse.json(
      { error: "Server error while searching emails." },
      { status: 500 }
    );
  }
}

////////////////////////////////////////////////////////////////////////////////
// Fallback similarity search (untouched)                                     //
////////////////////////////////////////////////////////////////////////////////

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
