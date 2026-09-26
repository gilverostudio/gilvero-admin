import type { Metadata } from "next";

import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <main className="gold-wash flex min-h-svh items-center justify-center px-5 py-16">
      <div className="reveal w-full max-w-sm">
        <span className="font-display text-base tracking-[0.42em]">GILVERO</span>
        <p className="eyebrow mt-10">Reset password</p>
        <h1 className="mt-4 text-3xl">Forgot your password?</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter the email you sign in with and we&apos;ll send a link to choose a new one.
        </p>
        <div className="glass mt-10 rounded-[1.75rem] p-7 sm:p-8">
          <ForgotForm />
        </div>
      </div>
    </main>
  );
}
