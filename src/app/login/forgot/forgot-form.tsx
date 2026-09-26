"use client";

import { ArrowLeft, LoaderCircle, MailCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { requestPasswordReset, type ResetState } from "../actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestPasswordReset, { sent: false, error: null });

  if (state.sent) {
    return (
      <div className="space-y-5 text-center">
        <MailCheck className="mx-auto size-7 text-primary" />
        <p className="text-sm leading-relaxed text-foreground/85">
          If that email belongs to an admin account, a reset link is on its way. It works once and expires after an hour.
        </p>
        <Button asChild variant="quiet" className="w-full">
          <Link href="/login">
            <ArrowLeft /> Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs tracking-wide text-muted-foreground">
          Email
        </Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@gilvero.com" className="h-12 px-5" />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : null} Send reset link
      </Button>
      <Link href="/login" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-3.5" /> Back to sign in
      </Link>
    </form>
  );
}
