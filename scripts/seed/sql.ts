import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { Json, type TableInsert } from "./build";

/** Minimal driver surface shared by `postgres` (real DB) and PGlite (verify). */
export type Exec = (query: string, params?: unknown[]) => Promise<unknown>;

export const MIGRATIONS_DIR = path.resolve("supabase/migrations");

export function listMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({ name: file, sql: readFileSync(path.join(MIGRATIONS_DIR, file), "utf8") }));
}

function toParam(value: unknown): { cast: string; value: unknown } {
  // Sent as text and parsed by Postgres. A bare `::jsonb` cast makes postgres.js
  // JSON-encode the (already encoded) string again, storing a JSON *string*.
  if (value instanceof Json) return { cast: "::text::jsonb", value: JSON.stringify(value.value) };
  if (Array.isArray(value)) return { cast: "::text[]", value };
  return { cast: "", value };
}

/**
 * Keyed copy tables may already hold rows created by data migrations
 * (e.g. 0004 adds `global.footer`) — the seed's values win.
 */
const UPSERT_KEYS: Record<string, string> = {
  site_sections: "key",
  navigation: "key",
  pages: "slug",
  legal_pages: "slug",
};

export async function insertAll(exec: Exec, inserts: TableInsert[]) {
  for (const { table, rows } of inserts) {
    for (const row of rows) {
      const columns = Object.keys(row);
      const params = columns.map((column) => toParam(row[column]));
      const placeholders = params.map((p, i) => `$${i + 1}${p.cast}`);
      const key = UPSERT_KEYS[table];
      const onConflict = key
        ? ` on conflict ("${key}") do update set ${columns
            .filter((c) => c !== key)
            .map((c) => `"${c}" = excluded."${c}"`)
            .join(", ")}`
        : "";
      await exec(
        `insert into ${table} (${columns.map((c) => `"${c}"`).join(", ")}) values (${placeholders.join(", ")})${onConflict}`,
        params.map((p) => p.value),
      );
    }
  }
}
