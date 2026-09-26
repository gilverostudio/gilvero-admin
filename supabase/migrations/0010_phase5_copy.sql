-- ============================================================================
-- Phase 5: remaining copy hard-coded in website JSX. Defaults only fill keys
-- that are missing (`defaults || data`), so edits are never overwritten.
-- ============================================================================

update site_sections set data = jsonb_build_object('name', jsonb_build_object('label', 'Name')) || data
where key = 'booking.form';

update site_sections set data = jsonb_build_object(
  'applyFields', jsonb_build_object(
    'name', 'Full name',
    'phone', 'Phone',
    'email', 'Email',
    'message', 'Anything we should know?',
    'submit', 'Submit Application'
  )
) || data
where key = 'academy.detail';

update site_sections set data = jsonb_build_object('addToBasketLabel', 'Add to Basket') || data where key = 'store.products';
update site_sections set data = jsonb_build_object('checkoutLabel', 'Checkout') || data where key = 'store.configurator';
update site_sections set data = jsonb_build_object(
  'note', 'Existing customers can track live status inside the',
  'noteLinkLabel', 'Client Area'
) || data
where key = 'store.tracking';
