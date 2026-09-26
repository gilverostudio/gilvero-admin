import type { Metadata } from "next";

import { EditorPanel } from "@/components/content/editor-panel";
import { MediaIndexProvider } from "@/components/content/media-context";
import { PageTitle } from "@/components/shell/page-title";
import { requireAdmin } from "@/lib/auth";
import { settingsEditors } from "@/lib/content/editors";
import { loadEditors } from "@/lib/content/load";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import { TeamManager, type TeamMember } from "./team-manager";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const serviceConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabase = await createClient();
  const [{ loaded, media }, { data: admins }] = await Promise.all([
    loadEditors(settingsEditors),
    supabase.from("admin_users").select("id, email, full_name, role").order("created_at"),
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

      <TeamManager
        members={(admins ?? []) as TeamMember[]}
        meId={me.id}
        canManage={me.role === "owner" && serviceConfigured}
        notice={
          me.role !== "owner"
            ? "Only owners can add people or change roles."
            : serviceConfigured
              ? null
              : "To add or remove admins here, set SUPABASE_SERVICE_ROLE_KEY in this site's environment (server-side only). Until then, use npm run admin:create."
        }
      />
    </>
  );
}
