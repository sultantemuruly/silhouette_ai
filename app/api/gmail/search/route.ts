import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { google, gmail_v1 } from "googleapis";
import { AzureOpenAIEmbeddings, AzureChatOpenAI } from "@langchain/openai";
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
  embeddings: AzureOpenAIEmbeddings,
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
    const similarities = docEmbeddings.map((docEmb: number[], index: number) => ({
      document: documents[index],
      similarity: cosineSimilarity(queryEmbedding, docEmb),
    }));

    // Sort by similarity and return top K
    return similarities
      .sort((a: {document: Document, similarity: number}, b: {document: Document, similarity: number}) => b.similarity - a.similarity)
      .slice(0, topK)
      .map((item: {document: Document, similarity: number}) => item.document);
  } catch (error) {
    console.error("Error in fallback similarity search:", error);
    throw error;
  }
}

/**
 * Fetches messages with pagination support
 */
async function fetchMessagesWithPagination(
  gmail: gmail_v1.Gmail,
  query: string,
  limit: number = 50,
  pageToken?: string
): Promise<{
  messages: gmail_v1.Schema$Message[];
  nextPageToken?: string;
  totalCount?: number;
}> {
  try {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: limit,
      pageToken,
    });

    return {
      messages: res.data.messages ?? [],
      nextPageToken: res.data.nextPageToken || undefined,
      totalCount: res.data.resultSizeEstimate || undefined,
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw new Error("Failed to fetch emails from Gmail");
  }
}

/**
 * Extracts main keywords from a natural language query.
 * For now, uses a simple regex to find the longest word or capitalized words.
 * In production, you could use an LLM or NLP library for better results.
 */
function extractKeywords(query: string): string {
  // If the query is a question or long sentence, try to extract main words
  // Remove common question words
  const stopwords = [
    "what",
    "whats",
    "who",
    "where",
    "when",
    "why",
    "how",
    "is",
    "are",
    "the",
    "a",
    "an",
    "with",
    "about",
    "on",
    "in",
    "for",
    "to",
    "of",
    "do",
    "does",
    "did",
    "going",
  ];
  const cleaned = query.toLowerCase().replace(/[?.,!]/g, "");
  let words = cleaned
    .split(/\s+/)
    .filter((w) => !stopwords.includes(w) && w.length > 2);
  // If nothing left, fallback to all words
  if (words.length === 0) words = cleaned.split(/\s+/);
  // If still nothing, fallback to original query
  if (words.length === 0) return query;
  // Return the most likely keyword (longest word or all joined)
  // For now, join all remaining words
  return words.join(" ");
}

// Helper for Azure OpenAI config (chat)
const azureOpenAIChatConfig = {
  model: "gpt-4o",
  temperature: 0,
  maxRetries: 2,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME_1!,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION_1!,
};

// Helper for Azure OpenAI config (embeddings)
const azureOpenAIEmbeddingsConfig = {
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME_2!,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION_2!,
};

/**
 * Uses LLM to generate the best Gmail search query for a user's natural language query.
 */
