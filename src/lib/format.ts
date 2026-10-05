const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  timeZone: "UTC",
});

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** "February 25, 2022" */
export function formatLongDate(iso: string): string {
  return LONG_DATE.format(parse(iso));
}

/** "Feb 25" */
export function formatShortDate(iso: string): string {
  return SHORT_DATE.format(parse(iso));
}

export function releaseYear(iso: string | null): string | null {
  return iso ? iso.slice(0, 4) : null;
}

/** What to print where a release date goes, for any game. */
export function releaseLabel(game: { releaseDate: string | null; tba: boolean }): string {
  if (game.releaseDate) return formatLongDate(game.releaseDate);
  return game.tba ? "To be announced" : "Unknown";
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatCount(value: number): string {
  return COMPACT.format(value);
}

/** Archive reference for a game, e.g. GDX-003498. */
export function catalogId(id: number): string {
  return `GDX-${String(id).padStart(6, "0")}`;
}

/** Short archive number printed on catalogue cards, e.g. No.003498. */
export function archiveNo(id: number): string {
  return `No.${String(id).padStart(6, "0")}`;
}

const PLATFORM_CODES: Record<string, string> = {
  pc: "PC",
  playstation: "PS",
  xbox: "XBOX",
  nintendo: "NIN",
  mac: "MAC",
  linux: "LNX",
  ios: "IOS",
  android: "AND",
  web: "WEB",
  sega: "SEGA",
  atari: "ATARI",
};

/** Short code for a platform family, as printed on cards. */
export function platformCode(platform: { slug: string; name: string }): string {
  return PLATFORM_CODES[platform.slug] ?? platform.name.slice(0, 4).toUpperCase();
}

export function gameHref(slug: string): string {
  return `/games/${slug}`;
}
