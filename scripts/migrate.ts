/**
 * Apply supabase/migrations/*.sql to the Supabase Postgres database, in order,
 * exactly once each. Applied migrations are tracked in cms_private.migrations.
 *
 *   npm run db:migrate
 */
import postgres from "postgres";

import { listMigrations } from "./seed/sql";

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set (see .env.example)");

  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await sql`create schema if not exists cms_private`;
    await sql`create table if not exists cms_private.migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`;
    const applied = new Set((await sql`select name from cms_private.migrations`).map((r) => r.name as string));

    const pending = listMigrations().filter((m) => !applied.has(m.name));
    if (!pending.length) {
      console.log("✓ Database is up to date");
      return;
    }
    for (const migration of pending) {
      await sql.begin(async (tx) => {
        await tx.unsafe(migration.sql);
        await tx`insert into cms_private.migrations (name) values (${migration.name})`;
      });
      console.log(`✓ Applied ${migration.name}`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(`✗ ${error.message ?? error}`);
  process.exit(1);
});
