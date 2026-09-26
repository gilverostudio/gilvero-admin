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

## Requirements

- **Node.js 22+** (`.nvmrc` provided). Supabase's JS client needs Node 22's built-in WebSocket;
  on Node 20 sign-in and the scripts crash with "native WebSocket not found".

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
   npm run db:check                       # live project: public reads work, writes/uploads blocked
   npm run dev                            # http://localhost:3001
   ```

3. **Website (hosted on Netlify → Site configuration → Environment variables):** add
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `REVALIDATE_SECRET`.
   `REVALIDATE_SECRET` must be the same value as `WEBSITE_REVALIDATE_SECRET` here. Then trigger a
   deploy, and make sure the site builds from the `main` branch of `gilverostudio/gilvero`.

4. **Admin hosting (Netlify or Vercel):** import this repo as a new site, e.g. on `admin.gilvero.com`, and add
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

## Editors

### Media Library (`/media`)
Drag-and-drop uploads go straight from the browser to Supabase Storage (up to 25 MB each).
For each image you can set alt text and a **focal point**, which the website uses as
`object-position` so crops keep the subject in frame. The library shows everywhere an image is
used (the `media_usage` view), and an image can't be deleted while it's still in use.

### Portfolio (`/portfolio`)
- **Projects:** drag to set the website order, and publish/unpublish or star (feature on the
  homepage) straight from the list. The "On the homepage" panel sets the order of
  "Recent commissions".
- **Project editor:** details, URL slug, category, services, story → challenge → solution →
  result, cover, a sortable gallery with captions, an optional testimonial, and SEO with a
  search-result preview. Publishing is blocked until the project has a cover.
- **Categories:** add, rename, reorder and hide (hidden categories keep their projects but show
  no filter button). Deleting a category makes its projects uncategorised.

### Homepage (`/homepage`)
Thirteen collapsible editors in page order: hero, brand marquee, services cards, recent-commissions
heading, films (with optional video links), academy preview and student quotes, print atelier
preview, stats, client testimonials, awards and the behind-the-scenes grid, the Instagram grid,
the journal/FAQ headings, and the closing call to action. Brands and awards are shared with the
About page.

### Settings (`/settings`)
Brand and search defaults, contact details and social links (used by the footer, contact page,
booking page and floating buttons), the header menu, mobile-only links, the services mega menu,
footer columns and text, newsletter text, search quick links, the floating WhatsApp label and the
404 page. The admin team is listed at the bottom.

### Journal (`/journal`)
Articles are listed newest first by publish date, with quick publish/unpublish and "show on
homepage" toggles. The article editor has a title, URL, excerpt, category, publish date, a read
time (estimated from the text if left empty), cover, SEO fields, and a **block editor** for the
body: lead, heading, paragraph, quote and image blocks that you can drag to reorder or change type.
Pressing Enter at the end of a lead or heading starts a new paragraph. Journal categories can be
added, renamed, reordered and deleted.

### Academy, Services, About, Careers, FAQ
All five are form-engine pages (see below):
- **Academy:** courses (with a URL, curriculum modules, career routes, draft/published and an
  optional header image), highlights, headings, student outcomes and the text shared by course
  pages.
- **Services:** catalogue tabs and their services, engagement tiers, process steps.
- **About:** story paragraphs, mission and vision, values, founder, team (with photos and
  show/hide), studio tour, timeline and equipment.
- **Careers:** open or close roles.
- **FAQ:** one sortable list. Questions are grouped by their topic on the FAQ page, and ticked
  questions also appear on the homepage, in the same order.

### Inbox (`/inbox`)
Every website form (booking requests, enquiries, academy applications and newsletter sign-ups)
lands here. You can filter by type and status, search, reply by email, call or WhatsApp, set a
status (new, in progress, done, spam), keep internal notes, export a CSV and delete. Booking
reference images are kept in a **private** `submissions` bucket and shown through 30-minute
signed links. The sidebar shows how many items are new.

Visitors can't read or write the `submissions` table. The website calls the `submit_form()`
database function, which validates the data and rate-limits submissions (3 per address per form
every 10 minutes, and 30 per minute across the site). Newsletter sign-ups are de-duplicated. A
hidden honeypot field silently drops bot posts.

**Email alerts (optional):** set these on the website's hosting to get an email for each booking,
enquiry and academy application. Replying to the email answers the visitor directly.
- `RESEND_API_KEY` from [resend.com](https://resend.com)
- `NOTIFY_EMAIL`: the recipient. Defaults to the studio email in Settings.
- `NOTIFY_FROM`: the sender, on a domain you've verified in Resend, e.g.
  `Gilvero Website <hello@gilvero.com>`. Without it, Resend's test sender only delivers to your
  own Resend account address.

### Print Store (`/store`)
Products (name, price, note, image, show/hide), the configurator's sizes (one can be the default
selection), papers and frames, plus the headings, labels, tracking steps and messages in the order
section. Ordering is still presentational: buttons show a message, and there's no checkout or
payment yet.

### Pages & SEO (`/pages`)
One editor per page, in site order. Each has a Google title and description, the page header
(eyebrow, heading, intro, breadcrumb, background image, buttons) and the closing banner. The case
study, course and article pages have **templates** with placeholders like `{title}` and
`{category}`; an item's own SEO text overrides its template. Page-specific text also lives here:
- **Booking:** form labels, dropdown options, next steps
- **Contact:** form labels, contact cards, gallery, map
- **Client Area:** sign-in panel, features
- **Privacy / Terms:** the full legal text, as sections with paragraphs and bullet points

### How the editors work
Every Homepage and Settings form comes from declarative field definitions in
`src/lib/content/editors.ts`. The same definitions render the form
(`components/content/fields-form.tsx`), validate on the server (`lib/content/schema.ts` →
zod) and decide what gets written (`app/(admin)/content-actions.ts`). The server looks up each
editor part in that registry by id, so table names and keys never come from the browser. Adding
an editor means adding a definition, not writing a new form.

Every save calls the website's `/api/revalidate` (`portfolio` tag for the portfolio, `site` for
everything else), so the change is live on the next page load. If that call fails, the save still succeeds and the site catches up within
an hour.

## Going live checklist

**Website (Netlify → Site configuration → Environment variables), then redeploy:**

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All content, and saving forms |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All content, and saving forms |
| `REVALIDATE_SECRET` | Admin saves updating the live site immediately (same value as the admin's `WEBSITE_REVALIDATE_SECRET`) |
| `RESEND_API_KEY`, `NOTIFY_FROM`, `NOTIFY_EMAIL` | Optional email alert for each new enquiry |

Without the Supabase variables the website falls back to the built-in content in `src/content`
and the forms show a "not available" message. It never shows a broken page.

**Admin hosting (optional, e.g. `admin.gilvero.com`):** add `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WEBSITE_URL` and `WEBSITE_REVALIDATE_SECRET`, and
use Node 22+.

### Commits and Netlify's contributor limit

Netlify's free plan only lets **one Git contributor**, the account owner `gilverostudio`, trigger
deploys from a **private** repo. Commits by anyone else are blocked. So commits are authored as
`gilverostudio <gilverostudio@gmail.com>`, and a local `commit-msg` hook credits the developer:

```
Co-authored-by: sheryar-ahmed <royalsheryar505@gmail.com>
```

Setup on a fresh clone:

```bash
git config user.name "gilverostudio"
git config user.email "gilverostudio@gmail.com"
printf '#!/bin/sh
T="Co-authored-by: sheryar-ahmed <royalsheryar505@gmail.com>"
grep -qiF "$T" "$1" || git interpret-trailers --in-place --trailer "$T" "$1"
' > .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

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
| 1 | Media library + portfolio editor; website portfolio reads from Supabase | ✅ |
| 2 | Homepage sections + site settings + menus | ✅ |
| 3 | Journal, academy, services, about, careers, FAQ | ✅ |
| 4 | Inbox: website forms → Supabase + email alerts | ✅ |
| 5 | Print store, page headers/SEO, legal pages | ✅ |
