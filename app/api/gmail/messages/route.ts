import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { db } from "@/lib/db";
import { google_accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  // 1. Auth
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json(
      { messages: [], nextPageToken: null },
      { status: 401 }
    );
  }

  // 2. Load OAuth tokens
  const [acct] = await db
    .select()
    .from(google_accounts)
    .where(eq(google_accounts.clerk_user_id, userId));

  if (!acct) {
    return NextResponse.json({ messages: [], nextPageToken: null });
  }

  // 3. Set up Gmail client
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

  // 4. Parse pagination and mailCount
  const { searchParams } = new URL(req.url);
  const pageToken = searchParams.get("pageToken") || undefined;
  // mailCount param: how many emails to fetch (default 50, min 1, max 50)
  let mailCount = parseInt(searchParams.get("mailCount") || "50", 10);
  if (isNaN(mailCount) || mailCount < 1) mailCount = 50;
  if (mailCount > 50) mailCount = 50;

  // 5. List message IDs (always "all")
  let listRes;
  try {
    listRes = await gmail.users.messages.list({
      userId: "me",
      q: "in:all",
      maxResults: mailCount,
      pageToken,
    });
  } catch (err) {
    console.error("Gmail list error:", err);
    return NextResponse.json(
      { messages: [], nextPageToken: null, error: err },
      { status: 400 }
    );
  }

  const messagesMeta = listRes.data.messages || [];
  const nextPageToken = listRes.data.nextPageToken || null;

  // 6. Fetch headers + snippet
  const previews = await Promise.all(
    messagesMeta.map(async (m) => {
      try {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: m.id!,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
        });
        const headers = msg.data.payload?.headers || [];
        return {
          id: m.id!,
          subject:
            headers.find((h) => h.name === "Subject")?.value ?? "(no subject)",
          from:
            headers.find((h) => h.name === "From")?.value ?? "(unknown sender)",
          date: headers.find((h) => h.name === "Date")?.value ?? "(no date)",
          snippet: msg.data.snippet ?? "",
        };
      } catch (e) {
        console.warn("Skipping message", m.id, e);
        return null;
      }
    })
  );

  return NextResponse.json({
    messages: previews.filter((m) => m !== null),
    nextPageToken,
  });
}
