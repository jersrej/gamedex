# GameDex

A game library for finding what to play next. Browse and search a catalogue of
500,000+ games, open a game's profile for artwork, screenshots and details, keep
a personal library with play status, compare two games side by side, or hit
**Surprise me** and let the archive pick.

Built as a portfolio project: Next.js App Router with a Backend-for-Frontend
layer, TanStack Query for server state, strict TypeScript, and a custom
retro-console design system on top of shadcn/ui primitives.

## Stack

| Concern         | Choice                                                    |
| --------------- | --------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack), React 19              |
| Language        | TypeScript (strict, `noUncheckedIndexedAccess`)           |
| Server state    | TanStack Query v5 + Query Devtools (development only)     |
| Styling         | Tailwind CSS v4, design tokens in `src/app/globals.css`   |
| UI primitives   | shadcn/ui (Radix): dialog, sheet, command, select, tabs…  |
| Tests           | Vitest, Testing Library, jsdom                            |
| Runtime         | Node 24 (`.nvmrc`, `engines`), npm                        |
| Data provider   | [RAWG Video Games Database API](https://rawg.io/apidocs)  |

No state-management, animation, carousel or validation libraries: local state,
CSS and a few small hand-written modules cover what the app needs.

## Architecture

```text
┌──────────────┐
│   Browser    │   React UI · TanStack Query cache · localStorage library
└──────┬───────┘
       │  GET /api/*          (our own JSON contract)
       ▼
┌────────────────────┐
│ Next.js App Router │   Server Components · Route Handlers (BFF)
│       + BFF        │   validation · normalisation · error mapping · cache
└────────┬───────────┘
         │  GET api.rawg.io   (key added here, server-side only)
         ▼
┌────────────────────┐
│  External Game API │
└────────────────────┘
```

The data path for anything rendered in the browser:

```text
UI component
   ↓
Feature query (features/*/api/queries.ts)
   ↓
TanStack Query
   ↓
Next.js BFF  (/api/*  →  src/server)
   ↓
External API
```

### The BFF

The browser never talks to the game API. It does not know the provider's base
URL, key, parameter names or response shape — only our `/api/*` endpoints and
our own domain models (`src/types/game.ts`).

| Endpoint                           | Returns                                   |
| ---------------------------------- | ----------------------------------------- |
| `GET /api/games`                   | Paginated search / filtered list          |
| `GET /api/games/popular`           | Most-added games of the last year         |
| `GET /api/games/recent`            | Released in the last 60 days              |
| `GET /api/games/upcoming`          | Releasing within a year, soonest first    |
| `GET /api/games/random`            | One well-reviewed game, picked at random  |
| `GET /api/games/:slug`             | Full game profile                         |
| `GET /api/games/:slug/screenshots` | Screenshots                               |
| `GET /api/games/:slug/series`      | Other games in the same series            |
| `GET /api/genres`                  | Genres                                    |
| `GET /api/platforms`               | Platform families (PC, PlayStation, …)    |

`GET /api/games` accepts `q`, `genre`, `platform`, `year`, `score`, `sort`,
`page` and `pageSize`. That is the whole surface: each parameter is validated
against a whitelist, anything invalid gets a `400`, anything unknown is dropped,
and the browser can never construct an upstream URL. The page URL
(`/games?genre=action&platform=pc`) uses the same parameter names, parsed by the
same function (`src/lib/games/filters.ts`).

What lives in `src/server` (all marked `server-only`):

- `rawg/client.ts` — the single place that calls the provider. Adds the key,
  enforces an 8s timeout, and turns every failure into a typed `AppError`.
- `rawg/mappers.ts` — provider payloads → domain models. Handles the provider's
  quirks (`0` meaning "no rating", `http://` image URLs, non-English tags) so
  components never have to.
- `games.ts` — the use cases. Route Handlers and Server Components call these
  same functions, so there is one path to the provider.
- `respond.ts` / `errors.ts` — the response and error contract.

### Errors

Upstream failures are never passed through. Every error response has the same
shape, with a message that is safe to show:

```json
{ "error": { "code": "RATE_LIMITED", "message": "…", "retryAfter": 30 } }
```

| Situation                  | Code                   | Status | UI                                 |
| -------------------------- | ---------------------- | ------ | ---------------------------------- |
| Invalid parameters         | `BAD_REQUEST`          | 400    | Offer to clear filters             |
| Unknown game               | `NOT_FOUND`            | 404    | Not-found page / state             |
| Provider rate limit        | `RATE_LIMITED`         | 429    | "Try again in N seconds" + retry   |
| Key not configured         | `CONFIG_MISSING`       | 503    | Setup message, no retry            |
| Key rejected (401/403)     | `CONFIG_INVALID`       | 503    | Setup message, no retry            |
| Provider 5xx / bad body    | `UPSTREAM_ERROR`       | 502    | "Game database offline" + retry    |
| Provider timeout           | `UPSTREAM_TIMEOUT`     | 504    | Retry                              |
| Provider unreachable       | `UPSTREAM_UNREACHABLE` | 502    | Retry                              |

TanStack Query retries transient failures twice and does not retry the ones
that cannot fix themselves (`400`, `404`, `429`, configuration).

### Caching, in two layers

```text
External API
     ↓
Next.js data cache      shared by all visitors · protects the API quota
     ↓
TanStack Query cache    per visitor · instant back/forward and repeat views
     ↓
UI
```

Lifetimes follow how often the data actually changes
(`src/server/cache.ts`, `src/lib/query/stale-times.ts`):

| Data                     | Server cache | Browser stale time |
| ------------------------ | ------------ | ------------------ |
| Genres, platforms        | 24 h         | 60 min             |
| Game profile, screenshots| 6 h          | 30 min             |
| Home-page shelves        | 1 h          | 10 min             |
| Filtered lists           | 15 min       | 5 min              |
| Free-text search         | 5 min        | 2 min              |

The browser lifetime is always at or below the server one — there is no point
re-asking the BFF while it would answer from its own cache. Search gets the
shortest lifetimes because its key space is unbounded. `GET /api/games/random`
is never cached, but the pool it draws from is, so most rolls cost no upstream
request. BFF responses also send `Cache-Control: s-maxage` so a CDN can absorb
repeat traffic.

RAWG's free tier allows 20,000 requests a month; this layering is what makes
that comfortable.

### Server and Client Components

- **Server**: page shells, metadata, JSON-LD, 404 decisions, and prefetching.
  The home, browse and game pages run their queries on the server and pass the
  results to the client through TanStack Query hydration, so the first paint
  already has content and the client cache starts warm.
- **Client**: anything interactive — search palette, filters, galleries,
  library, compare — all reading server state through TanStack Query.

Below-the-fold data (screenshots, series) is not prefetched: those queries are
enabled when their section scrolls near the viewport. The command palette and
the screenshot lightbox are code-split and only downloaded when first opened.

### Client state

Favourites and play status are the visitor's own data, not server state, so
they stay out of TanStack Query: a small external store over `localStorage`
(`src/features/library/store.ts`) read with `useSyncExternalStore`, kept in sync
across tabs. Discovery filters live in the URL. Everything else is local
component state.

### Project structure

```text
src/
  app/                  Routes, layouts, metadata
    api/                BFF Route Handlers
    games/              /games (browse) and /games/[slug] (profile)
    genres/ platforms/  Browse locked to one genre / platform
    library/ compare/
  server/               BFF internals (server-only)
    rawg/               Provider client, raw types, mappers
  features/             UI + queries, grouped by feature
    games/ home/ search/ library/ compare/ surprise/ catalog/
    system/             Boot sequence, sound toggle, reset control, signature
  components/
    console/            The hardware: decks, lamps, LCD, round controls
    ui/                 shadcn primitives, restyled
    game/ layout/ state/  Shared building blocks
  lib/                  API client, query client, filters, formatting,
                        audio/ (Web Audio cue synthesiser + sound setting)
  types/                Domain models and the API error contract
  hooks/  test/
```

## Interface

GameDex is presented as a fictional piece of 1999 consumer hardware — the
"GameDex Game Database System, model GDX-01" — and the app is the system
software running on it. The design is original: it borrows the era's
industrial and software language, not any console maker's logos, boot screens,
sounds or UI.

**Hardware (outside the screen)** — `src/components/console/`, and the
"Console hardware" block of `src/app/globals.css`.

- A wide, low, rectangular home console in light-grey moulded plastic on a
  darker base. The top deck carries the section keys, the GameDex badge in the
  centre, an LCD and the indicator lamps. The lower deck is the front panel,
  deliberately lopsided: rectangular RESET / OPEN / SEARCH keys, volume − / +
  keys and a directional pad on the left; the thin line of the CD-ROM tray
  door across the middle; memory-card slots over controller sockets on the
  right; the model plate in the corner.
- From tablet up the unit is framed like a television set: broad plastic side
  walls (with speaker grilles on wide screens) and a deep black border between
  the frame and the picture. Phones keep a thin frame, because the screen is
  too small to give away. The front panel also carries yellow / white / red AV
  jacks with their cables plugged in.
- The disc is a secondary detail: the tray line on the casing, and a small
  spinning disc on screen only while something is loading.
- Three CSS variables describe the display opening (`--deck-top`,
  `--deck-bottom`, `--screen-x`); the CRT layer, dialogs, sheets, the image
  viewer and the boot screen all use them, so overlays appear *on the screen*
  and never cover the casing.
- Controls are real controls with accessible names (OPEN is "Surprise me",
  RESET is "Replay boot sequence"). The directional pad repeats what the
  section keys and ordinary scrolling already do, so it is pointer-only and
  hidden from the tab order and assistive technology.
- Read-outs report real state: POWER is on while the app runs, DISC blinks
  while any query or mutation is in flight, MEMORY lights when the library has
  entries (and memory-card slot 1 shows a card seated), and the LCD shows
  blocks used and local time.
- Navigation and the data credit (RAWG) live only on the casing; the screen
  has no header, menu or footer of its own.

**Software (inside the screen)** — late-90s console system software.

- **Palette.** Black and dark greys, off-white text, royal blue for anything
  selected. Red, yellow, green and cyan appear only in the small four-bar
  signature and as status colours.
- **Main menu.** The home screen is a console main menu: a vertical list
  (Featured, Popular, Recent, Upcoming, Memory card, Genre database) with a
  cursor, and one pane showing the selected list. Up and down move the
  cursor. On phones the list becomes a one-line `◀ FEATURED ▶` selector, so
  nothing scrolls sideways. Every pane reads data the server already
  prefetched.
- **Two modes.** *System mode* — off-white ground, navy ink — is used for the
  genre database and the memory-card utility. *Content mode* — black — is used wherever game
  artwork appears. System messages (errors, empty states) are plain black
  firmware screens.
- **Identity.** Purely typographic: the GAMEDEX wordmark and "Game Database
  System" descriptor, plus the four stepped bars. The lettering is Zrnic
  (Typodermic Fonts) converted to outlines and stored as SVG paths in
  `src/features/system/wordmark.tsx`. No font file is shipped: Zrnic's free
  desktop licence covers logos and outlined graphics but not web embedding,
  so it is used for the wordmark only.
- **Type.** Three faces: a squared technical sans (Chakra Petch) for all
  system text and reading copy, set light and widely tracked; a strong
  condensed face (Saira Condensed) for game titles only; a terminal mono
  (Share Tech Mono) for metadata. No bitmap fonts.
- **Game selection, not tiles.** Games are never shown as a grid of cards.
  They are numbered records in one list — slot, small picture, entry number,
  title, a line of system data, a five-cell rating read-out — with a lit blue
  cursor bar on the selected one. Where the list's own container is wide
  enough (a container query, not a viewport breakpoint) a preview window shows
  the selected entry large. Hover or keyboard focus moves the cursor; click or
  Enter opens the entry. On phones the list stands alone with a compact
  record layout. One component (`components/game/game-select.tsx`) serves
  the home lists, the archive and related games.
- **Flat software controls.** Panels are flat fills with one-pixel borders and
  square corners; on-screen buttons are flat rectangles that turn solid blue
  when selected.
- **CRT.** The display is drawn *by* the tube rather than tinted by it: one
  fixed, click-through layer sized to the display opening sits above
  everything the software renders — pages, artwork, dialogs and the boot
  screen. It paints scanlines (one dark line in three), a faint red/green/blue
  phosphor mask, a brighter centre with darker corners, a glass sheen and fine
  grain. Bright type and blue selections carry a little phosphor bloom and
  colour fringing. It is plain CSS gradients and shadows — no canvas, WebGL,
  filters or blend modes — so text stays sharp. A slow interference band and
  an occasional brightness flutter are the only moving parts, and both stop
  under `prefers-reduced-motion`.

**Behaviour**

- **Boot sequence.** Black screen, a lot of empty space: a line of light opens
  across the tube, the four bars grow in,
  the name fades up, a four-line self-test settles, then "System ready"
  (~2.8s on a first visit; ~0.7s once per tab session afterwards). Click,
  Enter, Escape or Space skips it; RESET replays it. An inline script picks the
  mode before first paint (`<html data-boot>`), so the app never flashes first
  and nothing shows without JavaScript. Preference key: `gamedex_boot_seen`.
- **Input read-out.** After each boot sequence the display shows "VIDEO 1 /
  NTSC" in its top-left corner for four seconds, the way a television announces
  the source it has locked on to. It is set dressing only and hidden from
  assistive technology.
- **Sound and volume.** Every cue is synthesised with the Web Audio API
  (`src/lib/audio/engine.ts`); there are no audio files. Sound is **on by
  default** at level 6 of 10. The − / + keys on the casing change the level
  one step at a time and bring up a television-style volume bar at the bottom
  centre of the picture for two seconds; all the way down is mute. The level is remembered in
  `gamedex_volume`. Browsers block audio until the visitor has clicked or
  pressed a key, so the first gesture unlocks it — which means the boot sound
  on a first-ever visit is silent, and is normally only heard on a replay.
- **Responsive.** Desktop is the full unit; tablets get a slimmer casing; on
  phones it becomes a handheld with keys above and below the screen.
- **Reduced motion.** With `prefers-reduced-motion`, the boot sequence is
  skipped, the interference band is removed and transitions collapse.
- **Cursor.** A pixel cursor is applied only for fine pointers with hover.

## Getting started

Requires Node 24 (`nvm use` picks it up from `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # then add your key
npm run dev                  # http://localhost:3000
```

### Environment

| Variable            | Required | Purpose                                              |
| ------------------- | -------- | ---------------------------------------------------- |
| `GAME_API_KEY`      | yes      | RAWG API key. Free at <https://rawg.io/apidocs>.     |
| `GAME_API_BASE_URL` | no       | Defaults to `https://api.rawg.io/api`.               |
| `SITE_URL`          | no       | Public origin for canonical and Open Graph URLs.     |

These are read only inside `src/server`. None is prefixed `NEXT_PUBLIC_`, and
the key never appears in a response, the HTML or a client bundle. Without a
key the app still runs: the BFF answers `503 CONFIG_MISSING` and the UI shows a
setup message instead of crashing.

Env files are git-ignored (only `.env.example` is committed).

### TanStack Query Devtools

Available in `npm run dev` via the floating button in the bottom-right corner.
Useful things to watch: the `["games", "list", {…filters}]` keys as you filter,
the next page being prefetched, and search terms being served from cache when
you retype them. The devtools import resolves to a no-op in production builds.

## Scripts

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Development server              |
| `npm run build`     | Production build                |
| `npm start`         | Serve the production build      |
| `npm test`          | Run the test suite once         |
| `npm run test:watch`| Tests in watch mode             |
| `npm run typecheck` | `tsc --noEmit`                  |
| `npm run lint`      | ESLint                          |

## Testing

Tests cover behaviour rather than markup:

- **BFF** — response normalisation, parameter validation and whitelisting,
  every upstream failure mapped to the error contract (400–500, timeout,
  network, rate limiting with `Retry-After`), the missing-key path, and that
  the key never reaches logs.
- **Services** — filter translation, paging past the end, cache lifetimes,
  the random-game fallback.
- **Client** — the API client and retry policy; the library store
  (favourites, status, persistence, corrupt storage, cross-tab sync).
- **Components** — browsing (URL-driven filters, debounced search, pagination
  and prefetch, query caching, empty/error/rate-limit/missing-key states), the
  game profile (loading, lazy sections, invalid game) and the command palette
  (debounce, keyboard navigation, empty and error states).

The provider is always stubbed at `fetch`, so tests need no key and make no
network requests.

## Production build and deployment

```bash
npm run build && npm start
```

Deploys as a standard Next.js app (Vercel or any Node 24 host):

- Set `GAME_API_KEY` as a **server** environment variable, and `SITE_URL` to
  the public origin so social previews get absolute URLs.
- The home page is statically generated and revalidated hourly; game, browse,
  genre and platform pages render on demand over cached data.
- Artwork goes through the Next.js image optimiser (`media.rawg.io` is the only
  allowed remote host). On hosts that bill per optimised image, watch that
  usage — the app requests a handful of sizes per image.
- The server data cache is per deployment by default. If you run several
  instances, configure a shared cache handler so they share one copy.

## Data and attribution

Game data and images come from [RAWG](https://rawg.io). Their free tier
requires attribution with a link on every page that uses the data, which the
site footer provides. GameDex is a personal project and is not affiliated with
RAWG or any game publisher.
