import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { EditorPanel } from "@/components/content/editor-panel";
import { MediaIndexProvider } from "@/components/content/media-context";
import { PageTitle } from "@/components/shell/page-title";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { settingsEditors } from "@/lib/content/editors";
import { loadEditors } from "@/lib/content/load";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const [{ loaded, media }, { data: admins }] = await Promise.all([
    loadEditors(settingsEditors),
    supabase.from("admin_users").select("id, email, full_name, role, created_at").order("created_at"),
  ]);

  return (
    <>
      <PageTitle
        eyebrow="Settings"
        title="Studio details, menus & site text."
        copy="Contact details here are used everywhere on the site — the footer, contact page, booking page and floating buttons."
      />

      <MediaIndexProvider initial={media}>
        <div className="space-y-3">
          {settingsEditors.map((editor, i) => (
            <EditorPanel
              key={editor.id}
              editor={editor}
              initialValues={loaded[i].values}
              websiteUrl={env.websiteUrl()}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      </MediaIndexProvider>

      <section className="panel mt-8 p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-primary" />
          <div>
            <h2 className="text-lg">Admin team</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              People who can sign in here. New admins are added with <code className="text-foreground/80">npm run admin:create</code>.
            </p>
          </div>
        </div>
        <ul className="mt-5 divide-y divide-border/60">
          {(admins ?? []).map((admin) => (
            <li key={admin.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm">
                  {admin.full_name || admin.email}
                  {admin.id === me.id ? <span className="text-muted-foreground"> (you)</span> : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
              </div>
              <Badge tone={admin.role === "owner" ? "gold" : "neutral"}>{admin.role}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
