# YGO Omega Web (Duelists Unite)

Frontend for the **YGO Omega | Duelists Unite** tournament and tools site: live/historical tournaments, leaderboards, statistics, saved decks, hypergeometric calculator, PDF decklists, Discord login, and more.

Built with **React 19**, **TypeScript**, **Vite 8**, **React Router 7** (hash routing), **Tailwind CSS 4**, and **i18next** (EN, PT, DE, FR, ES).

---

## Table of contents

1. [Prerequisites](#prerequisites)
2. [Quick start](#quick-start)
3. [Environment variables](#environment-variables)
4. [Running the app](#running-the-app)
5. [Backend and external services](#backend-and-external-services)
6. [Discord login (local development)](#discord-login-local-development)
7. [URLs and routing](#urls-and-routing)
8. [npm scripts reference](#npm-scripts-reference)
9. [Project layout](#project-layout)
10. [Linting and type-checking](#linting-and-type-checking)
11. [Production build and preview](#production-build-and-preview)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js** | **20+** recommended (22 LTS works). Vite 8 and modern React expect a current Node release. |
| **pnpm** | Preferred package manager (`pnpm-lock.yaml` is committed). Enable via [Corepack](https://nodejs.org/api/corepack.html): `corepack enable` then `corepack prepare pnpm@latest --activate`. |
| **Git** | To clone the repository. |

Optional, depending on what you are developing:

| Optional | Purpose |
|----------|---------|
| **omega-server-v3** (or compatible API) on port **3001** | Full local API for decks, auth, tournaments, stats, etc. |
| **Local deck server** on port **9999** | Room/deck features used by some tournament flows (`LOCAL_DECK_SERVER` in code). |
| **Discord OAuth app** | Login with Discord in development (redirect URI must match localhost). |

You do **not** need a local API to open the UI: point `VITE_API_URL` at the public production API (see [Environment variables](#environment-variables)) if you only want to explore the frontend.

---

## Quick start

```bash
# 1. Clone and enter the repo
git clone <repository-url>
cd omewebold

# 2. Install dependencies (use pnpm)
corepack enable
pnpm install

# 3. Environment files are already in the repo for dev/prod modes:
#    .env.development  → used by `pnpm dev`
#    .env.production   → used by `pnpm build` and `pnpm preview`

# 4. Start the development server
pnpm dev
```

Open the app in your browser:

**http://localhost:5173/**

Routes use **hash URLs**, for example:

- Home: `http://localhost:5173/#/`
- Leaderboards: `http://localhost:5173/#/leaderboards`
- Saved decks: `http://localhost:5173/#/decks`

---

## Environment variables

Vite only exposes variables prefixed with `VITE_` to the client. They are loaded from mode-specific files:

| File | Used when |
|------|-----------|
| `.env.development` | `pnpm dev` (`vite --mode development`) |
| `.env.production` | `pnpm build`, `pnpm preview`, `pnpm dev:prod` |
| `.env.example` | Template / documentation (copy values as needed) |

Create a local override if needed (e.g. `.env.development.local`); Vite merges env files by mode. **Do not commit secrets** in env files that are tracked in git.

### Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (for API features) | Base URL of the **omega-server-v3** HTTP API, including the `/v3` path segment. |
| `VITE_DISCORD_URL` | Yes (for Discord login button) | Full Discord OAuth2 authorize URL (`response_type=token`, `scope=identify`). The `redirect_uri` inside this URL **must** match where the app is served. |

### Shipped defaults

**Development** (`.env.development`):

```env
VITE_API_URL=http://localhost:3001/v3
VITE_DISCORD_URL=https://discord.com/oauth2/authorize?client_id=875973118512988180&response_type=token&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2F%23%2F%3F&scope=identify
```

**Production** (`.env.production`):

```env
VITE_API_URL=https://duelistsunite.org/omega-web/v3
VITE_DISCORD_URL=https://discord.com/oauth2/authorize?client_id=875973118512988180&response_type=token&redirect_uri=https%3A%2F%2Ftournament.duelistsunite.org%2F%23%2F%3F&scope=identify
```

### Common setups

**A — Frontend only, production API**

Use production values (or run `pnpm dev:prod`). No local backend required. Some write operations still need a valid Discord session and API permissions.

**B — Full local stack**

1. Run **omega-server-v3** (or your fork) so it listens on `http://localhost:3001` with routes under `/v3`.
2. Keep `.env.development` as above.
3. Run `pnpm dev`.

**C — Custom API URL**

Create `.env.development.local`:

```env
VITE_API_URL=https://your-api.example.com/v3
```

Restart the dev server after changing env files.

### Where variables are used

- `VITE_API_URL` → `src/utils/Api.ts` (`API_ENDPOINTS.MAIN`, `DUELISTS_UNITE_V3`)
- `VITE_DISCORD_URL` → `src/components/Navbar/index.tsx` (login link)

Fallback if `VITE_API_URL` is missing at runtime: `http://localhost:3000/v3` (code default; prefer setting the env var explicitly).

---

## Running the app

### Development (default)

```bash
pnpm dev
```

- Command: `vite --mode development`
- Loads `.env.development`
- Dev server: **http://localhost:5173/** (Vite default port)
- Hot Module Replacement (HMR) enabled

Expose on your LAN (e.g. phone testing):

```bash
pnpm dev -- --host
```

### Development against production env

```bash
pnpm dev:prod
```

- Command: `vite --mode production`
- Loads `.env.production` (production API + Discord redirect)
- Still a dev server with HMR; useful to debug production API behavior locally

### Production preview (after build)

```bash
pnpm build
pnpm preview
```

- `preview` serves the `dist/` folder with `vite preview --mode production`
- Default preview URL is also **http://localhost:5173/** unless configured otherwise

---

## Backend and external services

The SPA talks to several backends. Most traffic goes through `VITE_API_URL`.

### Main API (`VITE_API_URL`)

Comment in code refers to **omega-server-v3**. It provides REST endpoints under `/v3` for example:

- Auth (`auth/login`, token verification)
- Leaderboards, statistics, tournaments/history
- Saved decks (CRUD, likes, comments)
- Profile customization
- Calculator persistence
- Card search helpers

If `http://localhost:3001/v3` is unreachable, pages that fetch data will show errors or empty state depending on the screen.

### Other hard-coded endpoints (`src/utils/Api.ts`)

These do not use `.env` files today:

| Endpoint | URL | Usage |
|----------|-----|--------|
| Duelists Unite | `https://duelistsunite.org` | Legacy/public integrations |
| Discord API | `https://discord.com/api` | Profile after OAuth token |
| Forum | `https://forum.duelistsunite.org` | Links |
| YGOPRODeck | `https://db.ygoprodeck.com/api/v7` | Card data |
| Omega decks | `https://duelistsunite.org/omega-api-decks` | Deck conversion |
| Local deck server | `http://localhost:9999` | Optional; room list / join / add-deck |

For local deck server features, run whatever service implements those routes on port **9999**, or expect network errors on those actions only.

### Authentication flow (high level)

1. User clicks Discord login → redirect to `VITE_DISCORD_URL`.
2. Discord returns tokens in the URL hash; `CatchDiscord` route parses them and sends the user to `/discord`.
3. App stores Discord token and loads user profile via API.
4. JWT for protected routes is managed in `src/utils/auth.ts` (`AuthManager`, `localStorage` keys `omega_auth_token`, `omega_user_id`).

Protected UI routes (require logged-in user) include `/profile/edit`, `/decks/me`, `/decks/edit/:deckId` (see `src/router.ts`).

---

## Discord login (local development)

Discord OAuth **implicit grant** returns tokens in the URL **fragment**. This app uses **hash routing** (`createHashRouter`), so the redirect URI must include the hash base path.

For local dev, the redirect URI encoded in `.env.development` is:

```text
http://localhost:5173/#/?
```

Requirements:

1. **Port 5173** — Vite default; if you change the port (`pnpm dev -- --port 3000`), update `VITE_DISCORD_URL` and your Discord application redirect URI.
2. **Discord Developer Portal** — Application with client id `875973118512988180` (or replace client id in your own app and env).
3. Add the same redirect URI under **OAuth2 → Redirects** in the Discord app settings.

After login, unknown hash paths with OAuth params are handled by `src/components/CatchDiscord/index.tsx` and redirected to `/discord`.

---

## URLs and routing

The router is defined in `src/router.ts` with **`createHashRouter`**. All in-app paths are prefixed with `#`:

| Path | Page |
|------|------|
| `#/` | Home |
| `#/tournament/live` | Live tournament |
| `#/tournament/:id` | Tournament detail |
| `#/statistics` | Statistics |
| `#/history` | History |
| `#/leaderboards` | Leaderboards |
| `#/profile/:id` | Player profile |
| `#/profile/edit` | Edit profile (protected) |
| `#/discord` | Discord callback handling |
| `#/pdf-decklist` | PDF generator |
| `#/calculator` | Hypergeometric calculator |
| `#/konami-decklist` | Konami decklist converter |
| `#/deck-wiki` | Deck wiki |
| `#/decks` | All public decks |
| `#/decks/me` | My decks (protected) |
| `#/decks/:userId` | User’s decks |
| `#/decks/details/:deckId` | Deck details |
| `#/decks/edit/:deckId` | Edit deck (protected) |

`index.html` contains a legacy redirect for `/site/#/` URLs to the production tournament host.

---

## npm scripts reference

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite --mode development` | Local dev server + `.env.development` |
| `dev:prod` | `vite --mode production` | Dev server with production env |
| `build` | `tsc -b && vite build --mode production` | Typecheck then production bundle to `dist/` |
| `preview` | `vite preview --mode production` | Serve `dist/` locally |
| `lint` | `eslint .` | Run ESLint |

Path alias `@/` resolves to `src/` (see `vite.config.ts` and `tsconfig.app.json`).

---

## Project layout

```text
omewebold/
├── public/              # Static assets (favicon, manifest)
├── src/
│   ├── components/      # Shared UI (Navbar, modals, deck widgets, …)
│   ├── contexts/        # React context (Auth, Loading, Cards search, …)
│   ├── i18n/            # Translations (en, pt, de, fr, es)
│   ├── pages/           # Route-level screens
│   ├── ui/              # Low-level UI primitives
│   ├── utils/           # API client, auth, cards, helpers
│   ├── App.tsx          # Root layout and providers
│   ├── main.tsx         # Entry (Buffer polyfill, i18n, router)
│   └── router.ts        # Hash routes
├── .env.development     # Dev env (committed)
├── .env.production      # Prod env (committed)
├── .env.example         # Env template
├── vite.config.ts       # Vite + Tailwind + aliases + chunking
├── pnpm-workspace.yaml  # pnpm settings (e.g. allowBuilds for @swc/core)
└── package.json
```

Stack highlights:

- **UI**: Material Tailwind, MUI, Recharts, react-toastify, Quill
- **i18n**: `i18next` / `react-i18next`; language stored in `localStorage` (`i18nextLng`)
- **Bundler**: Vite with `@vitejs/plugin-react-swc` and `@tailwindcss/vite`

---

## Linting and type-checking

```bash
pnpm lint
```

Production build runs the TypeScript project references build first:

```bash
pnpm run build
```

If `tsc -b` reports errors, the Vite bundle step will not run. Fix type errors or address legacy modules under `src/pages/Live/` if you need a clean CI build. The dev server (`pnpm dev`) may still start because Vite does not always enforce the same checks as `tsc -b` during development.

---

## Production build and preview

```bash
# 1. Ensure .env.production has the correct production API and Discord URLs
# 2. Build
pnpm build

# 3. Preview locally
pnpm preview
```

Output directory: **`dist/`** (ES modules, hashed assets under `dist/assets/`).

Deploy `dist/` to any static host (nginx, S3 + CloudFront, Netlify, etc.). Configure the server for a **single-page app**:

- Serve `index.html` for unknown paths **or** rely on hash routing only (hash routes do not require server rewrite rules).
- If you use the legacy `/site/` path, mirror the redirect behavior in `index.html`.

Ensure production `VITE_*` values were set **at build time** — they are inlined during `vite build`, not read at runtime from the server.

---

## Troubleshooting

### `pnpm: command not found`

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

On Windows, use a terminal where Node/npm/corepack are on `PATH`. Alternatively install pnpm globally: `npm install -g pnpm`.

### `npm install` fails in this repo

This project is locked with **pnpm**. Use `pnpm install`, not `npm install`, to avoid workspace/resolution issues.

### Port 5173 already in use

```bash
pnpm dev -- --port 5174
```

Update `VITE_DISCORD_URL` redirect URI and the Discord app redirect list if you use Discord login on a non-default port.

### API requests fail (CORS or network)

- Confirm `VITE_API_URL` matches a running server (`curl http://localhost:3001/v3/...` or your host).
- Browser devtools → Network: check request URL and status.
- Local API must allow origin `http://localhost:5173` if CORS is enforced.

### Discord login returns to the app but user is not logged in

- Redirect URI must exactly match (including `/#/?`).
- Check browser console and `localStorage` for `access_token` / Discord keys after redirect.
- Ensure the catch-all route receives OAuth hash params (`CatchDiscord`).

### Blank page or assets 404 in production

- Confirm `base` in Vite config (default `/`) matches how the site is hosted.
- Rebuild with the correct `--mode production` env file.

### Optional deck server errors

Features calling `http://localhost:9999` fail if nothing is listening there. Either run that service or ignore those features during frontend-only work.

### `pnpm build` fails on TypeScript

Run `pnpm exec tsc -b` and fix reported files. Known problem areas may include legacy `src/pages/Live/` imports; the active tournament UI is under `src/pages/Tournament/`.

---

## Summary

| Goal | Command |
|------|---------|
| Install | `pnpm install` |
| Run locally | `pnpm dev` → http://localhost:5173/#/ |
| Use production API while coding | `pnpm dev:prod` or edit `.env.development` |
| Build for deploy | `pnpm build` → `dist/` |
| Test production build | `pnpm preview` |

For questions about the **omega-server-v3** API itself, refer to that backend repository’s documentation; this repo is the Vite/React frontend only.
