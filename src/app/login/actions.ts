"use server";

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
