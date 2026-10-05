"use client";

import { useQuery } from "@tanstack/react-query";

import { GameSelect } from "@/components/game/game-select";
import { SectionHeading } from "@/components/layout/section-heading";
import { gameQueries } from "@/features/games/api/queries";
import { useInView } from "@/hooks/use-in-view";

/** Other entries in the same series. Optional content: silent unless it has something to show. */
export function SeriesGames({ slug }: { slug: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const { data } = useQuery({ ...gameQueries.series(slug), enabled: inView });

  if (!data || data.length === 0) return <div ref={ref} />;

  return (
    <section ref={ref} aria-labelledby="series-heading">
      <SectionHeading id="series-heading" title="More in this series" />
      <GameSelect games={data.slice(0, 6)} />
    </section>
  );
}
