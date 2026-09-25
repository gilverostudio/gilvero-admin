import type { Metadata } from "next";

import { EditorsPage } from "@/components/content/editors-page";
import { servicesEditors } from "@/lib/content/editors-pages";

export const metadata: Metadata = { title: "Services" };

export default function ServicesAdminPage() {
  return (
    <EditorsPage
      eyebrow="Services"
      title="What the studio offers."
      copy="The service catalogue tabs, the engagement tiers and the process steps."
      editors={servicesEditors}
      path="/services"
    />
  );
}
