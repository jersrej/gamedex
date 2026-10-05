import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { LibraryView } from "@/features/library/library-view";

export const metadata: Metadata = {
  title: "Memory card",
  description: "Your favorite games and what you're playing, saved in this browser.",
  // Personal, browser-local content: nothing here for a search engine.
  robots: { index: false },
};

export default function LibraryPage() {
  return (
    <>
      <PageHeader eyebrow="Memory" title="Memory card">
        Your save data: favorites and play status for the games you care about.
        Stored in this browser only — no account needed.
      </PageHeader>
      <div className="container-page">
        <LibraryView />
      </div>
    </>
  );
}
