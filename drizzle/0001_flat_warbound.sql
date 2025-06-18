CREATE TABLE "google_accounts" (
	"clerk_user_id" varchar(255) PRIMARY KEY NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expiry_date" bigint
);
