import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { db } from "@/lib/db";
import { google_accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId } = await getAuth(req);
  if (!userId) return NextResponse.redirect("/sign-in");

  // 1) load stored tokens
  const [acct] = await db
    .select()
    .from(google_accounts)
    .where(eq(google_accounts.clerk_user_id, userId));
  if (!acct) {
    return NextResponse.json({ messages: [] });
  }

  // 2) set up OAuth client & auto-refresh
  const oAuth2 = new google.auth.OAuth2();
  oAuth2.setCredentials({
    access_token: acct.access_token,
    refresh_token: acct.refresh_token,
    expiry_date: acct.expiry_date,
  });
  oAuth2.on("tokens", async (tokens) => {
    // persist any new access_token/refresh_token
    await db
      .insert(google_accounts)
      .values({
        clerk_user_id: userId,
        access_token: tokens.access_token ?? acct.access_token,
        refresh_token: tokens.refresh_token ?? acct.refresh_token,
        expiry_date: tokens.expiry_date ?? acct.expiry_date,
      })
      .onConflictDoUpdate({
        target: google_accounts.clerk_user_id,
        set: {
          access_token: tokens.access_token ?? acct.access_token,
          refresh_token: tokens.refresh_token ?? acct.refresh_token,
          expiry_date: tokens.expiry_date ?? acct.expiry_date,
        },
      });
  });

  // 3) fetch list of message IDs
  const gmail = google.gmail({ version: "v1", auth: oAuth2 });
  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults: 20,
  });
  const msgs = listRes.data.messages || [];

  // 4) fetch full header info in parallel
  const detailed = await Promise.all(
    msgs.map(async (m) => {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });
      const hdrs = full.data.payload?.headers || [];
      return {
        id: m.id,
        snippet: full.data.snippet,
        subject:
          hdrs.find((h) => h.name === "Subject")?.value || "(no subject)",
        from: hdrs.find((h) => h.name === "From")?.value || "unknown",
        date: hdrs.find((h) => h.name === "Date")?.value || "",
      };
    })
  );

  return NextResponse.json({ messages: detailed });
}
