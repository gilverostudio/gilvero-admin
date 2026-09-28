import "server-only";

import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Password-reset emails sent by the portal itself (Resend), instead of
 * Supabase's built-in mailer. The link carries a one-time token_hash straight
 * to /auth/confirm, so it doesn't depend on Supabase's redirect allow-list,
 * its low sending limits, or being opened in the browser that asked for it.
 *
 *   SUPABASE_SERVICE_ROLE_KEY — to mint the one-time link
 *   RESEND_API_KEY            — to send it
 *   NOTIFY_FROM               — sender on a domain verified in Resend
 *   ADMIN_URL                 — the portal's public origin (default https://portal.gilvero.com)
 */

const RESEND_COOLDOWN_MS = 60_000;

export function portalOrigin(host: string | null) {
  if (process.env.ADMIN_URL) return process.env.ADMIN_URL.replace(/\/$/, "");
  // Never trust the Host header for links in emails, except for local development.
  if (host && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return `http://${host}`;
  return "https://portal.gilvero.com";
}

/** True when this deployment can send reset emails itself. */
export function canSendResetEmail() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.RESEND_API_KEY);
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails a reset link when `email` belongs to an admin. Silent otherwise, so
 * the form can't reveal which addresses have accounts.
 */
export async function sendResetEmail(email: string, origin: string) {
  const service = createServiceClient();
  if (!service) return;

  const { data: admin } = await service.from("admin_users").select("id, full_name").eq("email", email).maybeSingle();
  if (!admin) return;

  // Don't let the form be used to flood an inbox.
  const { data: user } = await service.auth.admin.getUserById(admin.id);
  const lastSent = user.user?.recovery_sent_at ? Date.parse(user.user.recovery_sent_at) : 0;
  if (Date.now() - lastSent < RESEND_COOLDOWN_MS) return;

  const { data: link, error } = await service.auth.admin.generateLink({ type: "recovery", email });
  if (error || !link.properties?.hashed_token) {
    console.error("[reset] generateLink failed", error?.message);
    return;
  }

  const url = `${origin}/auth/confirm?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=recovery`;
  const name = admin.full_name?.split(" ")[0];
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;color:#1a1a1a">
      <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#a07d2c;margin:0 0 8px">Gilvero Studio Admin</p>
      <h2 style="margin:0 0 16px">Reset your password</h2>
      <p style="line-height:1.6">${name ? `Hi ${escape(name)}, s` : "S"}omeone asked to reset the password for your Gilvero admin account. Choose a new one here:</p>
      <p style="margin:28px 0">
        <a href="${url}" style="background:#d9b45a;color:#1a1409;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;display:inline-block">Choose a new password</a>
      </p>
      <p style="font-size:13px;color:#666;line-height:1.6">The link works once and expires after an hour. If you didn't ask for this, you can ignore this email — your password stays the same.</p>
    </div>`;

  try {
    const res = await fetch(`${process.env.RESEND_API_BASE || "https://api.resend.com"}/emails`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "Gilvero Studio <no-reply@gilvero.com>",
        to: [email],
        subject: "Reset your Gilvero admin password",
        html,
      }),
    });
    if (!res.ok) console.error("[reset] Resend responded", res.status, await res.text());
  } catch (err) {
    console.error("[reset] email failed", err);
  }
}
