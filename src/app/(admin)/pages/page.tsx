import type { Metadata } from "next";

import { EditorsPage } from "@/components/content/editors-page";
import { pagesEditors } from "@/lib/content/editors-site";

export const metadata: Metadata = { title: "Pages & SEO" };

export default function PagesAdminPage() {
  return (
    <EditorsPage
      eyebrow="Pages & SEO"
      title="Every page's header, banner and search text."
      copy="Google title and description, the header at the top, and the closing banner — plus the forms and legal text that live on single pages."
      editors={pagesEditors}
      path="/"
    />
  );
}
