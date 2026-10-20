import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

const databaseUrl =
  process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL_MIGRATIONS or DATABASE_URL is not configured.",
  );
}

export default defineConfig({
  dbCredentials: {
    url: databaseUrl,
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
});
