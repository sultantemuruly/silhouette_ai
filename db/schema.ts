import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  bigint,
  boolean,
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

export const scheduled_emails = pgTable("scheduled_emails", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id", { length: 64 }).references(() => users.clerk_id),
  sender: varchar("sender", { length: 256 }).notNull(),
  recipient: varchar("recipient", { length: 256 }).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  content: text().notNull(),
  scheduled_date: timestamp("scheduled_date").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  status: varchar("status", { length: 16 }).notNull().default('pending'),
  timezone: varchar("timezone", { length: 64 }),
});

export const email_templates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id", { length: 64 }).notNull().references(() => users.clerk_id),
  name: varchar("name", { length: 128 }).notNull().default('Untitled'),
  prompt: text().notNull(),
  html: text().notNull(), 
  created_at: timestamp("created_at").defaultNow().notNull(),
  is_public: boolean("is_public").notNull().default(false),
});
