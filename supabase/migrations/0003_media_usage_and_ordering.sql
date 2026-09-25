-- ============================================================================
-- Phase 1 helpers: where is each image used, drag-to-reorder, atomic galleries
-- ============================================================================

-- ----------------------------------------------------------------------------
-- media_usage: every place a media row is referenced (FK columns + any uuid
-- string inside jsonb copy blocks). security_invoker → RLS of the caller applies.
-- ----------------------------------------------------------------------------
create or replace view media_usage with (security_invoker = true) as
  select cover_id as media_id, 'Project cover'::text as kind, title as label, '/portfolio/' || id as href
    from projects where cover_id is not null
  union all
  select pi.media_id, 'Project gallery', p.title, '/portfolio/' || p.id
    from project_images pi join projects p on p.id = pi.project_id
  union all
  select thumbnail_id, 'Film thumbnail', title, null from films where thumbnail_id is not null
  union all
  select cover_id, 'Journal cover', title, null from posts where cover_id is not null
  union all
  select cover_id, 'Course cover', title, null from courses where cover_id is not null
  union all
  select photo_id, 'Team photo', name, null from team_members where photo_id is not null
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

-- ----------------------------------------------------------------------------
-- reorder_rows: set an ordering column from an ordered list of ids.
-- Whitelisted (table, column) pairs only; runs as the caller so RLS applies.
-- ----------------------------------------------------------------------------
create or replace function reorder_rows(p_table text, p_column text, p_ids uuid[])
returns void language plpgsql security invoker set search_path = public as $$
begin
  if (p_table, p_column) not in (
    ('projects', 'sort_order'),
    ('projects', 'featured_order'),
    ('portfolio_categories', 'sort_order'),
    ('project_images', 'sort_order')
  ) then
    raise exception 'reorder not allowed for %.%', p_table, p_column;
  end if;

  execute format(
    'update %I t set %I = o.ord - 1 from unnest($1) with ordinality as o(id, ord) where t.id = o.id',
    p_table, p_column
  ) using p_ids;
end;
$$;

-- ----------------------------------------------------------------------------
-- set_project_gallery: replace a project's gallery in one transaction.
--   p_items: [{ "media_id": uuid, "caption": text }, ...] in display order
-- ----------------------------------------------------------------------------
create or replace function set_project_gallery(p_project uuid, p_items jsonb)
returns void language plpgsql security invoker set search_path = public as $$
begin
  delete from project_images where project_id = p_project;
  insert into project_images (project_id, media_id, caption, sort_order)
  select p_project, (item ->> 'media_id')::uuid, coalesce(item ->> 'caption', ''), ord - 1
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);
end;
$$;

revoke execute on function reorder_rows(text, text, uuid[]) from anon;
revoke execute on function set_project_gallery(uuid, jsonb) from anon;
