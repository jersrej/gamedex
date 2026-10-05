import { ImageResponse } from "next/og";

import { WORDMARK_DESCRIPTOR, WORDMARK_NAME } from "@/features/system/wordmark";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

/*
 * The preview image shown when a GameDex link is shared, and the one search
 * engines may show beside a result. It is the boot screen: black, the four
 * signature bars, the wordmark. Generated once at build time, and used for
 * every page on the site.
 */

export const alt = `${SITE_NAME} — Game Database System. ${SITE_TAGLINE}.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BARS = [
  { color: "#f0503f", height: 40 },
  { color: "#f2c22e", height: 60 },
  { color: "#4fc267", height: 80 },
  { color: "#2c4fd8", height: 100 },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#050506",
          backgroundImage: "radial-gradient(circle at 50% 45%, #1a1c26 0%, #050506 62%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 100 }}>
          {BARS.map((bar) => (
            <div key={bar.color} style={{ width: 30, height: bar.height, backgroundColor: bar.color }} />
          ))}
        </div>

        <svg viewBox={WORDMARK_NAME.viewBox} width={700} height={116} style={{ marginTop: 44 }}>
          <path d={WORDMARK_NAME.d} fill="#ffffff" />
        </svg>

        <svg viewBox={WORDMARK_DESCRIPTOR.viewBox} width={520} height={28} style={{ marginTop: 26 }}>
          <path d={WORDMARK_DESCRIPTOR.d} fill="#b3b5bf" />
        </svg>

        <div
          style={{
            marginTop: 58,
            padding: "12px 30px",
            fontSize: 30,
            letterSpacing: 8,
            color: "#ffffff",
            backgroundColor: "#2c4fd8",
            textTransform: "uppercase",
          }}
        >
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    size,
  );
}
