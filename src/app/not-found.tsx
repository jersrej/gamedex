import type { Metadata } from "next";
import Link from "next/link";

import { StatusPanel } from "@/components/state/status-panel";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <StatusPanel
        status="404"
        title="Not in the archive"
        action={
          <>
            <Button asChild>
              <Link href="/games">Browse games</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to Discover</Link>
            </Button>
          </>
        }
      >
        There’s no page or game at this address. It may have been renamed, or the
        link may be mistyped.
      </StatusPanel>
    </div>
  );
}
