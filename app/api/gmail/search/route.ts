import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { google, gmail_v1 } from "googleapis";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "langchain/document";
import { db } from "@/lib/db";
import { google_accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Recursively extract text/plain body from Gmail payload.
 */
function findPlainTextBody(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";

  // Handle text/plain directly
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    try {
      const decoded = Buffer.from(payload.body.data, "base64").toString(
        "utf-8"
      );
      return decoded.trim();
    } catch (error) {
      console.error("Error decoding base64 content:", error);
      return "";
    }
  }

  // Handle multipart messages
  if (payload.mimeType?.startsWith("multipart/")) {
    const parts = payload.parts ?? [];
    for (const part of parts) {
      const result = findPlainTextBody(part);
      if (result && result.trim().length > 0) return result;
    }
  }

  return "";
}

/**
 * Fetches all messages matching query (pages through results).
 */
async function fetchAllMessages(
  gmail: gmail_v1.Gmail,
  query: string
): Promise<gmail_v1.Schema$Message[]> {
  let pageToken: string | undefined;
  const all: gmail_v1.Schema$Message[] = [];

  try {
    do {
      const res = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 500,
        pageToken,
      });
      const msgs = res.data.messages ?? [];
      all.push(...msgs);
      pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw new Error("Failed to fetch emails from Gmail");
  }

  return all;
}

/**
 * Extract and clean metadata from email headers
 */
function extractEmailMetadata(
  headers: gmail_v1.Schema$MessagePartHeader[],
  messageId: string
) {
  return {
    id: messageId,
    subject:
      headers.find((h) => h.name === "Subject")?.value?.trim() ||
      "(no subject)",
    from:
      headers.find((h) => h.name === "From")?.value?.trim() ||
      "(unknown sender)",
    date: headers.find((h) => h.name === "Date")?.value?.trim() || "",
    to: headers.find((h) => h.name === "To")?.value?.trim() || "",
  };
}

/**
 * Check if document content is valid for embedding
 */
function isValidDocumentContent(content: string): boolean {
  if (!content || typeof content !== "string") return false;

  const trimmed = content.trim();

  // Must have at least 10 characters and not be just whitespace/special chars
  if (trimmed.length < 10) return false;

  // Check if content has actual words (not just symbols/numbers)
  const hasWords = /[a-zA-Z]{2,}/.test(trimmed);
  return hasWords;
}

/**
 * Simple similarity search using cosine similarity
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Fallback similarity search implementation
 */
