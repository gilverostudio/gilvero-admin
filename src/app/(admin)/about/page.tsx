import type { Metadata } from "next";

import { EditorsPage } from "@/components/content/editors-page";
import { aboutEditors } from "@/lib/content/editors-pages";

export const metadata: Metadata = { title: "About" };

export default function AboutAdminPage() {
  return (
    <EditorsPage
      eyebrow="About"
      title="The studio's story and people."
      copy="Story, values, founder, team, studio tour, timeline and equipment."
      editors={aboutEditors}
      path="/about"
    />
  );
}
