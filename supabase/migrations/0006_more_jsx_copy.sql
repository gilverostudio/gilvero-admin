-- ============================================================================
-- More copy that was hard-coded in website JSX, now editable. Existing values
-- win over these defaults (`defaults || data`), so re-running is harmless.
-- ============================================================================

update site_sections set data = jsonb_build_object(
  'copy', 'The page has been moved, retired, or never made the final cut. Let''s get you back to the work.',
  'homeLabel', 'Back to Home',
  'portfolioLabel', 'View Portfolio'
) || data where key = 'global.not-found';

update site_sections set data = jsonb_build_object('linkLabel', 'All Services') || data where key = 'home.services';
update site_sections set data = jsonb_build_object('linkLabel', 'Full Portfolio') || data where key = 'home.featured';
update site_sections set data = jsonb_build_object('linkLabel', 'Shop Prints') || data where key = 'home.store';
