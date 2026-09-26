import {
  ArrowRight,
  ArrowUpRight,
  CircleCheck,
  CircleDashed,
  CircleX,
  House,
  ImageUp,
  Inbox,
  PenLine,
  SwatchBook,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageTitle } from "@/components/shell/page-title";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { countRows } from "@/lib/counts";
import { env } from "@/lib/env";
import { allModules } from "@/lib/modules";
import { checkWebsiteLink } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const HIGHLIGHTS = [
  { table: "projects", label: "Case studies", href: "/portfolio" },
  { table: "posts", label: "Journal posts", href: "/journal" },
  { table: "courses", label: "Courses", href: "/academy" },
  { table: "media", label: "Images", href: "/media" },
];

const QUICK_ACTIONS = [
  { href: "/portfolio/new", label: "New case study", icon: SwatchBook },
  { href: "/journal/new", label: "Write an article", icon: PenLine },
  { href: "/media", label: "Upload images", icon: ImageUp },
  { href: "/homepage", label: "Edit the homepage", icon: House },
];

const LINK_STATUS = {
  connected: { icon: CircleCheck, tone: "text-emerald-400", text: "Connected — saves refresh the live site instantly." },
  unauthorised: {
    icon: CircleX,
    tone: "text-destructive",
    text: "The website rejected the secret. REVALIDATE_SECRET on the website must match WEBSITE_REVALIDATE_SECRET here.",
  },
  unreachable: {
    icon: CircleX,
    tone: "text-destructive",
    text: "Website not reachable, or it's running an older build without /api/revalidate.",
  },
  "not-configured": {
    icon: CircleDashed,
    tone: "text-muted-foreground",
    text: "Set WEBSITE_REVALIDATE_SECRET to publish changes instantly (otherwise the site catches up within an hour).",
  },
} as const;

const KIND_LABEL: Record<string, string> = {
  booking: "Booking request",
  contact: "Enquiry",
  academy: "Academy application",
  newsletter: "Newsletter sign-up",
  career: "Job application",
};

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Karachi" }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(iso: string) {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type RecentSubmission = { id: string; kind: string; name: string | null; email: string | null; status: string; created_at: string };

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const moduleTables = allModules.flatMap((m) => m.tables.map((t) => t.table));
  const [counts, link, { count: newSubmissions }, { data: recent }] = await Promise.all([
    countRows([...new Set([...HIGHLIGHTS.map((h) => h.table), ...moduleTables])]),
    checkWebsiteLink(),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase
      .from("submissions")
      .select("id, kind, name, email, status, created_at")
      .neq("status", "spam")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const status = LINK_STATUS[link];
  const firstName = admin.full_name?.split(" ")[0];
  const recentItems = (recent ?? []) as RecentSubmission[];

  return (
    <>
      <PageTitle
        eyebrow="Dashboard"
        title={
          <>
            {greeting()}
            {firstName ? (
              <>
                , <span className="gold-text">{firstName}</span>
              </>
            ) : null}
            .
          </>
        }
        copy="Everything published on gilvero.com, in one place."
        action={
          <Button asChild variant="gold">
            <a href={env.websiteUrl()} target="_blank" rel="noreferrer">
              Open gilvero.com
              <ArrowUpRight />
            </a>
          </Button>
        }
      />

      {/* Highlights */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {HIGHLIGHTS.map((h, i) => (
          <Link
            key={h.table}
            href={h.href}
            style={{ animationDelay: `${i * 60}ms` }}
            className="reveal panel group p-5 transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/40 sm:p-6"
          >
            <p className="text-xs tracking-wide text-muted-foreground">{h.label}</p>
            <p className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{counts[h.table] ?? "—"}</p>
          </Link>
        ))}
        <Link
          href="/inbox"
          style={{ animationDelay: "240ms" }}
          className="reveal group col-span-2 rounded-[1.25rem] border border-primary/30 bg-primary/[0.07] p-5 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)] sm:p-6 lg:col-span-1"
        >
          <p className="text-xs tracking-wide text-primary/80">New enquiries</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{newSubmissions ?? "—"}</p>
        </Link>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          {/* Recent enquiries */}
          <section className="reveal panel p-6 sm:p-8" style={{ animationDelay: "120ms" }}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl">Latest enquiries</h2>
              <Link href="/inbox" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                Open inbox <ArrowRight className="size-3.5" />
              </Link>
            </div>
            {recentItems.length ? (
              <ul className="mt-5 divide-y divide-border/60">
                {recentItems.map((s) => (
                  <li key={s.id}>
                    <Link href="/inbox" className="group flex items-center gap-3 py-3">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          s.status === "new" ? "bg-primary shadow-[var(--shadow-glow)]" : s.status === "done" ? "bg-emerald-400" : "bg-sky-400",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm group-hover:text-primary", s.status === "new" && "font-semibold")}>
                          {s.name || s.email}
                        </span>
                        <span className="text-xs text-muted-foreground">{KIND_LABEL[s.kind] ?? s.kind}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(s.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                <Inbox className="size-4 shrink-0" />
                Nothing yet — bookings, enquiries and applications from the website appear here.
              </div>
            )}
          </section>

          {/* Content overview */}
          <section className="reveal panel p-6 sm:p-8" style={{ animationDelay: "180ms" }}>
            <h2 className="text-xl">Site content</h2>
            <ul className="mt-5 divide-y divide-border/60">
              {allModules
                .filter((m) => m.tables.length && m.slug !== "inbox")
                .map((m) => {
                  const Icon = m.icon;
                  return (
                    <li key={m.slug}>
                      <Link href={`/${m.slug}`} className="group flex items-center gap-4 py-3.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium transition-colors group-hover:text-primary">{m.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {m.tables.map((t) => `${counts[t.table] ?? "—"} ${t.label.toLowerCase()}`).join(" · ")}
                          </span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-6">
          <section className="reveal glass rounded-[1.25rem] p-6" style={{ animationDelay: "180ms" }}>
            <p className="eyebrow">Quick actions</p>
            <ul className="mt-4 space-y-1.5">
              {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm transition-colors hover:border-border/70 hover:bg-background/40"
                  >
                    <Icon className="size-4 text-primary" />
                    <span className="flex-1">{label}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="reveal panel p-6" style={{ animationDelay: "240ms" }}>
            <p className="eyebrow">Website link</p>
            <div className="mt-4 flex items-start gap-3">
              <status.icon className={cn("mt-0.5 size-5 shrink-0", status.tone)} />
              <p className="text-sm leading-relaxed text-foreground/80">{status.text}</p>
            </div>
            <p className="mt-4 truncate text-xs text-muted-foreground">{env.websiteUrl()}</p>
          </section>
        </aside>
      </div>
    </>
  );
}
