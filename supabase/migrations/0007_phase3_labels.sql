-- ============================================================================
-- Phase 3: labels hard-coded in website JSX, now editable. Only added when
-- missing, so existing edits are never overwritten.
-- ============================================================================

update site_sections
set data = jsonb_set(data, '{tiers,featuredLabel}', to_jsonb('Most chosen'::text))
where key = 'services.headings' and not coalesce(data -> 'tiers' ? 'featuredLabel', false);

update site_sections
set data = jsonb_build_object('applyLabel', 'Apply for this role') || data
where key = 'careers.intro';
