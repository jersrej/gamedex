"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";

import { SectionHeading } from "@/components/layout/section-heading";
import { describeError } from "@/components/state/error-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { gameQueries } from "@/features/games/api/queries";
import { useInView } from "@/hooks/use-in-view";

// The viewer is only fetched when someone actually opens a screenshot.
const Lightbox = dynamic(
  () => import("@/features/games/components/lightbox").then((mod) => mod.Lightbox),
  { ssr: false },
);

const PREVIEW_COUNT = 6;
const GRID = "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3";

/**
 * Screenshot thumbnails for a game. The request waits until the section is
 * near the viewport, thumbnails are small lazy images, and the full-size shot
 * is only requested inside the lightbox.
 */
export function ScreenshotGallery({ slug, title }: { slug: string; title: string }) {
  const { ref, inView } = useInView<HTMLElement>();
  const { data, error, isPending, isError, refetch } = useQuery({
    ...gameQueries.screenshots(slug),
    enabled: inView,
  });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // A game with no screenshots simply has no gallery.
  if (data && data.length === 0) return null;

  const preview = data?.slice(0, PREVIEW_COUNT) ?? [];
  const hiddenCount = (data?.length ?? 0) - preview.length;

  return (
    <section ref={ref} aria-labelledby="screenshots-heading">
      <SectionHeading
        id="screenshots-heading"
        title="Screenshots"
        note={data ? `${data.length} shots` : undefined}
      />

      {isPending ? (
        <div role="status" className={GRID}>
          <span className="sr-only">Loading screenshots…</span>
          {Array.from({ length: PREVIEW_COUNT }, (_, index) => (
            <Skeleton key={index} aria-hidden className="aspect-video border border-border-strong" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <p role="alert" className="label flex flex-wrap items-center gap-3 text-muted-foreground">
          <span className="text-danger">[{describeError(error).status}]</span>
          Couldn’t load screenshots.
          <button
            type="button"
            onClick={() => refetch()}
            className="px-1 text-link underline underline-offset-4 hover:bg-accent hover:text-accent-foreground"
          >
            Retry
          </button>
        </p>
      ) : null}

      {preview.length > 0 ? (
        <ul className={GRID}>
          {preview.map((shot, index) => {
            const isLast = index === preview.length - 1 && hiddenCount > 0;
            return (
              <li key={shot.id}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  data-sfx="open"
                  aria-label={
                    isLast
                      ? `View all ${data?.length} screenshots, starting at ${index + 1}`
                      : `View screenshot ${index + 1}`
                  }
                  className="group relative block aspect-video w-full overflow-hidden border border-border-strong bg-background -outline-offset-2 hover:border-accent"
                >
                  <Image
                    src={shot.image}
                    alt=""
                    fill
                    sizes="(min-width: 64rem) 20vw, (min-width: 40rem) 31vw, 46vw"
                    className="object-cover"
                  />
                  <span
                    aria-hidden
                    className="label absolute bottom-0 left-0 z-10 bg-background px-1.5 py-0.5 text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground"
                  >
                    IMG {String(index + 1).padStart(2, "0")}
                  </span>
                  {isLast ? (
                    <span className="title absolute inset-0 z-10 grid place-items-center bg-background/80 text-4xl">
                      +{hiddenCount}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {data && openIndex !== null ? (
        <Lightbox
          title={title}
          screenshots={data}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </section>
  );
}
