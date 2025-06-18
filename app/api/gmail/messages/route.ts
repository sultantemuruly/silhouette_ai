import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { google, gmail_v1 } from "googleapis";
import { db } from "@/lib/db";
import { google_accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Recursively search payload parts for the first text/plain body.
 */
function findPlainTextBody(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }
  const parts = payload.parts ?? [];
  for (const part of parts) {
    const result = findPlainTextBody(part);
    if (result) {
      return result;
    }
  }
  return "";
}

export async function GET(req: NextRequest) {
  // Authenticate user via Clerk
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json(
      { messages: [], nextPageToken: null },
      { status: 401 }
    );
  }

  // Load OAuth tokens from database
  const [acct] = await db
    .select()
    .from(google_accounts)
    .where(eq(google_accounts.clerk_user_id, userId));

  if (!acct) {
    return NextResponse.json({ messages: [], nextPageToken: null });
  }

  // Set up OAuth2 client
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

  // Parse optional pageToken for pagination
  const { searchParams } = new URL(req.url);
  const pageToken = searchParams.get("pageToken") || undefined;

  // Fetch a batch of message IDs
  let listRes;
  try {
    listRes = await google
      .gmail({ version: "v1", auth: oauth2Client })
      .users.messages.list({ userId: "me", maxResults: 200, pageToken });
  } catch (err: unknown) {
    console.error("Error listing messages:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { messages: [], nextPageToken: null, error: message },
      { status: 400 }
    );
  }

  const messagesMeta = listRes.data.messages || [];
  const nextPageToken = listRes.data.nextPageToken || null;

  // Fetch each message with full payload
  const detailed = await Promise.all(
    messagesMeta.map(async (m) => {
      const msg = await google
        .gmail({ version: "v1", auth: oauth2Client })
        .users.messages.get({ userId: "me", id: m.id!, format: "full" });

      const headers = msg.data.payload?.headers ?? [];
      const subject =
        headers.find((h) => h.name === "Subject")?.value || "(no subject)";
      const from =
        headers.find((h) => h.name === "From")?.value || "(unknown sender)";
      const date = headers.find((h) => h.name === "Date")?.value || "";
      const snippet = msg.data.snippet || "";

      // Extract full plain-text body
      const body = findPlainTextBody(msg.data.payload);

      return { id: m.id!, subject, from, date, snippet, body };
    })
  );

  return NextResponse.json({ messages: detailed, nextPageToken });
}
