"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type SignInState = { error: string | null; email: string };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "That email and password don't match.", email };

  const { data: admin } = await supabase.from("admin_users").select("id").eq("id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access.", email };
  }

  // Only allow same-site relative redirects.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ResetState = { sent: boolean; error: string | null };

/**
 * Email a password-reset link. Always reports success, so the form can't be
 * used to discover which addresses have accounts.
 */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { sent: false, error: "Enter the email you sign in with." };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${proto}://${host}/auth/confirm` });
  if (error?.status === 429) return { sent: false, error: "Too many requests — please wait a few minutes and try again." };
  if (error) console.error("[reset] resetPasswordForEmail failed", error.message);
  return { sent: true, error: null };
}
