"use client";

import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SearchProvider } from "@/features/search/search-provider";
import { QueryProvider } from "@/lib/query/provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider delayDuration={200}>
        <SearchProvider>{children}</SearchProvider>
      </TooltipProvider>
    </QueryProvider>
  );
}
