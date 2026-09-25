/**
 * Seed Supabase with everything the live website currently shows.
 *
 *   npm run db:seed              first-time seed (refuses if content already exists)
 *   npm run db:seed -- --reset   wipe CMS content + re-seed (admins & inbox are kept)
 *
 * Source of truth: supabase/seed/content.json + supabase/seed/images/
 * (regenerate with `npm run content:snapshot`).
 */
import { readFileSync } from "node:fs";

import postgres from "postgres";

import { createAdminClient } from "./lib/supabase-admin";
import { buildSeedPlan, CONTENT_TABLES } from "./seed/build";
import { insertAll } from "./seed/sql";

const BUCKET = "media";

async function main() {
  const reset = process.argv.includes("--reset");
  const { SUPABASE_DB_URL } = process.env;
  if (!SUPABASE_DB_URL) throw new Error("SUPABASE_DB_URL must be set in .env.local");

  // Build (and validate) the whole plan before touching anything remote.
  const plan = buildSeedPlan("supabase/seed");

  const sql = postgres(SUPABASE_DB_URL, { max: 1, onnotice: () => {} });
  const supabase = createAdminClient();

  try {
    const [{ count }] = await sql`select count(*)::int as count from site_settings`;
    if (count > 0 && !reset) {
      throw new Error("Content already exists. Re-run with `-- --reset` to wipe CMS content and re-seed.");
    }

    // 1. Upload images (upsert keeps this re-runnable).
    for (const m of plan.media) {
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(m.storagePath, readFileSync(m.localFile), { contentType: "image/jpeg", upsert: true });
      if (error) throw new Error(`Upload failed for ${m.storagePath}: ${error.message}`);
      console.log(`  ↑ ${m.storagePath}`);
    }

    // 2. Insert all rows in ONE transaction — all or nothing.
    await sql.begin(async (tx) => {
      if (reset) {
        await tx.unsafe(`truncate ${CONTENT_TABLES.join(", ")} restart identity cascade`);
        console.log("  ✗ Cleared existing CMS content");
      }
      await insertAll((query, params) => tx.unsafe(query, params as never[]), plan.inserts);
    });

    console.log("\n✓ Seed complete");
    console.table(plan.summary);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error.message ?? error}`);
  process.exit(1);
});
