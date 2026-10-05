import Link from "next/link";
import type { ReactNode } from "react";

/** Section heading styled as a window title: lamp, title, a dotted run-out, optional link. */
export function SectionHeading({
  id,
  title,
  note,
  href,
  hrefLabel,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  href?: string;
  hrefLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end gap-3">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={id} className="title flex items-baseline gap-2.5 text-3xl sm:text-4xl">
          <span aria-hidden className="h-4 w-1.5 shrink-0 self-center bg-accent" />
          {title}
        </h2>
        {note ? <p className="label text-muted-foreground">{note}</p> : null}
      </div>
      <span
        aria-hidden
        className="mb-2 hidden h-px min-w-6 flex-1 bg-border-strong sm:block"
      />
      {children}
      {href ? (
        <Link
          href={href}
          className="pixel mb-0.5 ml-auto shrink-0 px-2 py-1.5 text-link hover:bg-accent hover:text-accent-foreground sm:ml-0"
        >
          {hrefLabel ?? "See all"} <span aria-hidden>▶</span>
        </Link>
      ) : null}
    </div>
  );
}
