import { ArrowUpRight, CircleCheck, CircleDashed, CircleX } from "lucide-react";
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

const LINK_STATUS = {
  connected: { icon: CircleCheck, tone: "text-emerald-400", text: "Connected — saves refresh the live site instantly." },
  unauthorised: { icon: CircleX, tone: "text-destructive", text: "The website rejected the secret. Check REVALIDATE_SECRET on both projects." },
  unreachable: { icon: CircleX, tone: "text-destructive", text: "Website not reachable, or /api/revalidate is not deployed yet." },
  "not-configured": { icon: CircleDashed, tone: "text-muted-foreground", text: "Set WEBSITE_REVALIDATE_SECRET to enable instant publishing." },
} as const;

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Karachi" }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const moduleTables = allModules.flatMap((m) => m.tables.map((t) => t.table));
  const [counts, link, newSubmissions] = await Promise.all([
    countRows([...new Set([...HIGHLIGHTS.map((h) => h.table), ...moduleTables])]),
    checkWebsiteLink(),
    countNewSubmissions(),
  ]);
  const status = LINK_STATUS[link];
  const firstName = admin.full_name?.split(" ")[0];

  return (
    <>
      <PageTitle
        eyebrow="Dashboard"
        title={
          <>
            {greeting()}
            {firstName ? <>, <span className="gold-text">{firstName}</span></> : null}.
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
            <p className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {counts[h.table] ?? "—"}
            </p>
          </Link>
        ))}
        <Link
          href="/inbox"
          style={{ animationDelay: "240ms" }}
          className="reveal group col-span-2 rounded-[1.25rem] border border-primary/30 bg-primary/[0.07] p-5 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)] sm:p-6 lg:col-span-1"
        >
          <p className="text-xs tracking-wide text-primary/80">New enquiries</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {newSubmissions ?? "—"}
          </p>
        </Link>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Content map */}
        <section className="reveal panel p-6 sm:p-8" style={{ animationDelay: "120ms" }}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xl">Site content</h2>
            <p className="text-xs text-muted-foreground">Seeded from the live website</p>
          </div>
          <ul className="mt-6 divide-y divide-border/60">
            {allModules
              .filter((m) => m.tables.length)
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
                      <span className="hidden shrink-0 rounded-full border border-border/70 px-2.5 py-1 text-[0.65rem] tracking-wider text-muted-foreground sm:inline">
                        Editor in phase {m.phase}
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>

        {/* Side column */}
        <aside className="space-y-6">
          <section className="reveal panel p-6" style={{ animationDelay: "180ms" }}>
            <p className="eyebrow">Website link</p>
            <div className="mt-4 flex items-start gap-3">
              <status.icon className={cn("mt-0.5 size-5 shrink-0", status.tone)} />
              <p className="text-sm leading-relaxed text-foreground/80">{status.text}</p>
            </div>
            <p className="mt-4 truncate text-xs text-muted-foreground">{env.websiteUrl()}</p>
          </section>

          <section className="reveal glass rounded-[1.25rem] p-6" style={{ animationDelay: "240ms" }}>
            <p className="eyebrow">Roadmap</p>
            <ol className="mt-4 space-y-3 text-sm">
              {[
                ["0", "Foundation, database & sign-in", true],
                ["1", "Media library & portfolio", false],
                ["2", "Homepage & site settings", false],
                ["3", "Journal, academy, services, about", false],
                ["4", "Inbox for every website form", false],
                ["5", "Print store, pages & SEO", false],
              ].map(([phase, label, done]) => (
                <li key={phase as string} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold",
                      done ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground",
                    )}
                  >
                    {phase}
                  </span>
                  <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}

async function countNewSubmissions() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");
  return count;
}
