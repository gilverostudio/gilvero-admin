-- ============================================================================
-- Phase 4: website forms → inbox
--
--   * Visitors never touch the `submissions` table directly (RLS stays
--     admin-only). They call submit_form(), which validates, rate-limits and
--     inserts on their behalf.
--   * Booking reference images go to a PRIVATE `submissions` bucket:
--     visitors may upload (insert) only; admins read via signed URLs.
-- ============================================================================

create or replace function submit_form(
  p_kind submission_kind,
  p_name text,
  p_email text,
  p_phone text,
  p_data jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id uuid;
begin
  -- Shape checks (the website validates too; this is the last line of defence).
  if length(coalesce(p_name, '')) > 200 or length(v_email) > 200 or length(coalesce(p_phone, '')) > 60 then
    raise exception 'field too long' using errcode = '22001';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or length(p_data::text) > 20000 then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  -- Newsletter: one row per address.
  if p_kind = 'newsletter' then
    select id into v_id from submissions where kind = 'newsletter' and email = v_email limit 1;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  -- Rate limits: per address, and a global flood guard.
  if (select count(*) from submissions
      where email = v_email and kind = p_kind and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'too many submissions' using errcode = 'P0429';
  end if;
  if (select count(*) from submissions where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'too many submissions' using errcode = 'P0429';
  end if;

  insert into submissions (kind, name, email, phone, data)
  values (p_kind, nullif(trim(p_name), ''), v_email, nullif(trim(p_phone), ''), p_data)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function submit_form(submission_kind, text, text, text, jsonb) from public;
grant execute on function submit_form(submission_kind, text, text, text, jsonb) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Private bucket for reference images attached to booking requests
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions', 'submissions', false, 10485760,  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
)
on conflict (id) do nothing;

-- Visitors: upload only, and only under bookings/.
create policy "submissions public upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'submissions' and name like 'bookings/%');
-- Admins: read (signed URLs) and delete.
create policy "submissions admin read" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and is_admin());
create policy "submissions admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'submissions' and is_admin());
