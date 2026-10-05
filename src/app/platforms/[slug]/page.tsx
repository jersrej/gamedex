import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { BrowsePage } from "@/features/games/components/browse-page";
import { isSlug } from "@/lib/games/filters";
import { getPlatforms } from "@/server/games";

/** Null when the platform list itself can't be loaded — the page still renders. */
const loadPlatforms = cache(() => getPlatforms().catch(() => null));

async function resolve(slug: string) {
  if (!isSlug(slug)) notFound();
  const platforms = await loadPlatforms();
  const platform = platforms?.find((candidate) => candidate.slug === slug);
  // Only a successful lookup can prove a platform doesn't exist.
  if (platforms && !platform) notFound();
  return platform?.name ?? slug.replaceAll("-", " ");
}

export async function generateMetadata({
  params,
}: PageProps<"/platforms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const name = await resolve(slug);
  return {
    title: `${name} games`,
    description: `Browse games for ${name} on GameDex — filter by genre, release year and score.`,
    alternates: { canonical: `/platforms/${slug}` },
  };
}

export default async function PlatformPage({
  params,
  searchParams,
}: PageProps<"/platforms/[slug]">) {
  const { slug } = await params;
  const name = await resolve(slug);

  return (
    <>
      <PageHeader eyebrow="Platform" title={name} />
      <BrowsePage searchParams={await searchParams} locked={{ platform: slug }} />
    </>
  );
}
