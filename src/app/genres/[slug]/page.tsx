import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { BrowsePage } from "@/features/games/components/browse-page";
import { isSlug } from "@/lib/games/filters";
import { pageMetadata } from "@/lib/site";
import { getGenres } from "@/server/games";

/** Null when the genre list itself can't be loaded — the page still renders. */
const loadGenres = cache(() => getGenres().catch(() => null));

async function resolve(slug: string) {
  if (!isSlug(slug)) notFound();
  const genres = await loadGenres();
  const genre = genres?.find((candidate) => candidate.slug === slug);
  // Only a successful lookup can prove a genre doesn't exist.
  if (genres && !genre) notFound();
  return genre?.name ?? slug.replaceAll("-", " ");
}

export async function generateMetadata({
  params,
}: PageProps<"/genres/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const name = await resolve(slug);
  return pageMetadata({
    title: `${name} games`,
    description: `Browse ${name} games on GameDex — filter by platform, release year and score.`,
    path: `/genres/${slug}`,
  });
}

export default async function GenrePage({
  params,
  searchParams,
}: PageProps<"/genres/[slug]">) {
  const { slug } = await params;
  const name = await resolve(slug);

  return (
    <>
      <PageHeader eyebrow="Genre" title={name} />
      <BrowsePage searchParams={await searchParams} locked={{ genre: slug }} />
    </>
  );
}
