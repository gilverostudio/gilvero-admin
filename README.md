# GILVERO — Studio Admin

Content management for [gilvero.com](https://gilvero.com). Same stack and design language as the
website: **Next.js 16**, **Tailwind v4**, the ink/charcoal/gold tokens, Sora + Manrope.

```
gilvero-admin (this repo)  ──writes──►  Supabase  ◄──reads──  gilvero (website)
  sign-in, editors, uploads             Postgres · Storage · Auth
          └──── POST /api/revalidate ──► refreshes only the changed pages
```

## Stack

| Concern  | Choice |
|----------|--------|
| Database | Supabase Postgres. Schema lives in `supabase/migrations/` |
| Security | Row Level Security. Visitors read published content; only rows in `admin_users` can write |
| Images   | Supabase Storage, public `media` bucket (writes are admin-only) |
| Auth     | Supabase email + password, session refreshed in `src/proxy.ts` |

## First-time setup

1. **Create a Supabase project**, then copy `.env.example` to `.env.local` and fill in the values:
   the project URL, the anon key, the service-role key, the DB connection string (use the
   *Session pooler*, port 5432), the website URL and a long random `WEBSITE_REVALIDATE_SECRET`.

2. **Install, migrate, seed, create your login:**

   ```bash
   npm install
   npm run db:migrate                     # tables, RLS policies, storage bucket
   npm run db:seed                        # everything the live site shows today + its 8 images
   npm run admin:create -- --email you@gilvero.com --password "a-long-password" --name "Your Name"
   npm run dev                            # http://localhost:3001
   ```

3. **Website (Vercel → gilvero project → Environment Variables):** add `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `REVALIDATE_SECRET`. `REVALIDATE_SECRET` must be the same
   value as `WEBSITE_REVALIDATE_SECRET` here. Then redeploy.

4. **Admin on Vercel:** import this repo as a new project, e.g. on `admin.gilvero.com`, and add
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WEBSITE_URL` and
   `WEBSITE_REVALIDATE_SECRET`. **Don't** add the service-role key or the DB URL; only the local
   scripts use those.

The dashboard's **Website link** card turns green once the website accepts the secret.

## How the seed works

The seed never retypes content by hand.

- `npm run content:snapshot` imports the website's own `src/content/*.ts` and `src/lib/*.ts` and
  writes `supabase/seed/content.json`, plus a copy of the images in `supabase/seed/images/`.
  Run it again whenever the website's static content changes, before you seed.
- `scripts/seed/page-copy.ts` holds the text that exists only in JSX (page headers, CTA bands,
  SEO titles, section headings), copied word for word.
- `scripts/seed/build.ts` maps both into tables and **refuses to run** if either check fails:
  - **Coverage:** some content export isn't mapped.
  - **Consistency:** data the site shows twice differs between its copies (e.g. home featured
    work vs. projects, home awards vs. about awards).

`npm run db:seed -- --reset` wipes CMS content and seeds it again. It keeps admins and inbox
submissions.

### Offline verification (no Supabase needed)

```bash
npm run db:verify
```

This boots an in-memory Postgres, applies the migrations and runs the full seed. It then checks
that all 812 text values from the site are in the database, compares projects, courses, posts,
FAQ, settings, legal text and menus with the website, and tests the RLS rules as a visitor, a
signed-in non-admin and an admin.

## Data model (overview)

- **Collections:** `projects` (+ `project_images`, `portfolio_categories`), `posts`
  (+ `blog_categories`), `courses`, `films`, `testimonials`, `faqs`, `awards`, `clients`, `stats`,
  `team_members`, `timeline_entries`, `service_categories`, `engagement_tiers`, `process_steps`,
  `open_roles`, `store_products`, `print_options`, `legal_pages`
- **Singletons / copy:** `site_settings`, `pages` (SEO + header + CTA per route), `site_sections`
  (keyed copy blocks like `home.hero` or `about.story`), `navigation`
- **Assets:** `media`. Every image reference is a `media.id`
- **Inbox:** `submissions` (wired to the website forms in Phase 4)
- **Access:** `admin_users` (`owner` | `editor`)

Publishable tables (`projects`, `posts`, `courses`, `open_roles`) have a `draft | published`
status, and visitors only ever see published rows.

## Roadmap

| Phase | Scope | Status |
|------:|-------|--------|
| 0 | Foundation: schema, RLS, storage, seed, sign-in, admin shell, website revalidate endpoint | ✅ |
| 1 | Media library + portfolio editor; website portfolio reads from Supabase | |
| 2 | Homepage sections + site settings + menus | |
| 3 | Journal, academy, services, about, careers, FAQ | |
| 4 | Inbox: website forms → Supabase + email alerts | |
| 5 | Print store, page headers/SEO, legal pages | |
