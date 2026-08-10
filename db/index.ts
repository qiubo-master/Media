import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const globalDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };
const connectionString = process.env.DATABASE_URL || "postgres://preview:preview@127.0.0.1:5432/preview";

export const sql = globalDb.sql ?? postgres(connectionString, { max: 10, idle_timeout: 20 });
if (process.env.NODE_ENV !== "production") globalDb.sql = sql;
export const db = drizzle(sql, { schema });