async function llmGenerateGmailQuery(
  userQuery: string
): Promise<string | null> {
  try {
    const chat = new AzureChatOpenAI({
      ...azureOpenAIChatConfig,
    });
    const prompt = `You are an expert at searching Gmail. Given a user's natural language query, generate the most effective Gmail search query using Gmail's search operators. Only output the Gmail search string, nothing else.\n\nExamples:\nUser query: \"Any new from amazon?\"\nGmail search: from:amazon newer_than:7d\n\nUser query: \"Invoices from John last month\"\nGmail search: from:john subject:invoice after:2024/05/01 before:2024/06/01\n\nUser query: \"Did I get a password reset email?\"\nGmail search: subject:password reset\n\nUser query: \"${userQuery}\"\nGmail search:`;
    const response = await chat.invoke([
      {
        role: "system",
        content:
          "You are an expert at searching Gmail. Given a user's natural language query, generate the most effective Gmail search query using Gmail's search operators. Only output the Gmail search string, nothing else.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);
    // Extract the search string from the LLM response
    const text = (response.content as string).trim();
    // Only take the first line, remove any prefix
    const match = text.match(/Gmail search:\s*(.*)/i);
    if (match) return match[1].trim();
    // If not, just return the whole text
    return text;
  } catch (err) {
    console.error("LLM Gmail query generation failed:", err);
    return null;
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

    const { queryText, pageToken, limit = 50 } = requestBody;
    // Preprocess query: if it's a question or sentence, extract keywords
    let searchQuery = queryText;
    if (/[?]/.test(queryText) || queryText.split(" ").length > 3) {
      // Try LLM-powered query interpreter first
      const llmQuery = await llmGenerateGmailQuery(queryText);
      if (llmQuery && llmQuery.length > 0) {
        searchQuery = llmQuery;
      } else {
        searchQuery = extractKeywords(queryText);
      }
    }

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

    // 5. Fetch messages with pagination
    console.log(
      `Fetching emails... (limit: ${limit}, pageToken: ${pageToken || "none"})`
    );
    const {
      messages: metaList,
      nextPageToken,
      totalCount,
    } = await fetchMessagesWithPagination(gmail, "in:all", limit, pageToken);

    if (metaList.length === 0) {
      return NextResponse.json({
        matches: [],
        summary: pageToken
          ? "No more emails found."
          : "No emails found in your Gmail account.",
        nextPageToken: undefined,
        totalCount: 0,
        currentBatch: 0,
        hasMore: false,
        batchSize: 0,
        batchMatches: 0,
      });
    }

    console.log(`Found ${metaList.length} emails, processing...`);

    // 6. Load full email content for this batch
    const allDocs: Document[] = [];
    const batchPromises = metaList.map(async (m) => {
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
    });

    const batchDocs = await Promise.all(batchPromises);
    allDocs.push(...(batchDocs.filter((doc) => doc !== null) as Document[]));

    // 7. Filter documents with valid content for embedding
    const validDocs = allDocs.filter((doc) =>
      isValidDocumentContent(doc.pageContent)
    );

    console.log(
      `Filtered to ${validDocs.length} valid documents from ${allDocs.length} total`
    );

    // Only search within this batch
    const docsForEmbedding = validDocs;

    if (validDocs.length === 0) {
      return NextResponse.json({
        matches: [],
        summary:
          "No emails found with sufficient text content to search through.",
        nextPageToken,
        totalCount,
        currentBatch: metaList.length,
        hasMore: !!nextPageToken,
        batchSize: metaList.length,
        batchMatches: 0,
      });
    }

    // 8. Create vector store and perform semantic search within this batch
    let topDocs: Document[] = [];
    let summary = "";
    
    try {
      console.log("Creating embeddings...");
      const embeddings = new AzureOpenAIEmbeddings({
        ...azureOpenAIEmbeddingsConfig,
        maxRetries: 3,
        timeout: 60000,
      });

      // Try MemoryVectorStore first, fallback to custom implementation
      try {
        console.log("Attempting to use MemoryVectorStore...");
        const vectorStore = await MemoryVectorStore.fromDocuments(
          docsForEmbedding,
          embeddings
          
        );
        topDocs = await vectorStore.similaritySearch(
          searchQuery.trim(),
          Math.min(docsForEmbedding.length, 10)
        );
        console.log("MemoryVectorStore search successful");
      } catch (memoryStoreError) {
        console.log("MemoryVectorStore failed, using fallback method...");
        console.error("MemoryVectorStore error:", memoryStoreError);

        topDocs = await performSimilaritySearch(
          docsForEmbedding,
          searchQuery.trim(),
          embeddings,
          Math.min(docsForEmbedding.length, 10)
        );
        console.log("Fallback similarity search successful");
      }

      // 9. Generate AI summary of the results
      if (topDocs.length > 0) {
        try {
          console.log("Generating AI summary...");
          const chat = new AzureChatOpenAI({
            ...azureOpenAIChatConfig,
          });

          const batchInfo = ` (showing results from this batch of ${metaList.length} emails)`;

          const prompt = `User searched for: "${searchQuery.trim()}"

Here are the most relevant emails found${batchInfo}:

${topDocs
  .map(
    (d, i) =>
      `${i + 1}. Subject: ${d.metadata.subject}
` +
      `   From: ${d.metadata.from}
` +
      `   Date: ${d.metadata.date}
` +
      `   Preview: ${d.pageContent.slice(0, 200).replace(/\s+/g, " ").trim()}${
        d.pageContent.length > 200 ? "..." : ""
      }`
  )
  .join("\n\n")}

Please provide a helpful summary of these search results, highlighting the key information that matches the user's query. ${
            nextPageToken
              ? "Note that there are more emails available if the user wants to search further."
              : ""
          }`;

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
          const batchInfo = ` from this batch of ${metaList.length} emails`;
          summary = `Found ${
            topDocs.length
          } relevant emails matching your search for "${searchQuery.trim()}"${batchInfo}.${
            nextPageToken ? " More emails are available to search." : ""
          }`;
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

    console.log(
      `Search completed. Found ${formattedMatches.length} matches in this batch.`
    );

    return NextResponse.json({
      matches: formattedMatches,
      summary,
      nextPageToken,
      totalCount,
      currentBatch: metaList.length,
      hasMore: !!nextPageToken,
      batchSize: metaList.length,
      batchMatches: formattedMatches.length,
    });
  } catch (error) {
    console.error("Unexpected error in Gmail search:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while searching your emails." },
      { status: 500 }
    );
  }
}
