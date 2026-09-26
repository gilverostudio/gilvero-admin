"use client";

import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  GraduationCap,
  Inbox as InboxIcon,
  LoaderCircle,
  Mail,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Phone,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition, type ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toastResult } from "@/lib/toast-result";
import { cn } from "@/lib/utils";

import { deleteSubmission, getAttachmentLinks, updateSubmission, type Attachment, type SubmissionStatus } from "./actions";

export type Submission = {
  id: string;
  kind: "booking" | "contact" | "academy" | "newsletter" | "career";
  name: string | null;
  email: string | null;
  phone: string | null;
  data: Record<string, unknown>;
  status: SubmissionStatus;
  notes: string | null;
  created_at: string;
};

const KINDS: { value: Submission["kind"] | "all"; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: "all", label: "All", icon: InboxIcon },
  { value: "booking", label: "Bookings", icon: CalendarDays },
  { value: "contact", label: "Enquiries", icon: MessageSquare },
  { value: "academy", label: "Academy", icon: GraduationCap },
  { value: "newsletter", label: "Newsletter", icon: Newspaper },
];

const KIND_LABEL: Record<Submission["kind"], string> = {
  booking: "Booking request",
  contact: "Enquiry",
  academy: "Academy application",
  newsletter: "Newsletter sign-up",
  career: "Job application",
};

const STATUSES: { value: SubmissionStatus; label: string; dot: string }[] = [
  { value: "new", label: "New", dot: "bg-primary shadow-[var(--shadow-glow)]" },
  { value: "in_progress", label: "In progress", dot: "bg-sky-400" },
  { value: "done", label: "Done", dot: "bg-emerald-400" },
  { value: "spam", label: "Spam", dot: "bg-muted-foreground/50" },
];

const FIELD_LABELS: Record<string, string> = {
  service: "Service",
  date: "Preferred date",
  city: "City",
  budget: "Budget",
  course: "Course",
  message: "Message",
};

function timeAgo(iso: string) {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function preview(s: Submission) {
  const message = typeof s.data.message === "string" ? s.data.message : "";
  if (s.kind === "booking") return [s.data.service, s.data.city, message].filter(Boolean).join(" · ");
  if (s.kind === "academy") return [s.data.course, message].filter(Boolean).join(" · ");
  return message;
}

function toCsv(rows: Submission[]) {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r.data)))];
  const header = ["Received", "Type", "Status", "Name", "Email", "Phone", ...keys.map((k) => FIELD_LABELS[k] ?? k), "Notes"];
  const cell = (v: unknown) => {
    const s = Array.isArray(v) ? v.join(" | ") : v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [new Date(r.created_at).toISOString(), KIND_LABEL[r.kind], r.status, r.name, r.email, r.phone, ...keys.map((k) => r.data[k]), r.notes]
      .map(cell)
      .join(","),
  );
  return [header.map(cell).join(","), ...lines].join("\n");
}

