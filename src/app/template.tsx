import type { ReactNode } from "react";

/** Remounts on navigation, so each screen "resolves" in a few stepped frames. Disabled under reduced motion. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-rise">{children}</div>;
}
