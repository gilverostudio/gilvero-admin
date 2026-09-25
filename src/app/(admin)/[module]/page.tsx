import { Check, Hammer } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageTitle } from "@/components/shell/page-title";
import { requireAdmin } from "@/lib/auth";
import { countRows } from "@/lib/counts";
import { getModule } from "@/lib/modules";

export async function generateMetadata({ params }: PageProps<"/[module]">): Promise<Metadata> {
  const { module: slug } = await params;
  return { title: getModule(slug)?.label ?? "Not found" };
}

/**
 * Placeholder for editors that ship in later phases. Shows what the editor will
 * manage and how much content is already in the database for it.
 */
export default async function ModulePage({ params }: PageProps<"/[module]">) {
  await requireAdmin();
  const { module: slug } = await params;
  const mod = getModule(slug);
  if (!mod || mod.slug === "") notFound();

  const counts = await countRows(mod.tables.map((t) => t.table));
  const Icon = mod.icon;

  return (
    <>
      <PageTitle eyebrow={mod.label} title={mod.description} />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="reveal glass relative overflow-hidden rounded-[1.75rem] p-8 sm:p-10">
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-[90px]" />
          <div className="relative">
            <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <p className="eyebrow mt-8 flex items-center gap-2">
              <Hammer className="size-3.5" /> Editor arrives in phase {mod.phase}
            </p>
            <h2 className="mt-4 text-2xl">What you&apos;ll be able to do here</h2>
            <ul className="mt-6 space-y-3">
              {mod.manages.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-foreground/80">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="reveal panel p-6 sm:p-8" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Already in the database</p>
          <dl className="mt-6 space-y-5">
            {mod.tables.map((t) => (
              <div key={t.table} className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                <dt className="text-sm text-muted-foreground">{t.label}</dt>
                <dd className="font-display text-2xl font-semibold">{counts[t.table] ?? "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            Seeded from the live website, so nothing needs re-typing when the editor ships.
          </p>
        </aside>
      </div>
    </>
  );
}
