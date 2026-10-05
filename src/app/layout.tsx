import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Saira_Condensed, Share_Tech_Mono } from "next/font/google";

import { BottomDeck } from "@/components/console/bottom-deck";
import { TopDeck } from "@/components/console/top-deck";
import { BOOT_INLINE_SCRIPT } from "@/features/system/boot";
import { BootSequence } from "@/features/system/boot-sequence";
import { SoundEffects } from "@/features/system/sound-effects";
import { VolumeOsd } from "@/features/system/volume-osd";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

import { Providers } from "./providers";
import "./globals.css";

// Three faces, in the clean technical manner of late-90s system software:
//   body    — the system face: menus, labels, keys and reading copy. A squared
//             technical sans, used light and widely tracked.
//   display — game titles only (strong, condensed)
//   mono    — catalogue metadata and read-outs
// The GAMEDEX wordmark is outlined artwork (see features/system/wordmark.tsx),
// not a font.
const display = Saira_Condensed({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const mono = Share_Tech_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: "400",
});

const body = Chakra_Petch({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: `${SITE_NAME} — Find your next game`, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Find your next game`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#bfbdb6",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${mono.variable} ${body.variable} antialiased`}
      // The inline script below sets data-boot before React hydrates.
      suppressHydrationWarning
    >
      {/*
        The page is the console. Top deck and bottom deck are the plastic
        casing with its controls; everything the application renders lives in
        the display between them.
      */}
      <body className="flex min-h-dvh flex-col">
        {/* Decides, before first paint, whether the boot screen shows. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_INLINE_SCRIPT }} />
        <a
          href="#main"
          className="pixel sr-only z-[110] bg-accent px-4 py-3 text-accent-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <Providers>
          <TopDeck />
          <div className="screen flex-1">
            <main id="main" className="flex-1 pb-16">
              {children}
            </main>
          </div>
          <BottomDeck />
          <SoundEffects />
          <VolumeOsd />
        </Providers>
        {/* Both of these are sized to the display opening, not the page. */}
        <BootSequence />
        <div aria-hidden className="crt">
          {/* The bowed outline of a domed tube face (see globals.css). */}
          <span className="crt-bow crt-bow-x" />
          <span className="crt-bow crt-bow-y" />
          <span className="crt-bow crt-bow-corner" />
        </div>
      </body>
    </html>
  );
}
