-- ============================================================================
-- Row Level Security
--
--   * Visitors (anon) may READ public content. Draft rows are hidden.
--   * Signed-in users listed in `admin_users` may do everything.
--   * Signing up to Supabase Auth alone grants nothing — a row in
--     `admin_users` is required (created by `npm run admin:create`).
-- ============================================================================

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

create or replace function is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where id = auth.uid() and role = 'owner');
$$;

-- Tables every visitor can read in full.
do $$
declare t text;
begin
  foreach t in array array[
    'media', 'site_settings', 'pages', 'site_sections', 'navigation',
    'portfolio_categories', 'project_images', 'films', 'blog_categories',
    'testimonials', 'faqs', 'awards', 'clients', 'stats', 'team_members',
    'timeline_entries', 'service_categories', 'engagement_tiers', 'process_steps',
    'store_products', 'print_options', 'legal_pages'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public read" on %I for select using (true)', t);
    execute format(
      'create policy "admin write" on %I for all to authenticated using (is_admin()) with check (is_admin())', t
    );
  end loop;
end $$;

-- Tables with draft/published: visitors only see published rows.
do $$
declare t text;
begin
  foreach t in array array['projects', 'posts', 'courses', 'open_roles'] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "public read published" on %I for select using (status = ''published'' or is_admin())', t
    );
    execute format(
      'create policy "admin write" on %I for all to authenticated using (is_admin()) with check (is_admin())', t
    );
  end loop;
end $$;

-- Gallery images of a draft project must not leak.
drop policy "public read" on project_images;
create policy "public read" on project_images for select using (
  exists (
    select 1 from projects p
    where p.id = project_images.project_id and (p.status = 'published' or is_admin())
  )
);

-- Inbox: admin only for now (public insert is enabled in Phase 4).
alter table submissions enable row level security;
create policy "admin all" on submissions for all to authenticated
  using (is_admin()) with check (is_admin());

-- Admin users: admins can see the team; only owners manage it.
alter table admin_users enable row level security;
create policy "admins read" on admin_users for select to authenticated using (is_admin());
create policy "owners manage" on admin_users for all to authenticated
  using (is_owner()) with check (is_owner());

-- ----------------------------------------------------------------------------
-- Storage: public `media` bucket, writes restricted to admins
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 26214400,  -- 25 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/gif']
)
on conflict (id) do nothing;

create policy "media public read" on storage.objects for select
  using (bucket_id = 'media');
create policy "media admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and is_admin());
create policy "media admin update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and is_admin());
create policy "media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and is_admin());
