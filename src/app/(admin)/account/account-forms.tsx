"use client";

import { Eye, EyeOff, KeyRound, LoaderCircle, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormSection } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toastResult } from "@/lib/toast-result";

import { changePassword, updateMyName } from "./actions";

export function PasswordForm({ recovery }: { recovery: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [pending, start] = useTransition();
  const strong = password.length >= 10;

  return (
    <FormSection
      title="Password"
      description={recovery ? "No current password needed — you came from a reset link." : "At least 10 characters."}
      aside={<KeyRound className="size-5 text-primary" />}
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            if (toastResult(await changePassword({ current, password, confirm }), "Password changed")) {
              setCurrent("");
              setPassword("");
              setConfirm("");
              if (recovery) router.replace("/");
            }
          });
        }}
      >
        {recovery ? null : (
          <Field label="Current password" htmlFor="current">
            <Input id="current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
        )}
        <Field label="New password" htmlFor="new-password" hint={password && !strong ? "Use at least 10 characters." : undefined}>
          <div className="relative">
            <Input
              id="new-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={10}
              maxLength={72}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide passwords" : "Show passwords"}
              className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Field label="Repeat new password" htmlFor="confirm" hint={confirm && confirm !== password ? "The passwords don't match yet." : undefined}>
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" disabled={pending || !strong || password !== confirm || (!recovery && !current)}>
          {pending ? <LoaderCircle className="animate-spin" /> : null} Change password
        </Button>
      </form>
    </FormSection>
  );
}

export function NameForm({ initial, email, role }: { initial: string; email: string; role: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <FormSection title="Profile" description="Shown in the admin header." aside={<UserRound className="size-5 text-primary" />}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            if (toastResult(await updateMyName(name), "Name saved")) {
              setSaved(name);
              router.refresh();
            }
          });
        }}
      >
        <Field label="Display name" htmlFor="full-name">
          <Input id="full-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Your name" />
        </Field>
        <Field label="Email" htmlFor="email" hint="Ask an owner to change the email on your account.">
          <Input id="email" value={email} disabled />
        </Field>
        <Field label="Role" htmlFor="role">
          <Input id="role" value={role === "owner" ? "Owner — can manage the admin team" : "Editor"} disabled />
        </Field>
        <Button type="submit" variant="quiet" disabled={pending || name === saved}>
          {pending ? <LoaderCircle className="animate-spin" /> : null} Save
        </Button>
      </form>
    </FormSection>
  );
}
