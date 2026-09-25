/**
 * Check the LIVE Supabase project from a visitor's point of view (public key, RLS applied).
 *
 *   npm run db:check
 */
import { createClient } from "@supabase/supabase-js";

const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
});
let fail = 0;
const check = (l: string, ok: boolean, d = "") => { console.log(`${ok ? "✓" : "✗"} ${l}${ok ? "" : " — " + d}`); if (!ok) fail++; };
(async () => {
  for (const t of ["projects", "posts", "courses", "media", "site_sections", "pages", "faqs"]) {
    const { count, error } = await anon.from(t).select("*", { count: "exact", head: true });
    check(`public can read ${t} (${count})`, !error && (count ?? 0) > 0, error?.message ?? "0 rows");
  }
  const { data: p, error: pe } = await anon.from("projects").select("slug,title,portfolio_categories(name),project_images(count)").order("sort_order").limit(1).single();
  check(`joins work: ${p?.slug} / ${(p as { portfolio_categories?: { name?: string } } | null)?.portfolio_categories?.name}`, !pe && !!p, pe?.message);
  const { data: m } = await anon.from("media").select("storage_path").eq("legacy_key", "hero").single();
  const img = anon.storage.from("media").getPublicUrl(m!.storage_path).data.publicUrl;
  const r = await fetch(img);
  check(`public image served (${r.status} ${r.headers.get("content-type")})`, r.ok);
  const { error: we } = await anon.from("faqs").insert({ topic: "x", question: "y", answer: "z" });
  check("public cannot write", !!we, "insert succeeded!");
  const { data: sub } = await anon.from("submissions").select("id");
  check("public cannot read inbox", (sub ?? []).length === 0);
  const { data: adm } = await anon.from("admin_users").select("id");
  check("public cannot list admins", (adm ?? []).length === 0);
  const up = await anon.storage.from("media").upload("hack.txt", new Blob(["x"]), { contentType: "image/png" });
  check("public cannot upload images", !!up.error, "upload succeeded!");
  console.log(fail ? `\n✗ ${fail} failed` : "\n✓ live checks passed");
  process.exit(fail ? 1 : 0);
})();
