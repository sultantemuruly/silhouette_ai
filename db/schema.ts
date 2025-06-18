import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  bigint,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerk_id: varchar("clerk_id", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  first_name: varchar("first_name", { length: 128 }).notNull(),
  last_name: varchar("last_name", { length: 128 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const google_accounts = pgTable("google_accounts", {
  clerk_user_id: varchar({ length: 255 }).primaryKey(),
  access_token: text(),
  refresh_token: text(),
  expiry_date: bigint({ mode: "number" }),
});
