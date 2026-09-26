"use client";

import { Check, Copy, KeyRound, LoaderCircle, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toastResult } from "@/lib/toast-result";

import { addAdmin, removeAdmin, resetAdminPassword, setAdminRole } from "./team-actions";

export type TeamMember = { id: string; email: string; full_name: string | null; role: "owner" | "editor" };

type TeamManagerProps = {
  members: TeamMember[];
  meId: string;
  canManage: boolean;
  /** Why management is unavailable (not an owner, or the service key isn't configured). */
  notice: string | null;
};

export function TeamManager({ members: initial, meId, canManage, notice }: TeamManagerProps) {
  const [members, setMembers] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string; isNew: boolean } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="panel mt-8 p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-primary" />
          <div>
            <h2 className="text-lg">Admin team</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Owners can add people, change roles and reset passwords. Editors can edit all content.
            </p>
          </div>
        </div>
        {canManage ? (
          <Button size="sm" onClick={() => setAdding(true)} className="shrink-0">
            <UserPlus /> Add admin
          </Button>
        ) : null}
      </div>
      {notice ? <p className="mt-4 rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-xs text-muted-foreground">{notice}</p> : null}

      <ul className="mt-5 divide-y divide-border/60">
        {members.map((m) => {
          const isMe = m.id === meId;
          return (
            <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {m.full_name || m.email}
                  {isMe ? <span className="text-muted-foreground"> (you)</span> : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
              {canManage && !isMe ? (
                <div className="flex items-center gap-1.5">
                  <Select
                    value={m.role}
                    className="h-9 w-28"
                    options={[
                      { value: "editor", label: "Editor" },
                      { value: "owner", label: "Owner" },
                    ]}
                    onValueChange={(role) =>
                      start(async () => {
                        const next = role as TeamMember["role"];
                        if (toastResult(await setAdminRole(m.id, next), `${m.full_name || m.email} is now ${next === "owner" ? "an owner" : "an editor"}`)) {
                          setMembers((all) => all.map((x) => (x.id === m.id ? { ...x, role: next } : x)));
                        }
                      })
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Reset password"
                    aria-label={`Reset password for ${m.email}`}
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const result = await resetAdminPassword(m.id);
                        if (toastResult(result, "New password created")) setCredentials({ email: m.email, password: result.data.password, isNew: false });
                      })
                    }
                  >
                    <KeyRound />
                  </Button>
                  {confirmRemove === m.id ? (
                    <Button
                      size="sm"
                      disabled={pending}
                      className="bg-none bg-destructive text-destructive-foreground shadow-none"
                      onClick={() =>
                        start(async () => {
                          if (toastResult(await removeAdmin(m.id), `${m.email} removed`)) {
                            setMembers((all) => all.filter((x) => x.id !== m.id));
                          }
                          setConfirmRemove(null);
                        })
                      }
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Remove from team"
                      aria-label={`Remove ${m.email}`}
                      onClick={() => setConfirmRemove(m.id)}
                      className="hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
              ) : (
                <Badge tone={m.role === "owner" ? "gold" : "neutral"}>{m.role}</Badge>
              )}
            </li>
          );
        })}
      </ul>

      <AddAdminDialog
        open={adding}
        onOpenChange={setAdding}
        onAdded={(member, password) => {
          setMembers((all) => [...all, member]);
          setCredentials({ email: member.email, password, isNew: true });
        }}
      />
      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </section>
  );
}

function AddAdminDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (member: TeamMember, password: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<TeamMember["role"]>("editor");
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/70 sm:rounded-[1.5rem]">
        <DialogTitle className="text-xl">Add an admin</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          We&apos;ll create their login and show you a one-time password to share with them.
        </DialogDescription>
        <form
          className="mt-2 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const result = await addAdmin({ email, fullName, role });
              if (toastResult(result, `${email} added`)) {
                onAdded({ id: result.data.id, email: email.trim().toLowerCase(), full_name: fullName || null, role }, result.data.password);
                setEmail("");
                setFullName("");
                setRole("editor");
                onOpenChange(false);
              }
            });
          }}
        >
          <Field label="Email" htmlFor="new-admin-email">
            <Input id="new-admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Name" htmlFor="new-admin-name">
            <Input id="new-admin-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} />
          </Field>
          <Field label="Role" htmlFor="new-admin-role" hint="Owners can also manage the team.">
            <Select
              id="new-admin-role"
              value={role}
              onValueChange={(v) => setRole(v as TeamMember["role"])}
              options={[
                { value: "editor", label: "Editor" },
                { value: "owner", label: "Owner" },
              ]}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <UserPlus />} Create login
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: { email: string; password: string; isNew: boolean } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = credentials ? `Gilvero admin — ${typeof window === "undefined" ? "" : window.location.origin}\nEmail: ${credentials.email}\nPassword: ${credentials.password}` : "";

  return (
    <Dialog open={Boolean(credentials)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-border/70 sm:rounded-[1.5rem]">
        <DialogTitle className="text-xl">{credentials?.isNew ? "Login created" : "Password reset"}</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Share these details privately. This password is shown only once — they can change it under Your account after signing in.
        </DialogDescription>
        <div className="mt-2 space-y-3 rounded-2xl border border-primary/30 bg-primary/[0.06] p-4 font-mono text-sm">
          <p className="break-all">{credentials?.email}</p>
          <p className="break-all text-primary">{credentials?.password}</p>
        </div>
        <Button
          variant="quiet"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy sign-in details"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
