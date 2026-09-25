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
  if (value instanceof Json) return { cast: "::jsonb", value: JSON.stringify(value.value) };
  if (Array.isArray(value)) return { cast: "::text[]", value };
  return { cast: "", value };
}

export async function insertAll(exec: Exec, inserts: TableInsert[]) {
  for (const { table, rows } of inserts) {
    for (const row of rows) {
      const columns = Object.keys(row);
      const params = columns.map((column) => toParam(row[column]));
      const placeholders = params.map((p, i) => `$${i + 1}${p.cast}`);
      await exec(
        `insert into ${table} (${columns.map((c) => `"${c}"`).join(", ")}) values (${placeholders.join(", ")})`,
        params.map((p) => p.value),
      );
    }
  }
}
