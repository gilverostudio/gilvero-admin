"use server";

import { randomBytes } from "node:crypto";

import { z } from "zod";

import { fail, friendlyError, succeed, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";

const NOT_CONFIGURED = "Team management needs SUPABASE_SERVICE_ROLE_KEY in this site's server environment.";

/** Readable one-time password, e.g. "gilvero-7fk2-q9xm-4ta1". */
function temporaryPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `gilvero-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

async function requireOwner() {
  const me = await requireAdmin();
  if (me.role !== "owner") return { me, error: "Only owners can manage the admin team." } as const;
  const service = createServiceClient();
  if (!service) return { me, error: NOT_CONFIGURED } as const;
  return { me, service, error: null } as const;
}

async function ownerCount(service: NonNullable<ReturnType<typeof createServiceClient>>) {
  const { count } = await service.from("admin_users").select("*", { count: "exact", head: true }).eq("role", "owner");
  return count ?? 0;
}

const addSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  fullName: z.string().trim().max(120),
  role: z.enum(["owner", "editor"]),
});

/** Create a login (or re-activate an existing one) and return a one-time password to share. */
export async function addAdmin(input: z.input<typeof addSchema>): Promise<ActionResult<{ id: string; password: string }>> {
  const { service, error } = await requireOwner();
  if (error) return fail(error);
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { email, fullName, role } = parsed.data;

  const { data: existing } = await service.from("admin_users").select("id").eq("email", email).maybeSingle();
  if (existing) return fail("That person is already on the team.");

  const password = temporaryPassword();
  let userId: string | undefined;
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) {
    // The login may exist from before (e.g. removed from the team earlier): reuse it.
    for (let page = 1; !userId; page++) {
      const { data } = await service.auth.admin.listUsers({ page, perPage: 200 });
      userId = data?.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (!data || data.users.length < 200) break;
    }
    if (!userId) return fail(friendlyError(created.error));
    const { error: updateError } = await service.auth.admin.updateUserById(userId, { password, email_confirm: true });
    if (updateError) return fail(friendlyError(updateError));
  } else {
    userId = created.data.user.id;
  }

  const { error: insertError } = await service
    .from("admin_users")
    .insert({ id: userId, email, full_name: fullName || null, role });
  if (insertError) return fail(friendlyError(insertError));
  return succeed({ id: userId, password });
}

export async function setAdminRole(id: string, role: "owner" | "editor"): Promise<ActionResult<null>> {
  const { me, service, error } = await requireOwner();
  if (error) return fail(error);
  if (!z.string().uuid().safeParse(id).success || !["owner", "editor"].includes(role)) return fail("Invalid change.");
  if (role === "editor" && (await ownerCount(service)) <= 1) {
    const { data: target } = await service.from("admin_users").select("role").eq("id", id).single();
    if (target?.role === "owner") return fail("The team needs at least one owner.");
  }
  if (id === me.id && role === "editor" && (await ownerCount(service)) <= 1) return fail("The team needs at least one owner.");

  const { error: updateError } = await service.from("admin_users").update({ role }).eq("id", id);
  if (updateError) return fail(friendlyError(updateError));
  return succeed(null);
}

/** Remove someone from the team and delete their login. */
export async function removeAdmin(id: string): Promise<ActionResult<null>> {
  const { me, service, error } = await requireOwner();
  if (error) return fail(error);
  if (!z.string().uuid().safeParse(id).success) return fail("Invalid admin.");
  if (id === me.id) return fail("You can't remove yourself. Ask another owner.");

  const { data: target } = await service.from("admin_users").select("role").eq("id", id).single();
  if (target?.role === "owner" && (await ownerCount(service)) <= 1) return fail("The team needs at least one owner.");

  const { error: deleteError } = await service.auth.admin.deleteUser(id); // cascades to admin_users
  if (deleteError) return fail(friendlyError(deleteError));
  return succeed(null);
}

/** Replace someone's password with a new one-time password to share with them. */
export async function resetAdminPassword(id: string): Promise<ActionResult<{ password: string }>> {
  const { me, service, error } = await requireOwner();
  if (error) return fail(error);
  if (!z.string().uuid().safeParse(id).success) return fail("Invalid admin.");
  if (id === me.id) return fail("Change your own password from Your account.");

  const password = temporaryPassword();
  const { error: updateError } = await service.auth.admin.updateUserById(id, { password });
  if (updateError) return fail(friendlyError(updateError));
  return succeed({ password });
}
