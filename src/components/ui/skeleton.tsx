import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("dither animate-pulse bg-surface", className)}
      {...props}
    />
  )
}

export { Skeleton }
