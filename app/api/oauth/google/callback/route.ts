import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/lib/db";
import { google_accounts } from "@/db/schema";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    console.error("Missing OAuth code or state");
    // redirect back to home with an error query
    return NextResponse.redirect(new URL("/?error=oauth_failed", req.url));
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  let tokens;
  try {
    const resp = await oauth2Client.getToken(code);
    tokens = resp.tokens;
  } catch (err) {
    console.error("Error exchanging code:", err);
    return NextResponse.redirect(
      new URL("/?error=token_exchange_failed", req.url)
    );
  }

  const clerkUserId = state;
  await db
    .insert(google_accounts)
    .values({
      clerk_user_id: clerkUserId,
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      expiry_date: tokens.expiry_date!,
    })
    .onConflictDoUpdate({
      target: google_accounts.clerk_user_id,
      set: {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
        expiry_date: tokens.expiry_date!,
      },
    });

  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  return NextResponse.redirect(`${base}/dashboard`);
}
