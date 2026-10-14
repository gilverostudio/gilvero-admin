"use server";

import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { z } from "zod";

import { fail, friendlyError, succeed, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateMyName(fullName: string): Promise<ActionResult<null>> {
  await requireAdmin();
  const parsed = z.string().trim().max(120).safeParse(fullName);
  if (!parsed.success) return fail("Keep your name under 120 characters.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_my_name", { p_full_name: parsed.data });
  if (error) return fail(friendlyError(error));
  return succeed(null);
}

const passwordSchema = z
  .object({
    current: z.string(),
    password: z.string().min(10, "Use at least 10 characters.").max(72, "Use at most 72 characters."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The two new passwords don't match.", path: ["confirm"] });

/** Signed in through an emailed reset link (not with a password). */
export async function isRecoverySession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const amr = (data?.claims?.amr ?? []) as { method: string }[];
  return amr.some((a) => a.method === "otp" || a.method === "recovery") && !amr.some((a) => a.method === "password");
}

/** Checks a password without touching the browser session's cookies. */
async function passwordMatches(email: string, password: string) {
  const probe = createStatelessClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await probe.auth.signInWithPassword({ email, password });
  if (error) return false;
  // Close the throwaway session it just opened.
  await probe.auth.signOut({ scope: "local" }).catch(() => {});
  return Boolean(data.session);
}

/**
 * Change your password. Normal sessions must confirm the current password;
 * sessions opened from a reset link may set a new one directly.
 *
 * The new password is set server-side for the verified admin (service role), so
 * it never depends on rewriting the session cookie mid-request — which broke
 * with "Auth session missing" for larger, chunked session cookies.
 */
export async function changePassword(input: { current: string; password: string; confirm: string }): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  if (!(await isRecoverySession()) && !(await passwordMatches(admin.email, parsed.data.current))) {
    return fail("Your current password is incorrect.");
  }

  const service = createServiceClient();
  const { error } = service
    ? await service.auth.admin.updateUserById(admin.id, { password: parsed.data.password })
    : await (await createClient()).auth.updateUser({ password: parsed.data.password });
  if (error) return fail(error.message.includes("different") ? "Choose a password you haven't used here before." : friendlyError(error));
  return succeed(null);
}
