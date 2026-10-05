import type { ReactNode } from "react";

/** Screen title: a path-style read-out of where you are, then the big name. */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="container-page pt-8 pb-6 sm:pt-10">
      <p className="label text-muted-foreground">
        <span aria-hidden>GAMEDEX:/</span>
        {eyebrow}
      </p>
      <h1 className="title aberration mt-2 text-5xl sm:text-6xl lg:text-7xl">{title}</h1>
      {children ? (
        <p className="mt-3 max-w-prose text-sm text-muted-foreground sm:text-base">
          {children}
        </p>
      ) : null}
    </header>
  );
}
