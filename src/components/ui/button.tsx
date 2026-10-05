import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// On-screen buttons are software, not hardware: flat rectangles. The primary
// one is a light-grey block; every variant turns solid blue when selected.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 border border-transparent font-sans text-[0.8125rem] leading-none font-medium tracking-[0.16em] whitespace-nowrap uppercase select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:opacity-80 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-accent hover:text-accent-foreground hover:bloom focus-visible:bg-accent focus-visible:text-accent-foreground",
        outline:
          "border-border-strong text-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground aria-expanded:border-accent",
        secondary:
          "border-border-strong bg-surface-elevated text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost:
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-surface-elevated",
        destructive: "border-danger/60 text-danger hover:bg-danger hover:text-background",
        link: "text-link underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3",
        lg: "h-12 px-5",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
