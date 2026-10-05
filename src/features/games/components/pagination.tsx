import Link from "next/link";

import { cn } from "@/lib/utils";

const KEY =
  "pixel flex h-10 items-center gap-2 border border-border-strong px-3 hover:border-accent hover:bg-accent hover:text-accent-foreground";
const DISABLED = "pointer-events-none opacity-45";

/** Previous / next as real links, so every page has a URL of its own. */
export function Pagination({
  page,
  totalPages,
  hasNextPage,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hrefForPage: (page: number) => string;
}) {
  const hasPrevious = page > 1;

  return (
    <nav aria-label="Pages" className="mt-8 flex items-center justify-between gap-3">
      <Link
        href={hrefForPage(page - 1)}
        aria-disabled={!hasPrevious}
        tabIndex={hasPrevious ? undefined : -1}
        className={cn(KEY, !hasPrevious && DISABLED)}
      >
        <span aria-hidden>◀</span>
        Previous
      </Link>

      <p className="label text-center text-muted-foreground tabular-nums" aria-current="page">
        Page {page.toLocaleString("en-US")} of {totalPages.toLocaleString("en-US")}
      </p>

      <Link
        href={hrefForPage(page + 1)}
        aria-disabled={!hasNextPage}
        tabIndex={hasNextPage ? undefined : -1}
        className={cn(KEY, !hasNextPage && DISABLED)}
      >
        Next
        <span aria-hidden>▶</span>
      </Link>
    </nav>
  );
}
