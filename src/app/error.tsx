"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { StatusPanel } from "@/components/state/status-panel";
import { Button } from "@/components/ui/button";

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="container-page py-16">
      <StatusPanel
        status="Error"
        tone="danger"
        title="This page failed to load"
        action={
          <Button onClick={retry}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
        }
      >
        Something broke while building this screen. Trying again usually fixes it.
        {error.digest ? ` Reference: ${error.digest}.` : ""}
      </StatusPanel>
    </div>
  );
}
