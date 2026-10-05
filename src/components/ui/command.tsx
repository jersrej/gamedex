"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "cn"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Restyled for GameDex as a search terminal. The highlighted record is a solid
// lit block with a ▶ cursor — a console menu selection, not a hover tint.

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden bg-popover text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title,
  description,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title: string
  description: string
  className?: string
}) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn(
          "top-[calc(var(--deck-top)+6dvh)] max-w-[calc(100%-2*var(--screen-x)-1.5rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl",
          className
        )}
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-14 items-center gap-3 border-b border-border-strong bg-background px-4"
    >
      <span aria-hidden className="font-mono text-lg text-link">
        &gt;
      </span>
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "h-full w-full bg-transparent font-mono text-lg tracking-wide uppercase caret-accent outline-hidden placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[min(60vh,26rem)] scroll-py-2 overflow-x-hidden overflow-y-auto outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "py-2 **:[[cmdk-group-heading]]:px-4 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:font-display **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-bold **:[[cmdk-group-heading]]:tracking-[0.12em] **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:uppercase",
        className
      )}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 before:w-3 before:shrink-0 before:font-mono before:text-xs before:content-[''] data-selected:bg-accent data-selected:text-accent-foreground data-selected:before:content-['▶'] data-selected:**:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

export { Command, CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem }
