import "server-only";

import { createClient } from "@/lib/supabase/server";

/** Row counts for the given tables, fetched in parallel (head-only requests). */
export async function countRows(tables: string[]): Promise<Record<string, number | null>> {
  const supabase = await createClient();
  const results = await Promise.all(
    tables.map(async (table) => {
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
      return [table, error ? null : count] as const;
    }),
  );
  return Object.fromEntries(results);
}
