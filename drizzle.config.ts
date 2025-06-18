import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql", // “postgresql” is the dialect for Neon/Postgres
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
