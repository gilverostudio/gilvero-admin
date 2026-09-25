import type { Metadata } from "next";

import { PageTitle } from "@/components/shell/page-title";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { PortfolioTabs } from "../portfolio-tabs";
import { CategoriesManager, type CategoryRow } from "./categories-manager";

export const metadata: Metadata = { title: "Portfolio categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_categories")
    .select("id, name, slug, is_visible, projects(count)")
    .order("sort_order");

  return (
    <>
      <PageTitle
        eyebrow="Portfolio"
        title="Categories."
        copy="These become the filter buttons on the portfolio page, in this order. Hidden categories keep their projects but don't show a filter."
      />
      <PortfolioTabs />
      <CategoriesManager categories={(data ?? []) as unknown as CategoryRow[]} />
    </>
  );
}
