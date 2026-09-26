-- ============================================================================
-- Account: any admin may change their own display name — and nothing else
-- (RLS only lets owners update admin_users, which would include roles).
-- ============================================================================

create or replace function set_my_name(p_full_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  update admin_users
  set full_name = nullif(left(trim(coalesce(p_full_name, '')), 120), '')
  where id = auth.uid();
end;
$$;

revoke all on function set_my_name(text) from public;
grant execute on function set_my_name(text) to authenticated;
