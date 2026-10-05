import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { LoadingBar } from "@/components/state/loading-bar";
import { CompareView } from "@/features/compare/compare-view";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Versus — compare games",
  description: "Put two games side by side: release, ratings, genres, platforms and studios.",
  path: "/compare",
});

export default function ComparePage() {
  return (
    <>
      <PageHeader eyebrow="Versus" title="Versus">
        Two games, side by side. The link updates as you pick, so a comparison can
        be shared.
      </PageHeader>
      <div className="container-page">
        <Suspense fallback={<LoadingBar label="Loading comparison…" className="max-w-sm" />}>
          <CompareView />
        </Suspense>
      </div>
    </>
  );
}