async function performSimilaritySearch(
  documents: Document[],
  queryText: string,
  embeddings: OpenAIEmbeddings,
  topK: number = 5
): Promise<Document[]> {
  try {
    // Get embeddings for all documents and the query
    console.log("Getting embeddings for documents...");
    const docTexts = documents.map((doc) => doc.pageContent);
    const docEmbeddings = await embeddings.embedDocuments(docTexts);

    console.log("Getting embedding for query...");
    const queryEmbedding = await embeddings.embedQuery(queryText);

    // Calculate similarities
    const similarities = docEmbeddings.map((docEmb, index) => ({
      document: documents[index],
      similarity: cosineSimilarity(queryEmbedding, docEmb),
    }));

    // Sort by similarity and return top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map((item) => item.document);
  } catch (error) {
    console.error("Error in fallback similarity search:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { queryText } = requestBody.queryText;
    const preciseQuery = `in:all "${queryText}"`;

    if (
      !queryText ||
      typeof queryText !== "string" ||
      queryText.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Query text is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (queryText.trim().length < 3) {
      return NextResponse.json(
        { error: "Query text must be at least 3 characters long" },
        { status: 400 }
      );
    }

    // 3. Load OAuth tokens from database
    const [acct] = await db
      .select()
      .from(google_accounts)
      .where(eq(google_accounts.clerk_user_id, userId));

    if (!acct) {
      return NextResponse.json(
        {
          error:
            "No Google account linked. Please connect your Gmail account first.",
        },
        { status: 400 }
      );
    }

    // 4. Setup Gmail client with OAuth
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

    oauth2Client.setCredentials({
      access_token: acct.access_token,
      refresh_token: acct.refresh_token,
      expiry_date: acct.expiry_date,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // 5. Fetch all messages (limit to recent messages for better performance)
    console.log("Fetching emails...");
    const metaList = await fetchAllMessages(gmail, preciseQuery);

    if (metaList.length === 0) {
      return NextResponse.json({
        matches: [],
        summary: "No emails found in your Gmail account.",
      });
    }

    console.log(`Found ${metaList.length} emails, processing...`);

    // 6. Load full email content and build Documents (process in batches)
    const batchSize = 50;
    const allDocs: Document[] = [];

    for (let i = 0; i < metaList.length; i += batchSize) {
      const batch = metaList.slice(i, i + batchSize);

      const batchDocs = await Promise.all(
        batch.map(async (m) => {
          try {
            const msg = await gmail.users.messages.get({
              userId: "me",
              id: m.id!,
              format: "full",
            });

            const headers = msg.data.payload?.headers ?? [];
            const metadata = extractEmailMetadata(headers, m.id!);
            const content = findPlainTextBody(msg.data.payload);
            return new Document({ pageContent: content, metadata });
          } catch (error) {
            console.error(`Error processing email ${m.id}:`, error);
            return null;
          }
        })
      );

      allDocs.push(...(batchDocs.filter((doc) => doc !== null) as Document[]));
    }

    // 7. Filter documents with valid content for embedding
    const validDocs = allDocs.filter((doc) =>
      isValidDocumentContent(doc.pageContent)
    );

    console.log(
      `Filtered to ${validDocs.length} valid documents from ${allDocs.length} total`
    );

    if (validDocs.length === 0) {
      return NextResponse.json({
        matches: [],
        summary:
          "No emails found with sufficient text content to search through.",
      });
    }

    // 8. Create vector store and perform semantic search
    let topDocs: Document[] = [];
    let summary = "";

    try {
      console.log("Creating embeddings...");
      const embeddings = new OpenAIEmbeddings({
        maxRetries: 3,
        timeout: 60000, // Increased timeout
      });

      // Try MemoryVectorStore first, fallback to custom implementation
      try {
        console.log("Attempting to use MemoryVectorStore...");
        const vectorStore = await MemoryVectorStore.fromDocuments(
          validDocs,
          embeddings
        );
        topDocs = await vectorStore.similaritySearch(queryText.trim(), 5);
        console.log("MemoryVectorStore search successful");
      } catch (memoryStoreError) {
        console.log("MemoryVectorStore failed, using fallback method...");
        console.error("MemoryVectorStore error:", memoryStoreError);

        // Fallback to custom similarity search
        topDocs = await performSimilaritySearch(
          validDocs,
          queryText.trim(),
          embeddings,
          5
        );
        console.log("Fallback similarity search successful");
      }

      // 9. Generate AI summary of the results
      if (topDocs.length > 0) {
        try {
          console.log("Generating AI summary...");
          const chat = new ChatOpenAI({
            temperature: 0,
            maxRetries: 3,
            timeout: 30000,
          });

          const prompt = `User searched for: "${queryText.trim()}"\n\nHere are the most relevant emails found:\n\n${topDocs
            .map(
              (d, i) =>
                `${i + 1}. Subject: ${d.metadata.subject}\n` +
                `   From: ${d.metadata.from}\n` +
                `   Date: ${d.metadata.date}\n` +
                `   Preview: ${d.pageContent
                  .slice(0, 200)
                  .replace(/\s+/g, " ")
                  .trim()}${d.pageContent.length > 200 ? "..." : ""}`
            )
            .join(
              "\n\n"
            )}\n\nPlease provide a helpful summary of these search results, highlighting the key information that matches the user's query.`;

          const response = await chat.invoke([
            {
              role: "system",
              content:
                "You are a helpful email assistant. Summarize the email search results clearly and concisely, focusing on the most relevant information for the user's query.",
            },
            {
              role: "user",
              content: prompt,
            },
          ]);

          summary = response.content as string;
        } catch (llmError) {
          console.error("Error generating AI summary:", llmError);
          summary = `Found ${
            topDocs.length
          } relevant emails matching your search for "${queryText.trim()}".`;
        }
      }
    } catch (embeddingError) {
      console.error("Error with embeddings/vector search:", embeddingError);
      return NextResponse.json(
        {
          error:
            "Failed to process emails for semantic search. Please try again.",
        },
        { status: 500 }
      );
    }

    // 10. Format and return results
    const formattedMatches = topDocs.map((d) => ({
      id: d.metadata.id,
      subject: d.metadata.subject,
      from: d.metadata.from,
      date: d.metadata.date,
      to: d.metadata.to,
      body: d.pageContent,
      preview:
        d.pageContent.slice(0, 300).replace(/\s+/g, " ").trim() +
        (d.pageContent.length > 300 ? "..." : ""),
    }));

    console.log(`Search completed. Found ${formattedMatches.length} matches.`);

    return NextResponse.json({
      matches: formattedMatches,
      summary:
        summary ||
        `Found ${formattedMatches.length} emails matching your search.`,
      totalEmailsProcessed: allDocs.length,
      validEmailsForSearch: validDocs.length,
    });
  } catch (error) {
    console.error("Unexpected error in Gmail search:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while searching your emails." },
      { status: 500 }
    );
  }
}
