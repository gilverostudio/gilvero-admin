"use server";

import { z } from "zod";

import { fail, friendlyError, succeed, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
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

/**
 * Change your password. Normal sessions must confirm the current password;
 * sessions opened from a reset link may set a new one directly.
 */
export async function changePassword(input: { current: string; password: string; confirm: string }): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const supabase = await createClient();
  if (!(await isRecoverySession())) {
    const { error } = await supabase.auth.signInWithPassword({ email: admin.email, password: parsed.data.current });
    if (error) return fail("Your current password is incorrect.");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(error.message.includes("different") ? "Choose a password you haven't used here before." : friendlyError(error));
  return succeed(null);
}
