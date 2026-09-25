import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

import { EditorPanel } from "@/components/content/editor-panel";
import { MediaIndexProvider } from "@/components/content/media-context";
import { PageTitle } from "@/components/shell/page-title";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { homepageEditors } from "@/lib/content/editors";
import { loadEditors } from "@/lib/content/load";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Homepage" };

export default async function HomepagePage() {
  await requireAdmin();
  const { loaded, media } = await loadEditors(homepageEditors);
  const websiteUrl = env.websiteUrl();

  return (
    <>
      <PageTitle
        eyebrow="Homepage"
        title="Every section of the landing page."
        copy="Sections are listed in the order they appear on the site. Open one, edit, and save — the live homepage updates on the next visit."
        action={
          <Button asChild variant="quiet">
            <a href={websiteUrl} target="_blank" rel="noreferrer">
              View homepage <ArrowUpRight />
            </a>
          </Button>
        }
      />

      <MediaIndexProvider initial={media}>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[13rem_1fr]">
          <nav className="hidden xl:block">
            <ol className="sticky top-24 space-y-0.5 border-l border-border/60">
              {homepageEditors.map((editor, i) => (
                <li key={editor.id}>
                  <a
                    href={`#${editor.id}`}
                    className="-ml-px flex gap-3 border-l border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    <span className="w-4 text-xs text-muted-foreground/60">{i + 1}</span>
                    {editor.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="min-w-0 space-y-3">
            {homepageEditors.map((editor, i) => (
              <EditorPanel key={editor.id} editor={editor} initialValues={loaded[i].values} websiteUrl={websiteUrl} />
            ))}
          </div>
        </div>
      </MediaIndexProvider>
    </>
  );
}
