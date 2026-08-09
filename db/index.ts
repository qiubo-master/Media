import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const globalDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

export const sql = globalDb.sql ?? postgres(connectionString, { max: 10, idle_timeout: 20 });
if (process.env.NODE_ENV !== "production") globalDb.sql = sql;
export const db = drizzle(sql, { schema });
