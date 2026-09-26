-- ============================================================================
-- Final pass: the last labels hard-coded in website JSX. Defaults only fill
-- missing keys (`defaults || data`), so edits are never overwritten.
-- ============================================================================

update site_sections set data = jsonb_build_object('backLabel', 'Portfolio') || data
where key = 'portfolio.detail';

update site_sections set data = jsonb_build_object('cardLinkLabel', 'Explore') || data
where key = 'home.services';
