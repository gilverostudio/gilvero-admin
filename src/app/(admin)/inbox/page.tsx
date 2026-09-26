import type { Metadata } from "next";

import { PageTitle } from "@/components/shell/page-title";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { InboxBoard, type Submission } from "./inbox-board";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("id, kind, name, email, phone, data, status, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  return (
    <>
      <PageTitle
        eyebrow="Inbox"
        title="Every enquiry from the website."
        copy="Bookings, enquiries, academy applications and newsletter sign-ups land here. Mark each one as you handle it."
      />
      <InboxBoard submissions={(data ?? []) as Submission[]} />
    </>
  );
}