export function InboxBoard({ submissions: initial }: { submissions: Submission[] }) {
  const [items, setItems] = useState(initial);
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("all");
  const [status, setStatus] = useState<"open" | SubmissionStatus | "all">("open");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((s) => {
      if (kind !== "all" && s.kind !== kind) return false;
      if (status === "open" && (s.status === "done" || s.status === "spam")) return false;
      if (status !== "open" && status !== "all" && s.status !== status) return false;
      if (!term) return true;
      return [s.name, s.email, s.phone, JSON.stringify(s.data)].some((v) => v?.toLowerCase().includes(term));
    });
  }, [items, kind, status, search]);

  const counts = useMemo(() => {
    const newOnes = items.filter((s) => s.status === "new");
    return Object.fromEntries(KINDS.map((k) => [k.value, k.value === "all" ? newOnes.length : newOnes.filter((s) => s.kind === k.value).length]));
  }, [items]);

  const selected = items.find((s) => s.id === selectedId) ?? null;

  function exportCsv() {
    const blob = new Blob([toCsv(visible)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `gilvero-${kind === "all" ? "inbox" : kind}-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Type filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {KINDS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-1.5 text-xs tracking-wide transition-all duration-500",
              kind === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 text-muted-foreground hover:border-primary/50 hover:text-primary",
            )}
          >
            <Icon className="size-3.5" />
            {label}
            {counts[value] ? (
              <span className={cn("rounded-full px-1.5 text-[0.65rem]", kind === value ? "bg-primary-foreground/15" : "bg-primary/15 text-primary")}>
                {counts[value]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
        {/* List */}
        <section className={cn("min-w-0", selected && "hidden lg:block")}>
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="pl-10" />
            </div>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as typeof status)}
              className="w-36"
              options={[
                { value: "open", label: "Open" },
                ...STATUSES.map((s) => ({ value: s.value, label: s.label })),
                { value: "all", label: "Everything" },
              ]}
            />
          </div>
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {visible.length} item{visible.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!visible.length}
              className="flex cursor-pointer items-center gap-1.5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="size-3.5" /> Export CSV
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
              <InboxIcon className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {items.length ? "Nothing here with these filters." : "No submissions yet. Website forms will appear here."}
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5 lg:max-h-[calc(100svh-18rem)] lg:overflow-y-auto lg:pr-1">
              {visible.map((s) => {
                const dot = STATUSES.find((x) => x.value === s.status)!.dot;
                const Icon = KINDS.find((k) => k.value === s.kind)?.icon ?? InboxIcon;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        "flex w-full cursor-pointer gap-3 rounded-2xl border p-3.5 text-left transition-colors",
                        selectedId === s.id ? "border-primary/50 bg-primary/[0.06]" : "border-border/60 bg-card/40 hover:border-primary/30",
                      )}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground">
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn("truncate text-sm", s.status === "new" ? "font-semibold" : "text-foreground/85")}>
                            {s.name || s.email}
                          </span>
                          <span className="ml-auto shrink-0 text-[0.7rem] text-muted-foreground">{timeAgo(s.created_at)}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
                          <span className="truncate text-xs text-muted-foreground">{preview(s) || KIND_LABEL[s.kind]}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Detail */}
        <section className={cn("min-w-0", !selected && "hidden lg:block")}>
          {selected ? (
            <Detail
              key={selected.id}
              submission={selected}
              onBack={() => setSelectedId(null)}
              onChange={(patch) => setItems((all) => all.map((s) => (s.id === selected.id ? { ...s, ...patch } : s)))}
              onDeleted={() => {
                setItems((all) => all.filter((s) => s.id !== selected.id));
                setSelectedId(null);
              }}
            />
          ) : (
            <div className="panel flex h-full min-h-72 flex-col items-center justify-center gap-3 p-10 text-center text-sm text-muted-foreground">
              <Mail className="size-6" />
              Select a submission to read it.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Detail({
  submission: s,
  onBack,
  onChange,
  onDeleted,
}: {
  submission: Submission;
  onBack: () => void;
  onChange: (patch: Partial<Submission>) => void;
  onDeleted: () => void;
}) {
  const [notes, setNotes] = useState(s.notes ?? "");
  const [attachments, setAttachments] = useState<Attachment[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSave] = useTransition();
  const [, startStatus] = useTransition();
  const [deleting, startDelete] = useTransition();
  const hasAttachments = Array.isArray(s.data.attachments) && s.data.attachments.length > 0;

  useEffect(() => {
    if (!hasAttachments) return;
    let active = true;
    getAttachmentLinks(s.id).then((links) => active && setAttachments(links));
    return () => {
      active = false;
    };
  }, [s.id, hasAttachments]);

  function setStatus(status: SubmissionStatus) {
    const previous = s.status;
    onChange({ status });
    startStatus(async () => {
      const label = STATUSES.find((x) => x.value === status)!.label;
      if (!toastResult(await updateSubmission(s.id, { status }), `Marked as ${label.toLowerCase()}`)) onChange({ status: previous });
    });
  }

  const fields = Object.entries(s.data).filter(([k, v]) => k !== "attachments" && k !== "message" && v !== "" && v != null);
  const message = typeof s.data.message === "string" ? s.data.message : "";
  const digits = (s.phone ?? "").replace(/\D/g, "");
  const received = new Date(s.created_at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });

  return (
    <article className="panel reveal overflow-hidden">
      <header className="border-b border-border/60 p-5 sm:p-7">
        <button type="button" onClick={onBack} className="mb-4 flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-primary lg:hidden">
          <ArrowLeft className="size-3.5" /> All submissions
        </button>
        <p className="eyebrow">{KIND_LABEL[s.kind]}</p>
        <h2 className="mt-2 text-2xl">{s.name || s.email}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Received {received}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {s.email ? (
            <Button asChild size="sm">
              <a href={`mailto:${s.email}?subject=${encodeURIComponent(`Re: your ${KIND_LABEL[s.kind].toLowerCase()} — Gilvero`)}`}>
                <Mail /> Reply by email
              </a>
            </Button>
          ) : null}
          {s.phone ? (
            <>
              <Button asChild size="sm" variant="quiet">
                <a href={`tel:${s.phone}`}>
                  <Phone /> {s.phone}
                </a>
              </Button>
              {digits.length >= 8 ? (
                <Button asChild size="sm" variant="quiet">
                  <a href={`https://wa.me/${digits.startsWith("0") ? `92${digits.slice(1)}` : digits}`} target="_blank" rel="noreferrer">
                    <MessageCircle /> WhatsApp
                  </a>
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </header>

      <div className="space-y-7 p-5 sm:p-7">
        {/* Status */}
        <div>
          <p className="mb-2.5 text-xs tracking-wide text-muted-foreground">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => option.value !== s.status && setStatus(option.value)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                  s.status === option.value ? "border-primary/60 bg-primary/10 text-foreground" : "border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("size-1.5 rounded-full", option.dot)} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        {s.email || fields.length ? (
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {s.email ? (
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="mt-1 text-sm break-all">{s.email}</dd>
              </div>
            ) : null}
            {fields.map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs text-muted-foreground">{FIELD_LABELS[key] ?? key}</dt>
                <dd className="mt-1 text-sm">
                  {key === "date" && typeof value === "string"
                    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { dateStyle: "full" })
                    : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {message ? (
          <div>
            <p className="text-xs text-muted-foreground">Message</p>
            <p className="mt-2 rounded-2xl border border-border/60 bg-background/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
          </div>
        ) : null}

        {hasAttachments ? (
          <div>
            <p className="text-xs text-muted-foreground">Reference files</p>
            {attachments === null ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-3.5 animate-spin" /> Loading…
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {attachments.map((file) =>
                  file.url && file.isImage ? (
                    <a key={file.path} href={file.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-border/60">
                      {/* Signed, short-lived URL — not routed through next/image. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={file.url} alt={file.name} className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </a>
                  ) : (
                    <a
                      key={file.path}
                      href={file.url ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-border/60 p-3 text-center text-xs text-muted-foreground hover:text-primary"
                    >
                      <FileText className="size-5" />
                      <span className="line-clamp-2 break-all">{file.name}</span>
                    </a>
                  ),
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Notes */}
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Internal notes</p>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={5000} placeholder="Quoted PKR 250,000 on 12 Oct; follow up Friday." />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant="quiet"
              disabled={saving || notes === (s.notes ?? "")}
              onClick={() =>
                startSave(async () => {
                  if (toastResult(await updateSubmission(s.id, { notes }), "Notes saved")) onChange({ notes });
                })
              }
            >
              {saving ? <LoaderCircle className="animate-spin" /> : null} Save notes
            </Button>
          </div>
        </div>

        <div className="border-t border-border/60 pt-5">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">Delete permanently{hasAttachments ? ", including its files" : ""}?</span>
              <Button
                size="sm"
                disabled={deleting}
                className="bg-none bg-destructive text-destructive-foreground shadow-none"
                onClick={() =>
                  startDelete(async () => {
                    if (toastResult(await deleteSubmission(s.id), "Submission deleted")) onDeleted();
                  })
                }
              >
                {deleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />} Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} className="text-muted-foreground hover:text-destructive">
              <Trash2 /> Delete
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
