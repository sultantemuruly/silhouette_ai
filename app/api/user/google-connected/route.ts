import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { google_accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ connected: false });

  const account = await db
    .select()
    .from(google_accounts)
    .where(eq(google_accounts.clerk_user_id, userId))
    .limit(1);

  return NextResponse.json({ connected: account.length > 0 });
}
