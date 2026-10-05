import { cn } from "@/lib/utils";

/**
 * Indeterminate progress: a disc spinning in the drive and a block gauge with
 * a lit cell stepping across it. Shown only while something is really loading.
 */
export function LoadingBar({ label, className }: { label: string; className?: string }) {
  return (
    <div role="status" className={cn("flex items-center gap-3", className)}>
      <div aria-hidden className="disc w-9 animate-disc" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="label text-link">
          {label}
          <span aria-hidden className="ml-1 animate-blink">
            _
          </span>
        </p>
        <div aria-hidden className="well relative h-4 w-full overflow-hidden p-[3px]">
          <div className="relative h-full overflow-hidden">
            <div className="h-full w-2/5 animate-scan bg-accent" />
            {/* Cell dividers, so the gauge reads as segments rather than a bar. */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(to_right,transparent_0_8px,var(--background)_8px_10px)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
