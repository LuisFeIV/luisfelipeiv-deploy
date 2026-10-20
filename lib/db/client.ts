import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

type DatabaseClient = ReturnType<typeof drizzle<typeof schema>>;

let database: DatabaseClient | null = null;

export function getDatabase() {
  if (database) {
    return database;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  database = drizzle({ client: neon(databaseUrl), schema });

  return database;
}
