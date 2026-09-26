import { ArrowUpRight } from "lucide-react";

import { MobileNav } from "@/components/shell/mobile-nav";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { UserMenu } from "@/components/shell/user-menu";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { count: newSubmissions } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");
  const badges = { inbox: newSubmissions ?? 0 };

  return (
    <div className="flex min-h-svh">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border/60 bg-card/30 lg:flex">
        <div className="px-6 pt-7 pb-8">
          <span className="font-display text-base tracking-[0.42em]">GILVERO</span>
          <p className="eyebrow mt-1.5 !text-[0.6rem]">Studio Admin</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <SidebarNav badges={badges} />
        </div>
      </aside>

      {/* Main */}
      <div className="gold-wash flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/60 bg-background/75 px-4 backdrop-blur-xl sm:px-8">
          <MobileNav badges={badges} />
          <span className="font-display text-sm tracking-[0.42em] lg:hidden">GILVERO</span>
          <div className="ml-auto flex items-center gap-3">
            <Button asChild variant="quiet" size="sm" className="hidden sm:inline-flex">
              <a href={env.websiteUrl()} target="_blank" rel="noreferrer">
                View site
                <ArrowUpRight />
              </a>
            </Button>
            <UserMenu admin={admin} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-8 sm:py-12">{children}</main>
      </div>
    </div>
  );
}
