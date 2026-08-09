import postgres from "postgres";
import { readFile } from "node:fs/promises";

const connection = process.env.DATABASE_URL;
if (!connection) throw new Error("DATABASE_URL is required");
const sql = postgres(connection, { max: 1 });
const migration = await readFile(new URL("../db/migrations/0001_initial.sql", import.meta.url), "utf8");
await sql.unsafe(migration);
await sql.end();
console.log("Database migration completed.");
