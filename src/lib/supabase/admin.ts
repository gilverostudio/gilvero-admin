import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for owner-only team management (creating and removing
 * logins). Server-side only; never import from client components. Returns null
 * when SUPABASE_SERVICE_ROLE_KEY isn't configured on this deployment.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
