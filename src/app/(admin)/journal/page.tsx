import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageTitle } from "@/components/shell/page-title";
import { SubTabs } from "@/components/shell/sub-tabs";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { MEDIA_COLUMNS } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

import { PostsBoard, type PostRow } from "./posts-board";
import { JOURNAL_TABS } from "./tabs";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: posts }, { data: categories }] = await Promise.all([
    supabase
      .from("posts")
      .select(`id, slug, title, published_on, read_time, status, is_featured, category:blog_categories(id, name), cover:media(${MEDIA_COLUMNS})`)
      .order("published_on", { ascending: false, nullsFirst: true }),
    supabase.from("blog_categories").select("id, name").order("sort_order"),
  ]);

  return (
    <>
      <PageTitle
        eyebrow="Journal"
        title="Articles & notes from the studio."
        copy="Newest first, by publish date. Star an article to show it in the homepage's “Latest writing”."
        action={
          <Button asChild>
            <Link href="/journal/new">
              <Plus /> New article
            </Link>
          </Button>
        }
      />
      <SubTabs tabs={JOURNAL_TABS} />
      <PostsBoard posts={(posts ?? []) as unknown as PostRow[]} categories={categories ?? []} />
    </>
  );
}
