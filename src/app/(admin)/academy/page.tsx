import type { Metadata } from "next";

import { EditorsPage } from "@/components/content/editors-page";
import { academyEditors } from "@/lib/content/editors-pages";

export const metadata: Metadata = { title: "Academy" };

export default function AcademyAdminPage() {
  return (
    <EditorsPage
      eyebrow="Academy"
      title="Courses and the academy pages."
      copy="Courses, highlights, student outcomes and the text shared by every course page."
      editors={academyEditors}
      path="/academy"
    />
  );
}
