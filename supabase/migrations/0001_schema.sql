-- ============================================================================
-- Gilvero CMS — core schema
--
-- Conventions
--   * Every collection table has `sort_order` (drag-to-reorder in the admin)
--     and `created_at` / `updated_at`.
--   * Publishable entities carry `status` ('draft' | 'published').
--   * Images are always referenced through `media.id` — never a raw path.
--   * Small, section-scoped copy (eyebrows, headings, button labels, short
--     lists) lives in `site_sections.data` (jsonb) keyed by `<page>.<section>`.
-- ============================================================================


create type publish_status as enum ('draft', 'published');

-- Keeps updated_at honest on every UPDATE.
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Admin users (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create type admin_role as enum ('owner', 'editor');

create table admin_users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  full_name   text,
  role        admin_role not null default 'editor',
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Media library
-- ----------------------------------------------------------------------------
create table media (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null unique,           -- path inside the `media` bucket
  file_name     text not null,
  mime_type     text not null,
  size_bytes    bigint,
  width         integer not null,
  height        integer not null,
  alt           text not null default '',
  focal_x       real not null default 0.5 check (focal_x between 0 and 1),
  focal_y       real not null default 0.5 check (focal_y between 0 and 1),
  legacy_key    text unique,                    -- original ImageKey from lib/images.ts
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Site-wide settings (singleton row, id = 1)
-- ----------------------------------------------------------------------------
create table site_settings (
  id           smallint primary key default 1 check (id = 1),
  name         text not null,
  legal_name   text not null,
  tagline      text not null,
  title        text not null,
  description  text not null,
  url          text not null,
  phone        text not null,
  whatsapp     text not null,
  email        text not null,
  address      text not null,
  hours        text not null,
  social       jsonb not null default '{}'::jsonb,  -- { instagram, youtube, linkedin }
  seo          jsonb not null default '{}'::jsonb,  -- open graph + organization schema
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Pages: SEO, page header and closing CTA band per route
-- ----------------------------------------------------------------------------
create table pages (
  slug             text primary key,            -- 'home', 'about', 'portfolio', ...
  seo_title        text,
  seo_description  text,
  header           jsonb,                       -- { eyebrow, title, copy, image_id, crumb, actions[] }
  cta              jsonb,                       -- { title, copy, primary{label,href}, secondary{label,href} }
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Section copy blocks, e.g. 'home.hero', 'about.story', 'store.toasts'
-- ----------------------------------------------------------------------------
create table site_sections (
  key         text primary key,
  page        text not null,
  label       text not null,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
create index site_sections_page_idx on site_sections (page);

-- ----------------------------------------------------------------------------
-- Navigation (main nav, mega menu, footer, search quick links)
-- ----------------------------------------------------------------------------
create table navigation (
  key         text primary key,                 -- 'main', 'mega', 'footer', 'search'
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Portfolio
-- ----------------------------------------------------------------------------
create table portfolio_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table projects (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  title               text not null,
  category_id         uuid references portfolio_categories (id) on delete set null,
  client              text not null default '',
  location            text not null default '',
  year                text not null default '',
  cover_id            uuid references media (id) on delete set null,
  story               text not null default '',
  challenge           text not null default '',
  solution            text not null default '',
  result              text not null default '',
  services            text[] not null default '{}',
  testimonial_quote   text,
  testimonial_author  text,
  testimonial_role    text,
  is_featured         boolean not null default false,  -- shown in home "Recent commissions"
  featured_order      integer not null default 0,
  status              publish_status not null default 'draft',
  sort_order          integer not null default 0,
  seo_title           text,
  seo_description     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index projects_category_idx on projects (category_id);

create table project_images (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects (id) on delete cascade,
  media_id    uuid not null references media (id) on delete restrict,
  caption     text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index project_images_project_idx on project_images (project_id, sort_order);

-- ----------------------------------------------------------------------------
-- Films (home "Latest films")
-- ----------------------------------------------------------------------------
create table films (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  duration      text not null default '',
  video_url     text,
  thumbnail_id  uuid references media (id) on delete set null,
  sort_order    integer not null default 0,
  is_visible    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Journal
-- ----------------------------------------------------------------------------
create table blog_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  category_id      uuid references blog_categories (id) on delete set null,
  published_on     date,
  read_time        text not null default '',
  excerpt          text not null default '',
  body             jsonb not null default '[]'::jsonb,  -- ArticleBlock[]
  cover_id         uuid references media (id) on delete set null,
  is_featured      boolean not null default false,      -- shown in home "Latest writing"
  status           publish_status not null default 'draft',
  seo_title        text,
  seo_description  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index posts_category_idx on posts (category_id);

-- ----------------------------------------------------------------------------
-- Academy
-- ----------------------------------------------------------------------------
create table courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  level        text not null default '',
  duration     text not null default '',
  fee          text not null default '',
  batch        text not null default '',
  trainer      text not null default '',
  summary      text not null default '',
  curriculum   text[] not null default '{}',
  careers      text[] not null default '{}',
  cover_id     uuid references media (id) on delete set null,
  status       publish_status not null default 'draft',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Shared quote / people collections
-- ----------------------------------------------------------------------------
-- placement: 'home' (Clients section), 'academy_home' (home academy preview),
--            'academy_outcomes' (academy page student outcomes)
create table testimonials (
  id          uuid primary key default gen_random_uuid(),
  placement   text not null,
  quote       text not null,
  author      text not null,
  role        text not null default '',
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index testimonials_placement_idx on testimonials (placement, sort_order);

create table faqs (
  id           uuid primary key default gen_random_uuid(),
  topic        text not null,                  -- FAQ page group heading
  question     text not null,
  answer       text not null,
  sort_order   integer not null default 0,     -- order within topic
  topic_order  integer not null default 0,     -- order of the topic group
  show_on_home boolean not null default false,
  home_order   integer not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table awards (
  id          uuid primary key default gen_random_uuid(),
  year        text not null,
  name        text not null,
  body        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Client / brand names (home marquee + about client list)
create table clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_id     uuid references media (id) on delete set null,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table stats (
  id          uuid primary key default gen_random_uuid(),
  value       integer not null,
  suffix      text not null default '',
  label       text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table team_members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text not null,
  photo_id    uuid references media (id) on delete set null,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table timeline_entries (
  id          uuid primary key default gen_random_uuid(),
  year        text not null,
  text        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Services
-- ----------------------------------------------------------------------------
create table service_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,            -- anchor id on /services
  title       text not null,
  intro       text not null default '',
  items       text[] not null default '{}',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table engagement_tiers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  audience    text not null default '',        -- "for" in the original content
  price       text not null default '',
  items       text[] not null default '{}',
  is_featured boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table process_steps (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  copy        text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Careers
-- ----------------------------------------------------------------------------
create table open_roles (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  team        text not null default '',
  location    text not null default '',
  type        text not null default '',
  summary     text not null default '',
  status      publish_status not null default 'published',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Print store
-- ----------------------------------------------------------------------------
create table store_products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price_from  text not null default '',
  note        text not null default '',
  image_id    uuid references media (id) on delete set null,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- kind: 'size' | 'paper' | 'frame'
create table print_options (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('size', 'paper', 'frame')),
  name        text not null,
  note        text not null default '',
  is_default  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (kind, name)
);

-- ----------------------------------------------------------------------------
-- Legal pages
-- ----------------------------------------------------------------------------
create table legal_pages (
  slug        text primary key,                -- 'privacy', 'terms'
  eyebrow     text not null default 'Legal',
  title       text not null,
  crumb       text not null,
  updated     text not null,                   -- "Last updated · January 2026"
  intro       text not null default '',
  sections    jsonb not null default '[]'::jsonb,  -- LegalSection[]
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Form submissions (inbox) — wired up in Phase 4
-- ----------------------------------------------------------------------------
create type submission_kind as enum ('booking', 'contact', 'academy', 'newsletter', 'career');
create type submission_status as enum ('new', 'in_progress', 'done', 'spam');

create table submissions (
  id          uuid primary key default gen_random_uuid(),
  kind        submission_kind not null,
  name        text,
  email       text,
  phone       text,
  data        jsonb not null default '{}'::jsonb,
  status      submission_status not null default 'new',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index submissions_inbox_idx on submissions (status, created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'media', 'site_settings', 'pages', 'site_sections', 'navigation',
    'portfolio_categories', 'projects', 'films', 'blog_categories', 'posts',
    'courses', 'testimonials', 'faqs', 'awards', 'clients', 'stats',
    'team_members', 'timeline_entries', 'service_categories', 'engagement_tiers',
    'process_steps', 'open_roles', 'store_products', 'print_options',
    'legal_pages', 'submissions'
  ] loop
    execute format(
      'create trigger %I before update on %I for each row execute function set_updated_at()',
      t || '_updated_at', t
    );
  end loop;
end $$;
