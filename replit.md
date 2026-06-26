# VERSUS TIERS

A premium Minecraft PvP tier list website with cyan+black glassmorphism theme, animated cloud background, and full backend.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/versus-tiers run dev` — run the frontend (port 24053)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed the database with sample data
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks/schemas
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Framer Motion, Wouter, React Query
- API: Express 5 on `/api` path
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks)
- Auth: HMAC-SHA256 token (stored in localStorage as `vt_token`)
- Password hashing: SHA256 + static salt `vt_salt_2024`
- Minecraft avatars: `https://mc-heads.net/avatar/{username}/64`

## Where things live

- `lib/db/src/schema/` — Drizzle DB schema (users, players, gamemodes, rankings, badges, settings, announcements, activity_logs)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks + Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT-like auth middleware
- `artifacts/versus-tiers/src/pages/` — all page components
- `artifacts/versus-tiers/src/components/` — shared UI components
- `artifacts/versus-tiers/src/lib/auth-context.tsx` — auth context + provider

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks. Never call fetch directly.
- Auth token stored in localStorage under `vt_token`, injected via `setAuthTokenGetter()` from the API client.
- Tier system: HT5 > HT4 > HT3 > HT2 > HT1 > LT5 > LT4 > LT3 > LT2 > LT1 > UR
- All routes served through the shared proxy: `/api` → api-server (port 8080), `/` → frontend (port 24053)
- Password hashing: SHA256 with static salt (not bcrypt — no bcrypt installed in env)

## Product

- Public homepage with hero, animated clouds, stats bar, top players, gamemode grid
- Leaderboard with gamemode tabs, tier/sort filters, paginated rankings
- Player profile pages with skin display, badge showcase, per-gamemode stats
- Search page with debounced search + tier filter
- Auth: login, register, forgot-password
- Admin panel: dashboard (stats + activity + tier distribution), users, players, gamemodes, rankings, badges, settings, announcements management

## Admin Credentials

- Email: `admin@versustiers.gg`
- Password: `admin123`

## User preferences

- Cyan+black glassmorphism aesthetic
- Dark theme only
- Space Mono / Inter fonts

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- The API server path is `/api` — all routes must be prefixed accordingly
- `setAuthTokenGetter()` must be called in `main.tsx` before the app renders (done)
- Express route params typed as `string | string[]` — always cast with `String()` before passing to Drizzle
