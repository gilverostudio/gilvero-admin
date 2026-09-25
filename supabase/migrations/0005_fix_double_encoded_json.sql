-- ============================================================================
-- Repair: the Phase 0 seed (postgres.js driver) wrote jsonb values as JSON
-- *strings* — e.g. '"[{\"label\":...}]"' instead of '[{"label":...}]'.
-- Decode any top-level string back into real JSON. Idempotent: rows that are
-- already objects/arrays are untouched.
-- ============================================================================

update site_settings set social = (social #>> '{}')::jsonb where jsonb_typeof(social) = 'string';
update site_settings set seo    = (seo    #>> '{}')::jsonb where jsonb_typeof(seo)    = 'string';
update pages         set header = (header #>> '{}')::jsonb where jsonb_typeof(header) = 'string';
update pages         set cta    = (cta    #>> '{}')::jsonb where jsonb_typeof(cta)    = 'string';
update site_sections set data   = (data   #>> '{}')::jsonb where jsonb_typeof(data)   = 'string';
update navigation    set data   = (data   #>> '{}')::jsonb where jsonb_typeof(data)   = 'string';
update posts         set body   = (body   #>> '{}')::jsonb where jsonb_typeof(body)   = 'string';
update legal_pages   set sections = (sections #>> '{}')::jsonb where jsonb_typeof(sections) = 'string';

-- Guard rails so it can never happen again.
alter table site_settings add constraint site_settings_social_object check (jsonb_typeof(social) = 'object');
alter table site_settings add constraint site_settings_seo_object    check (jsonb_typeof(seo) = 'object');
alter table pages         add constraint pages_header_object check (header is null or jsonb_typeof(header) = 'object');
alter table pages         add constraint pages_cta_object    check (cta is null or jsonb_typeof(cta) = 'object');
alter table site_sections add constraint site_sections_data_object check (jsonb_typeof(data) = 'object');
alter table navigation    add constraint navigation_data_json check (jsonb_typeof(data) in ('object', 'array'));
alter table posts         add constraint posts_body_array check (jsonb_typeof(body) = 'array');
alter table legal_pages   add constraint legal_pages_sections_array check (jsonb_typeof(sections) = 'array');
