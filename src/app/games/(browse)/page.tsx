import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { BrowsePage } from "@/features/games/components/browse-page";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Browse games",
  description:
    "Search the GameDex archive by title and filter by genre, platform, release year and Metascore.",
  path: "/games",
});

export default async function GamesPage({ searchParams }: PageProps<"/games">) {
  return (
    <>
      <PageHeader eyebrow="Archive" title="Game archive">
        Search by title, then narrow by genre, platform, year or score. The address
        bar keeps your filters, so any view can be shared.
      </PageHeader>
      <BrowsePage searchParams={await searchParams} />
    </>
  );
}
