"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { moduleGroups } from "@/lib/modules";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  onNavigate?: () => void;
  /** Counts shown next to a module, keyed by slug (e.g. new inbox items). */
  badges?: Record<string, number>;
};

/** Grouped module navigation with optional count badges (e.g. new inbox items). */
export function SidebarNav({ onNavigate, badges = {} }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-7">
      {moduleGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[0.625rem] font-medium tracking-[0.28em] text-muted-foreground/60 uppercase">
            {group.label}
          </p>
          <ul className="mt-2.5 space-y-0.5">
            {group.modules.map((module) => {
              const href = `/${module.slug}`;
              const active = module.slug === "" ? pathname === "/" : pathname.startsWith(href);
              const Icon = module.icon;
              return (
                <li key={module.slug || "dashboard"}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-secondary/70 hover:text-foreground",
                    )}
                  >
                    {active ? (
                      <span className="absolute top-1/2 -left-3 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary shadow-[var(--shadow-glow)]" />
                    ) : null}
                    <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className="flex-1 truncate">{module.label}</span>
                    {badges[module.slug] ? (
                      <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-[0.65rem] font-semibold text-primary-foreground">
                        {badges[module.slug]}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
