import type { Metadata } from "next";

import { PageTitle } from "@/components/shell/page-title";
import { SubTabs } from "@/components/shell/sub-tabs";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { JOURNAL_TABS } from "../tabs";
import { BlogCategories, type BlogCategoryRow } from "./blog-categories";

export const metadata: Metadata = { title: "Journal categories" };

export default async function JournalCategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("blog_categories").select("id, name, posts(count)").order("sort_order");

  return (
    <>
      <PageTitle
        eyebrow="Journal"
        title="Categories."
        copy="The filter buttons on the journal page, in this order."
      />
      <SubTabs tabs={JOURNAL_TABS} />
      <BlogCategories categories={(data ?? []) as unknown as BlogCategoryRow[]} />
    </>
  );
}
