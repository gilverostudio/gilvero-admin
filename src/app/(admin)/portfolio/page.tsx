import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageTitle } from "@/components/shell/page-title";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { PortfolioTabs } from "./portfolio-tabs";
import { ProjectsBoard, type ProjectRow } from "./projects-board";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: projects }, { data: categories }] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, slug, title, year, status, is_featured, featured_order, sort_order, updated_at, category:portfolio_categories(id, name), cover:media(storage_path, alt, file_name, focal_x, focal_y), project_images(count)",
      )
      .order("sort_order"),
    supabase.from("portfolio_categories").select("id, name").order("sort_order"),
  ]);

  return (
    <>
      <PageTitle
        eyebrow="Portfolio"
        title="Case studies & galleries."
        copy="Drag to set the order on the website. Star a project to show it in the homepage's “Recent commissions”."
        action={
          <Button asChild>
            <Link href="/portfolio/new">
              <Plus /> New project
            </Link>
          </Button>
        }
      />
      <PortfolioTabs />
      <ProjectsBoard projects={(projects ?? []) as unknown as ProjectRow[]} categories={categories ?? []} />
    </>
  );
}
