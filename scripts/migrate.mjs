import postgres from "postgres";
import { readFile, readdir } from "node:fs/promises";

const connection = process.env.DATABASE_URL;
if (!connection) throw new Error("DATABASE_URL is required");
const sql = postgres(connection, { max: 1 });
await sql.unsafe("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
const migrationsUrl = new URL("../db/migrations/", import.meta.url);
const migrations = (await readdir(migrationsUrl)).filter((name) => name.endsWith(".sql")).sort();
for (const name of migrations) {
  const [applied] = await sql`SELECT name FROM schema_migrations WHERE name = ${name}`;
  if (applied) continue;
  const migration = await readFile(new URL(name, migrationsUrl), "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(migration);
    await tx`INSERT INTO schema_migrations (name) VALUES (${name})`;
  });
  console.log(`Applied migration: ${name}`);
}
await sql.end();
console.log("Database migration completed.");
