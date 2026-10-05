import { LoadingBar } from "@/components/state/loading-bar";

/**
 * Scoped to the browse list on purpose. A loading boundary makes Next start
 * streaming with a 200 before the page runs, so routes that can call
 * `notFound()` (game, genre, platform) have none and return a real 404.
 */
export default function Loading() {
  return (
    <div className="container-page py-24">
      <LoadingBar label="Loading game database…" className="max-w-sm" />
    </div>
  );
}
