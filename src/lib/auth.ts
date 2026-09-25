import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "editor";
};

/**
 * The signed-in admin, or null. A Supabase account alone is not enough —
 * the user must also have a row in `admin_users` (RLS only returns it to admins).
 * Cached per request.
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  return admin;
});

/** Use at the top of every protected layout / page / action. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/login?error=no-access");
  return admin;
}
