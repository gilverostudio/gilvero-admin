import { ArrowUpRight } from "lucide-react";

import { PageTitle } from "@/components/shell/page-title";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import type { Editor } from "@/lib/content/editors";
import { loadEditors } from "@/lib/content/load";
import { env } from "@/lib/env";

import { EditorPanel } from "./editor-panel";
import { MediaIndexProvider } from "./media-context";

type EditorsPageProps = {
  eyebrow: string;
  title: string;
  copy: string;
  editors: Editor[];
  /** Website path for the "View page" button. */
  path: string;
};

/** A page of collapsible form-engine editors (Academy, Services, About, Careers, FAQ). */
export async function EditorsPage({ eyebrow, title, copy, editors, path }: EditorsPageProps) {
  await requireAdmin();
  const { loaded, media } = await loadEditors(editors);
  const websiteUrl = env.websiteUrl();

  return (
    <>
      <PageTitle
        eyebrow={eyebrow}
        title={title}
        copy={copy}
        action={
          <Button asChild variant="quiet">
            <a href={`${websiteUrl}${path}`} target="_blank" rel="noreferrer">
              View page <ArrowUpRight />
            </a>
          </Button>
        }
      />
      <MediaIndexProvider initial={media}>
        <div className="min-w-0 space-y-3">
          {editors.map((editor, i) => (
            <EditorPanel
              key={editor.id}
              editor={editor}
              initialValues={loaded[i].values}
              websiteUrl={websiteUrl}
              defaultOpen={editors.length === 1}
            />
          ))}
        </div>
      </MediaIndexProvider>
    </>
  );
}
