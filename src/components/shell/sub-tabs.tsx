"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/** Underlined tab links for a module's sub-pages. */
export function SubTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex gap-1 border-b border-border/60">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn("relative px-4 pb-3 text-sm transition-colors", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            {tab.label}
            {active ? <span className="absolute inset-x-3 -bottom-px h-px bg-primary shadow-[var(--shadow-glow)]" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
