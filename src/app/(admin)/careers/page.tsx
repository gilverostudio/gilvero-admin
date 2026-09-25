import type { Metadata } from "next";

import { EditorsPage } from "@/components/content/editors-page";
import { careersEditors } from "@/lib/content/editors-pages";

export const metadata: Metadata = { title: "Careers" };

export default function CareersAdminPage() {
  return (
    <EditorsPage
      eyebrow="Careers"
      title="Open roles."
      copy="Open a role to show it on the careers page; close it to hide it without deleting."
      editors={careersEditors}
      path="/careers"
    />
  );
}
