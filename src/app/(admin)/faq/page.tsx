import type { Metadata } from "next";

import { EditorsPage } from "@/components/content/editors-page";
import { faqEditors } from "@/lib/content/editors-pages";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqAdminPage() {
  return (
    <EditorsPage
      eyebrow="FAQ"
      title="Answers before they ask."
      copy="Questions are grouped by their topic on the FAQ page. Drag to reorder; tick “Also on homepage” for the homepage preview."
      editors={faqEditors}
      path="/faq"
    />
  );
}
