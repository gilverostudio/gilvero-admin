import type { Metadata } from "next";

import { EditorsPage } from "@/components/content/editors-page";
import { storeEditors } from "@/lib/content/editors-site";

export const metadata: Metadata = { title: "Print Store" };

export default function StoreAdminPage() {
  return (
    <EditorsPage
      eyebrow="Print Store"
      title="Products and print options."
      copy="The product cards, the sizes, papers and frames in the configurator, and the order section's text."
      editors={storeEditors}
      path="/store"
    />
  );
}
