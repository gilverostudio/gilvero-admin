-- ============================================================================
-- Phase 3: allow drag-to-reorder of journal categories.
-- ============================================================================

create or replace function reorder_rows(p_table text, p_column text, p_ids uuid[])
returns void language plpgsql security invoker set search_path = public as $$
begin
  if (p_table, p_column) not in (
    ('projects', 'sort_order'),
    ('projects', 'featured_order'),
    ('portfolio_categories', 'sort_order'),
    ('project_images', 'sort_order'),
    ('blog_categories', 'sort_order')
  ) then
    raise exception 'reorder not allowed for %.%', p_table, p_column;
  end if;

  execute format(
    'update %I t set %I = o.ord - 1 from unnest($1) with ordinality as o(id, ord) where t.id = o.id',
    p_table, p_column
  ) using p_ids;
end;
$$;

revoke execute on function reorder_rows(text, text, uuid[]) from anon;

-- ----------------------------------------------------------------------------
-- media_usage: also count images inside article bodies, and link journal
-- covers to their editor.
-- ----------------------------------------------------------------------------
create or replace view media_usage with (security_invoker = true) as
  select cover_id as media_id, 'Project cover'::text as kind, title as label, '/portfolio/' || id as href
    from projects where cover_id is not null
  union all
  select pi.media_id, 'Project gallery', p.title, '/portfolio/' || p.id
    from project_images pi join projects p on p.id = pi.project_id
  union all
  select thumbnail_id, 'Film thumbnail', title, '/homepage#films' from films where thumbnail_id is not null
  union all
  select cover_id, 'Journal cover', title, '/journal/' || id from posts where cover_id is not null
  union all
  select m.id, 'Journal article image', p.title, '/journal/' || p.id
    from posts p
    cross join lateral jsonb_path_query(p.body, 'strict $.** ? (@.type() == "string")') as v(val)
    join media m on m.id::text = v.val #>> '{}'
  union all
  select cover_id, 'Course header', title, '/academy' from courses where cover_id is not null
  union all
  select photo_id, 'Team photo', name, '/about' from team_members where photo_id is not null
  union all
  select logo_id, 'Client logo', name, null from clients where logo_id is not null
  union all
  select image_id, 'Store product', name, null from store_products where image_id is not null
  union all
  select m.id, 'Section', s.label || ' (' || s.page || ')', null
    from site_sections s
    cross join lateral jsonb_path_query(s.data, 'strict $.** ? (@.type() == "string")') as v(val)
    join media m on m.id::text = v.val #>> '{}'
  union all
  select m.id, 'Page header', p.slug, null
    from pages p
    cross join lateral jsonb_path_query(coalesce(p.header, '{}'::jsonb), 'strict $.** ? (@.type() == "string")') as v(val)
    join media m on m.id::text = v.val #>> '{}';
