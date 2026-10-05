import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { gameQueries } from "@/features/games/api/queries";
import { GameProfile } from "@/features/games/components/game-profile";
import { isSlug } from "@/lib/games/filters";
import { getQueryClient } from "@/lib/query/client";
import { isAppError } from "@/server/errors";
import { getGame } from "@/server/games";
import type { GameDetail } from "@/types/game";

/**
 * One lookup shared by `generateMetadata` and the page. Returns null when the
 * game can't be loaded for a reason other than "it doesn't exist" (rate limit,
 * outage, missing key) — the page then renders and lets the client show the
 * proper error state with a retry.
 */
const loadGame = cache(async (slug: string): Promise<GameDetail | null> => {
  if (!isSlug(slug)) notFound();
  try {
    return await getGame(slug);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return null;
  }
});

function summarise(game: GameDetail): string {
  const first = game.description[0];
  if (first) return first.length > 160 ? `${first.slice(0, 157).trimEnd()}…` : first;
  return `Explore ${game.title} on GameDex: release date, platforms, ratings and screenshots.`;
}

export async function generateMetadata({
  params,
}: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = await loadGame(slug);
  // No data, no claims: fall back to the site defaults.
  if (!game) return { title: "Game" };

  const description = summarise(game);
  return {
    title: game.title,
    description,
    alternates: { canonical: `/games/${game.slug}` },
    openGraph: {
      type: "website",
      title: `${game.title} — GameDex`,
      description,
      url: `/games/${game.slug}`,
      images: game.coverImage ? [{ url: game.coverImage, alt: game.title }] : undefined,
    },
    twitter: {
      card: game.coverImage ? "summary_large_image" : "summary",
      title: `${game.title} — GameDex`,
      description,
      images: game.coverImage ? [game.coverImage] : undefined,
    },
  };
}

/** schema.org VideoGame, built only from fields the provider actually returned. */
function structuredData(game: GameDetail) {
  const organisations = (items: { name: string }[]) =>
    items.map((item) => ({ "@type": "Organization", name: item.name }));

  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    ...(game.description[0] ? { description: game.description[0] } : {}),
    ...(game.coverImage ? { image: game.coverImage } : {}),
    ...(game.releaseDate ? { datePublished: game.releaseDate } : {}),
    ...(game.genres.length ? { genre: game.genres.map((genre) => genre.name) } : {}),
    ...(game.platforms.length
      ? { gamePlatform: game.platforms.map((platform) => platform.name) }
      : {}),
    ...(game.developers.length ? { author: organisations(game.developers) } : {}),
    ...(game.publishers.length ? { publisher: organisations(game.publishers) } : {}),
    ...(game.rating !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: game.rating,
            bestRating: 5,
            worstRating: 1,
            ratingCount: game.ratingsCount,
          },
        }
      : {}),
  };
}

export default async function GamePage({ params }: PageProps<"/games/[slug]">) {
  const { slug } = await params;
  const game = await loadGame(slug);

  const queryClient = getQueryClient();
  if (game) queryClient.setQueryData(gameQueries.detail(slug).queryKey, game);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {game ? (
        <script
          type="application/ld+json"
          // `<` is escaped so text from the provider can never close the tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData(game)).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      <GameProfile slug={slug} />
    </HydrationBoundary>
  );
}
