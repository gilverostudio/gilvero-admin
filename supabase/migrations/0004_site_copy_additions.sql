-- ============================================================================
-- Phase 2: copy that lived only in the website's layout JSX (missed by the
-- Phase 0 seed). Idempotent — safe on freshly seeded databases too.
-- ============================================================================

insert into site_sections (key, page, label, data) values (
  'global.footer', 'global', 'Footer',
  jsonb_build_object(
    'blurb', 'A premium creative media house — photography, film, design, education and archival print, under one roof.',
    'contactTitle', 'Studio',
    'privacyLabel', 'Privacy',
    'termsLabel', 'Terms'
  )
) on conflict (key) do nothing;

insert into navigation (key, data) values (
  'mobile',
  '[{"label":"Booking","href":"/booking"},{"label":"Client Area","href":"/client-area"},{"label":"FAQ","href":"/faq"},{"label":"Careers","href":"/careers"}]'::jsonb
) on conflict (key) do nothing;

-- The cover-less section blocks that the homepage editor manages as a whole.
update site_sections set label = 'Hero' where key = 'home.hero';
