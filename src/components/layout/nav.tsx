"use client";

import { Compass, Database, Save, Swords } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { SurpriseButton } from "@/features/surprise/surprise-button";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Discover", icon: Compass, match: ["/"] },
  {
    href: "/games",
    label: "Archive",
    icon: Database,
    match: ["/games", "/genres", "/platforms"],
  },
  { href: "/library", label: "Memory", icon: Save, match: ["/library"] },
  { href: "/compare", label: "Versus", icon: Swords, match: ["/compare"] },
] as const;

type Item = (typeof ITEMS)[number];

function isActive(pathname: string, match: readonly string[]): boolean {
  return match.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix),
  );
}

/**
 * One section key on the casing. The current section's key is latched down
 * with its lamp lit, so position and light both say where you are.
 */
function SectionKey({ item, active, compact }: { item: Item; active: boolean; compact: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "deck-key printed",
        compact
          ? "h-12 flex-col gap-1 text-[0.5625rem] tracking-[0.1em]"
          : "h-9 px-2 max-lg:tracking-[0.06em] lg:px-3 xl:px-4",
      )}
    >
      <span className="flex items-center gap-1.5">
        {/* Tablets have no room for the lamp; the latched key still shows the section. */}
        <span aria-hidden className={cn("led", !compact && "max-lg:hidden")} data-on={active} />
        {compact ? <Icon aria-hidden className="size-4" /> : null}
      </span>
      {item.label}
    </Link>
  );
}

/** Section keys on the top of the casing (tablet and desktop). */
export function DeckNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className={className}>
      <ul className="flex items-center gap-1 lg:gap-2">
        {ITEMS.map((item) => (
          <li key={item.href}>
            <SectionKey item={item} active={isActive(pathname, item.match)} compact={false} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Handheld controls: the four section keys under the screen, with the OPEN
 * (random disc) key in the middle where a thumb finds it.
 */
export function HandheldNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const [left, right] = [ITEMS.slice(0, 2), ITEMS.slice(2)];

  return (
    <nav aria-label="Main" className={className}>
      <ul className="grid grid-cols-[1fr_1fr_auto_1fr_1fr] items-center gap-1.5">
        {left.map((item) => (
          <li key={item.href}>
            <SectionKey item={item} active={isActive(pathname, item.match)} compact />
          </li>
        ))}
        <li>
          <SurpriseButton variant="deck" />
        </li>
        {right.map((item) => (
          <li key={item.href}>
            <SectionKey item={item} active={isActive(pathname, item.match)} compact />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The directional pad on the front panel. Left and right step through the
 * sections; up and down scroll the screen. It is a pointer convenience that
 * repeats what the section keys and ordinary scrolling already do, so it is
 * kept out of the tab order and hidden from assistive technology.
 */
export function DPad({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const step = (delta: number) => {
    const current = ITEMS.findIndex((item) => isActive(pathname, item.match));
    const next = ITEMS[(Math.max(current, 0) + delta + ITEMS.length) % ITEMS.length];
    if (next) router.push(next.href);
  };
  const scroll = (direction: number) =>
    window.scrollBy({ top: direction * window.innerHeight * 0.7, behavior: "smooth" });

  const arm = (onClick: () => void, glyph: string, title: string, area: string) => (
    <button
      type="button"
      tabIndex={-1}
      title={title}
      onClick={onClick}
      style={{ gridArea: area }}
    >
      {glyph}
    </button>
  );

  return (
    <div aria-hidden className={cn("dpad", className)}>
      {arm(() => scroll(-1), "▲", "Scroll up", "1 / 2")}
      {arm(() => step(-1), "◀", "Previous section", "2 / 1")}
      <span style={{ gridArea: "2 / 2" }} />
      {arm(() => step(1), "▶", "Next section", "2 / 3")}
      {arm(() => scroll(1), "▼", "Scroll down", "3 / 2")}
    </div>
  );
}
