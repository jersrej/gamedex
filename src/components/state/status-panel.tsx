import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared frame for empty and error states: a plain black firmware screen with
 * a one-line header, then what happened, what to do, and the action. The
 * marker colour is backed by the "System error / message" text, never alone.
 */
export function StatusPanel({
  status,
  tone = "neutral",
  title,
  children,
  action,
  className,
}: {
  status: string;
  tone?: "neutral" | "danger";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const danger = tone === "danger";

  return (
    <div className={cn("max-w-3xl border border-border-strong bg-black", className)}>
      <p className="pixel flex h-9 items-center gap-2 border-b border-border-strong px-4">
        <span
          aria-hidden
          className={cn("h-3 w-1.5", danger ? "bg-danger" : "bg-warning")}
        />
        <span>{danger ? "System error" : "System message"}</span>
        <span className="ml-auto truncate text-muted-foreground">{status}</span>
      </p>
      <div className="flex flex-col items-start gap-3 px-4 py-9 sm:px-10 sm:py-12">
        <h2 className="title text-3xl sm:text-4xl">{title}</h2>
        {children ? (
          <p className="max-w-prose text-sm text-muted-foreground sm:text-base">{children}</p>
        ) : null}
        {action ? <div className="mt-3 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
