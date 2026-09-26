import type { Metadata } from "next";

import { PageTitle } from "@/components/shell/page-title";
import { requireAdmin } from "@/lib/auth";

import { isRecoverySession } from "./actions";
import { NameForm, PasswordForm } from "./account-forms";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  const recovery = await isRecoverySession();

  return (
    <>
      <PageTitle
        eyebrow="Account"
        title={recovery ? "Choose a new password." : "Your account."}
        copy={recovery ? "You signed in with a reset link. Set a new password to finish." : `Signed in as ${admin.email} · ${admin.role}`}
      />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <PasswordForm recovery={recovery} />
        <NameForm initial={admin.full_name ?? ""} email={admin.email} role={admin.role} />
      </div>
    </>
  );
}
