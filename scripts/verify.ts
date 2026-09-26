/**
 * Offline verification — no Supabase project needed.
 *
 *   npm run db:verify
 *
 * Boots an in-memory Postgres (PGlite) with stand-ins for Supabase's `auth` and
 * `storage` schemas, then:
 *   1. applies every migration,
 *   2. runs the full seed plan (coverage + consistency checks included),
 *   3. reads content back and compares it with the website snapshot,
 *   4. exercises the Row Level Security rules as anon / signed-in / admin users.
 */
import { readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";

import { buildSeedPlan } from "./seed/build";
import { insertAll, listMigrations } from "./seed/sql";

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

  create schema storage;
  create table storage.buckets (
    id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;

  -- Supabase grants table privileges to API roles; RLS is what actually protects rows.
  grant usage on schema public, auth, storage to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;

/** JSON with object keys sorted — jsonb does not preserve key order (arrays keep theirs). */
const canon = (value: unknown): string =>
  JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
const same = (a: unknown, b: unknown) => canon(a) === canon(b);

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : ` — ${detail}`}`);
  if (!ok) failures++;
}

async function main() {
  const db = new PGlite();
  const exec = (query: string, params?: unknown[]) => db.query(query, params);
  const one = async <T = Record<string, unknown>>(query: string, params?: unknown[]) =>
    (await db.query<T>(query, params)).rows[0];

  console.log("\n1. Migrations");
  await db.exec(SUPABASE_STUBS);
  for (const m of listMigrations()) {
    await db.exec(m.sql);
    check(m.name, true);
  }

  console.log("\n2. Seed");
  const plan = buildSeedPlan("supabase/seed");
  check("coverage: every website content export is mapped", true);
  check("consistency: duplicated home/about data is identical", true);
  await insertAll(exec, plan.inserts);
  for (const [table, expected] of Object.entries(plan.summary)) {
    const { count } = (await one<{ count: number }>(`select count(*)::int as count from ${table}`))!;
    check(`${table}: ${count} rows`, count === expected, `expected ${expected}`);
  }

  const jsonColumns: [string, string][] = [
    ["site_settings", "social"],
    ["site_settings", "seo"],
    ["pages", "header"],
    ["pages", "cta"],
    ["site_sections", "data"],
    ["navigation", "data"],
    ["posts", "body"],
    ["legal_pages", "sections"],
  ];
  for (const [table, column] of jsonColumns) {
    const bad = await one<{ count: number }>(
      `select count(*)::int as count from ${table} where jsonb_typeof(${column}) = 'string'`,
    );
    check(`${table}.${column} holds real JSON (not strings)`, bad!.count === 0, `${bad!.count} double-encoded`);
  }

  console.log("\n3. Round-trip against the website snapshot");
  const content = JSON.parse(readFileSync("supabase/seed/content.json", "utf8"));

  const projects = (
    await db.query<Record<string, unknown>>(`
      select p.slug, p.title, c.name as category, p.client, p.location, p.year, m.legacy_key as image,
             p.story, p.challenge, p.solution, p.result, p.services,
             json_build_object('quote', p.testimonial_quote, 'author', p.testimonial_author,
                               'role', p.testimonial_role) as testimonial
      from projects p
      join portfolio_categories c on c.id = p.category_id
      join media m on m.id = p.cover_id
      order by p.sort_order`)
  ).rows;
  check("projects match portfolio.ts exactly", same(projects, content.portfolio.projects));

  const featured = (
    await db.query<{ slug: string }>(`select p.slug from projects p where is_featured order by featured_order`)
  ).rows.map((r) => r.slug);
  check(
    "home featured work order preserved",
    same(featured, content.home.featuredWorkSection.works.map((w: { slug: string }) => w.slug)),
  );

  const courses = (
    await db.query(`select slug, title, level, duration, fee, batch, trainer, summary, curriculum, careers
                    from courses order by sort_order`)
  ).rows;
  check("courses match academy.ts exactly", same(courses, content.academy.courses));

  const posts = (
    await db.query<{ date: string }>(`
      select p.slug, p.title, c.name as category, to_char(p.published_on, 'FMDD FMMonth YYYY') as date,
             p.read_time as read, p.excerpt
      from posts p join blog_categories c on c.id = p.category_id order by p.published_on desc`)
  ).rows.map((p) => ({ ...p, date: p.date.replace(/^(\d)\s/, "0$1 ") }));
  check("posts match blog.ts exactly", same(posts, content.blog.posts));

  const body = await one<{ body: unknown }>(`select body from posts limit 1`);
  check("article body stored as blocks", same(body!.body, content.blog.articleBody));

  const faqGroups = (
    await db.query<{ topic: string; items: unknown }>(`
      select topic, json_agg(json_build_object('question', question, 'answer', answer) order by sort_order) as items
      from faqs group by topic, topic_order order by topic_order`)
  ).rows;
  check("FAQ groups match faq.ts exactly", same(faqGroups, content.faq.faqGroups));

  const settings = await one<Record<string, unknown>>(
    `select name, legal_name as "legalName", tagline, title, description, url, phone, whatsapp, email,
            address, hours, social from site_settings`,
  );
  check("site settings match site-config.ts", same(settings, content["site-config"].siteConfig));

  const legal = await one<{ sections: unknown }>(`select sections from legal_pages where slug = 'privacy'`);
  check("privacy policy sections intact", same(legal!.sections, content.legal.privacyPolicy.sections));

  const nav = await one<{ data: unknown }>(`select data from navigation where key = 'mega'`);
  check("mega menu intact", same(nav!.data, content.navigation.megaMenu));

  const hero = await one<{ data: Record<string, unknown> }>(`select data from site_sections where key = 'home.hero'`);
  check(
    "home hero merges content + JSX copy",
    hero!.data.eyebrow === content.home.homeHero.eyebrow && Array.isArray(hero!.data.headline),
  );

  const dangling = await one<{ count: number }>(`
    select count(*)::int as count from site_sections s,
      jsonb_path_query(s.data, 'strict $.**.image_id') as ref
    where not exists (select 1 from media m where m.id::text = ref #>> '{}')`);
  check("every image_id in section copy points at a media row", dangling!.count === 0, `${dangling!.count} dangling`);

  // Every piece of text in the website snapshot must exist somewhere in the database.
  const leaves = (value: unknown, out = new Set<string>()): Set<string> => {
    if (typeof value === "string") out.add(value);
    else if (Array.isArray(value)) value.forEach((v) => leaves(v, out));
    else if (value && typeof value === "object") Object.values(value).forEach((v) => leaves(v, out));
    return out;
  };
  const dbStrings = new Set<string>();
  for (const table of Object.keys(plan.summary)) {
    const { rows } = await db.query<{ r: unknown }>(`select to_jsonb(t) as r from ${table} t`);
    rows.forEach((row) => leaves(row.r, dbStrings));
  }
  const imageKeys = new Set<string>([
    ...Object.keys(content.images.images),
    ...(Object.values(content.images.images) as string[]),
  ]);
  const postDates = new Set(content.blog.posts.map((p: { date: string }) => p.date)); // stored as a real date
  const settings0 = content["site-config"].siteConfig;
  // Contact channel links are built from settings at render time (see contact.channels `field`).
  const derivedLinks = new Set([`tel:${settings0.phone}`, `mailto:${settings0.email}`]);
  const siteText = leaves(content);
  const missingText = [...siteText].filter(
    (text) => !dbStrings.has(text) && !imageKeys.has(text) && !postDates.has(text) && !derivedLinks.has(text) && text !== "All",
  );
  check(
    `all ${siteText.size} text values from the site are in the database`,
    missingText.length === 0,
    `missing: ${JSON.stringify(missingText.slice(0, 10))}`,
  );

  console.log("\n3b. Phase 1 helpers");
  const usage = await one<{ count: number }>(
    `select count(*)::int as count from media_usage u join media m on m.id = u.media_id where m.legacy_key = 'studio'`,
  );
  check(`media_usage finds every use of the studio image (${usage!.count})`, usage!.count > 10);
  const order = (await db.query<{ id: string }>(`select id from portfolio_categories order by sort_order`)).rows.map(
    (r) => r.id,
  );
  await db.query(`select reorder_rows('portfolio_categories', 'sort_order', $1::uuid[])`, [[...order].reverse()]);
  const reordered = (
    await db.query<{ id: string }>(`select id from portfolio_categories order by sort_order`)
  ).rows.map((r) => r.id);
  check("reorder_rows reverses category order", same(reordered, [...order].reverse()));
  await db.query(`select reorder_rows('portfolio_categories', 'sort_order', $1::uuid[])`, [order]);
  check(
    "reorder_rows rejects non-whitelisted tables",
    await db.query(`select reorder_rows('admin_users', 'role', '{}'::uuid[])`).then(
      () => false,
      () => true,
    ),
  );
  const proj = await one<{ id: string }>(`select id from projects where slug = 'aurum-timepieces'`);
  const heroMedia = await one<{ id: string }>(`select id from media where legacy_key = 'hero'`);
  await db.query(`select set_project_gallery($1, $2::jsonb)`, [
    proj!.id,
    JSON.stringify([
      { media_id: heroMedia!.id, caption: "A" },
      { media_id: heroMedia!.id, caption: "B" },
    ]),
  ]);
  const gal = (
    await db.query<{ caption: string }>(`select caption from project_images where project_id = $1 order by sort_order`, [
      proj!.id,
    ])
  ).rows;
  check("set_project_gallery replaces the gallery in order", same(gal.map((g) => g.caption), ["A", "B"]));

  console.log("\n4. Row Level Security");
  const asRole = async (role: "anon" | "authenticated", userId: string | null, fn: () => Promise<void>) => {
    await db.exec(`set role ${role}`);
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? ""]);
    try {
      await fn();
    } finally {
      await db.exec(`reset role`);
      await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
    }
  };
  const fails = async (query: string) => {
    try {
      await db.query(query);
      return false;
    } catch {
      return true;
    }
  };

  // Put one project in draft + one inbox message, as the superuser.
  await db.exec(`update projects set status = 'draft' where slug = 'noir-couture'`);
  await db.exec(`insert into submissions (kind, name, email) values ('contact', 'Test', 't@example.com')`);

  await asRole("anon", null, async () => {
    const { count } = (await one<{ count: number }>(`select count(*)::int as count from projects`))!;
    check("visitor sees published projects only", count === 5, `saw ${count}`);
    const imgs = (await one<{ count: number }>(`select count(*)::int as count from project_images`))!;
    check("visitor cannot see a draft project's gallery", imgs.count === 22, `saw ${imgs.count}`);
    const subs = (await one<{ count: number }>(`select count(*)::int as count from submissions`))!;
    check("visitor cannot read the inbox", subs.count === 0);
    check("visitor cannot write content", await fails(`insert into faqs (topic, question, answer) values ('x','y','z')`));
    const upd = await db.query(`update pages set seo_title = 'hacked'`);
    check("visitor updates affect 0 rows", upd.affectedRows === 0);
  });

  console.log("\n5. Website forms (submit_form)");
  await asRole("anon", null, async () => {
    const call = (kind: string, email: string, data: object = { message: "hi" }) =>
      db.query<{ id: string }>(`select submit_form($1::submission_kind, 'Visitor', $2, '0300', $3::jsonb) as id`, [
        kind,
        email,
        JSON.stringify(data),
      ]);
    const first = await call("contact", "Visitor@Example.com").then((r) => r.rows[0].id, () => null);
    check("visitor can submit a form", Boolean(first));
    const { count: visible } = (await one<{ count: number }>(`select count(*)::int as count from submissions`))!;
    check("visitor still cannot read the inbox", visible === 0);
    await call("contact", "visitor@example.com");
    await call("contact", "visitor@example.com");
    check("4th submission from one address in 10 min is refused", await fails(`select submit_form('contact', 'V', 'visitor@example.com', '', '{}'::jsonb)`));
    check("invalid email is refused", await fails(`select submit_form('contact', 'V', 'not-an-email', '', '{}'::jsonb)`));
    check("non-object payload is refused", await fails(`select submit_form('contact', 'V', 'a@b.co', '', '[1]'::jsonb)`));
    check("unknown form kind is refused", await fails(`select submit_form('hack', 'V', 'a@b.co', '', '{}'::jsonb)`));
    const n1 = (await call("newsletter", "reader@example.com", {})).rows[0].id;
    const n2 = (await call("newsletter", "READER@example.com", {})).rows[0].id;
    check("newsletter sign-up is de-duplicated", n1 === n2);
    check("visitor cannot insert into submissions directly", await fails(`insert into submissions (kind, email) values ('contact', 'x@y.z')`));
  });
  const stored = await one<{ email: string; name: string }>(`select email, name from submissions where kind = 'contact' and name = 'Visitor' limit 1`);
  check("email is stored lower-cased", stored?.email === "visitor@example.com");

  const stranger = "00000000-0000-0000-0000-000000000001";
  const admin = "00000000-0000-0000-0000-000000000002";
  await db.exec(`insert into auth.users (id, email) values ('${stranger}', 's@x.com'), ('${admin}', 'a@x.com')`);
  await db.exec(`insert into admin_users (id, email, role) values ('${admin}', 'a@x.com', 'owner')`);

  await asRole("authenticated", stranger, async () => {
    check("non-admin cannot use set_my_name", await fails(`select set_my_name('Hacker')`));
    check(
      "signed-in non-admin cannot write content",
      await fails(`insert into faqs (topic, question, answer) values ('x','y','z')`),
    );
    const { count } = (await one<{ count: number }>(`select count(*)::int as count from projects`))!;
    check("signed-in non-admin still cannot see drafts", count === 5);
  });

  await asRole("authenticated", admin, async () => {
    check(
      "admin can write content",
      !(await fails(`insert into faqs (topic, question, answer) values ('x','y','z')`)),
    );
    const { count } = (await one<{ count: number }>(`select count(*)::int as count from projects`))!;
    check("admin sees drafts", count === 6);
    await db.query(`select set_my_name('Studio Owner')`);
    const me = await one<{ full_name: string; role: string }>(`select full_name, role from admin_users where id = '${admin}'`);
    check("admin can rename themselves (role untouched)", me?.full_name === "Studio Owner" && me?.role === "owner");
    const subs = (await one<{ count: number }>(`select count(*)::int as count from submissions`))!;
    check("admin reads the inbox (seeded + visitor submissions)", subs.count === 5, `saw ${subs.count}`);
  });

  console.log(failures ? `\n✗ ${failures} check(s) failed\n` : "\n✓ All checks passed\n");
  await db.close();
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(`\n✗ ${error.message ?? error}`);
  process.exit(1);
});
