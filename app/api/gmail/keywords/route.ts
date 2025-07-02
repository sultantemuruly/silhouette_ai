import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { google, gmail_v1 } from "googleapis";
import { db } from "@/lib/db";
import { google_accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractKeywordsFromQuery } from "@/agents/keywords/keywords-agent";

// Helper to extract plain text from Gmail message payload
function findPlainTextBody(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    try {
      const decoded = Buffer.from(payload.body.data, "base64").toString("utf-8");
      return decoded.trim();
    } catch {
      return "";
    }
  }
  if (payload.mimeType?.startsWith("multipart/")) {
    const parts = payload.parts ?? [];
    for (const part of parts) {
      const result = findPlainTextBody(part);
      if (result && result.trim().length > 0) return result;
    }
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { query } = requestBody;
    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json({ error: "Query is required and must be at least 3 characters." }, { status: 400 });
    }

    // 3. Extract keywords
    const keywords = await extractKeywordsFromQuery(query);
    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ error: "No keywords could be extracted from the query." }, { status: 400 });
    }

    // 4. Build Gmail search query
    // Join keywords with OR for broader match, quote multi-word keywords
    const gmailQuery = keywords.map(k => k.includes(" ") ? `\"${k}\"` : k).join(" OR ");

    // 5. Load OAuth tokens
    const [acct] = await db
      .select()
      .from(google_accounts)
      .where(eq(google_accounts.clerk_user_id, userId));
    if (!acct) {
      return NextResponse.json({ error: "No Google account linked." }, { status: 400 });
    }

    // 6. Set up Gmail client
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

    // 7. Fetch up to 100 matching emails (to allow for post-filtering)
    let listRes;
    try {
      listRes = await gmail.users.messages.list({
        userId: "me",
        q: gmailQuery,
        maxResults: 100,
      });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to fetch emails from Gmail." }, { status: 500 });
    }
    const messagesMeta = listRes.data.messages || [];
    if (messagesMeta.length === 0) {
      return NextResponse.json({ emails: [], keywords });
    }

    // 8. Fetch metadata and plain text for each email
    const emails = await Promise.all(
      messagesMeta.map(async (m) => {
        try {
          const msg = await gmail.users.messages.get({
            userId: "me",
            id: m.id!,
            format: "full",
          });
          const headers = (msg.data.payload?.headers ?? []) as gmail_v1.Schema$MessagePartHeader[];
          return {
            id: m.id!,
            subject: headers.find((h) => h.name === "Subject")?.value ?? "(no subject)",
            from: headers.find((h) => h.name === "From")?.value ?? "(unknown sender)",
            date: headers.find((h) => h.name === "Date")?.value ?? "(no date)",
            body: findPlainTextBody(msg.data.payload),
          };
        } catch {
          return null;
        }
      })
    );

    // 9. Post-filter: Only include emails that are truly relevant to the keywords
    // - For company/person keywords: sender domain must contain the keyword (e.g., 'amazon' in 'from')
    // - For all keywords: require a whole word match (regex) in subject, from, or body (case-insensitive)
    // - Only include emails that pass at least one of these checks

    // Known company keywords (expand as needed)
    const knownCompanies = [
      "amazon", "aws", "google", "microsoft", "linkedin", "facebook", "meta", "apple", "twitter", "openai", "github", "dropbox", "stripe", "paypal", "notion", "slack", "zoom", "atlassian", "airbnb", "uber", "lyft"
    ];

    function isCompanyKeyword(kw: string) {
      return knownCompanies.includes(kw.toLowerCase()) || /^[A-Z][a-zA-Z]+$/.test(kw);
    }

    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    const filteredEmails = emails.filter((email) => {
      if (!email) return false;
      const subject = email.subject || "";
      const from = email.from || "";
      const body = email.body || "";
      // Check for each keyword
      return keywords.some((kw, i) => {
        const lowerKw = lowerKeywords[i];
        // Whole word regex (case-insensitive)
        const wordRegex = new RegExp(`\\b${lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i");
        // Sender domain/company check
        let senderMatch = false;
        if (isCompanyKeyword(kw)) {
          // Check if the sender's email address contains the keyword (e.g., 'amazon' in 'from')
          senderMatch = from.toLowerCase().includes(lowerKw);
        }
        // Whole word match in subject, from, or body
        const wordMatch = wordRegex.test(subject) || wordRegex.test(from) || wordRegex.test(body);
        // Include if either check passes
        return senderMatch || wordMatch;
      });
    });

    // 10. Return up to 50 filtered emails
    return NextResponse.json({ emails: filteredEmails.slice(0, 50), keywords });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
} 