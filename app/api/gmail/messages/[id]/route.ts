import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { google, gmail_v1 } from "googleapis";
import { db } from "@/lib/db";
import { google_accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

// Recursively find the first text/html part
function findHtmlBody(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }
  for (const part of payload.parts ?? []) {
    const result = findHtmlBody(part);
    if (result) return result;
  }
  return "";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Auth
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Load OAuth tokens
  const [acct] = await db
    .select()
    .from(google_accounts)
    .where(eq(google_accounts.clerk_user_id, userId));

  if (!acct) {
    return NextResponse.json(
      { error: "No Google account linked" },
      { status: 400 }
    );
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

  // 4. Fetch full message
  let msg;
  try {
    const res = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });
    msg = res.data;
  } catch (err) {
    console.error("Gmail get error:", err);
    return NextResponse.json({ error: err }, { status: 400 });
  }

  const headers = msg.payload?.headers ?? [];
  const body = findHtmlBody(msg.payload);

  return NextResponse.json({
    id,
    subject: headers.find((h) => h.name === "Subject")?.value || "",
    from: headers.find((h) => h.name === "From")?.value || "",
    date: headers.find((h) => h.name === "Date")?.value || "",
    html: body,
  });
}
