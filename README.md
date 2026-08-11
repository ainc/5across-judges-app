# 5 Across Judge Scoring App

Web app for Awesome Inc’s **5 Across** pitch competitions. Judges score companies during the event; admins configure the round, message judges, save results, and archive history.

Built for a live event night: fast scoring, draft saves, validated final submissions, weighted totals, live rankings, and past competition look-up.

Website will be configured for judges by Awesome Inc prior to event, ask Kyle for login info.

---

## Day-one setup (new intern)

1. Get access to the GitHub repo (`ainc/5across-judges-app`), the Supabase project, and Netlify (ask Kyle).
2. Copy env values into a local `.env` (see [Environment variables](#environment-variables)).
3. Install and run:

```bash
npm install
npm run db:deploy    # apply Prisma migrations to Supabase
npm run db:seed      # WARNING: wipes competition/score data; creates users + sample rounds
npm run dev          # http://localhost:3000 → redirects to /login
```

4. Sign in (defaults after seed):
   - Admin: `admin` + `ADMIN_PASSWORD`
   - Judges: `judge1` / `judge2` / `judge3` + `JUDGE_PASSWORD`
5. Walk the product once: score as a judge on `/` → submit final → check `/results` → explore `/admin`.

**Do not run `db:seed` against production** unless you intend to wipe all competitions and scores.

---

## Who uses what

| Role | Routes | What they do |
|------|--------|--------------|
| **JUDGE** | `/`, `/results` | Score companies for the active competition; view rankings |
| **ADMIN** | `/`, `/results`, `/admin` | Everything judges can do, plus pick any judge’s score sheet, edit config, message judges, snapshot/archive rounds |

Judges will be signed in by Awesome Inc prior to the event. Admins run the competition from `/admin`.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, MUI 9 icons/components, Emotion (`@mui/material-nextjs`) |
| Auth | NextAuth v5 (Credentials + JWT, 8-hour sessions) |
| DB | Supabase Postgres via Prisma 6 (`DATABASE_URL` pooler + `DIRECT_URL` for migrations) |
| Validation | Zod |
| Deploy | Netlify (frontend) + Supabase (database) |

This is **not** classic Next.js 13/14 knowledge. Before changing framework APIs, skim `node_modules/next/dist/docs/` and `AGENTS.md`. Auth edge gating lives in `src/proxy.ts` (Next 16 “proxy”), not a `middleware.ts` file.

---

## How the app is organized

```
src/
  app/                      # Routes (App Router)
    page.tsx                # `/` judging UI
    login/page.tsx          # `/login`
    admin/page.tsx          # `/admin` (ADMIN only)
    results/page.tsx        # `/results`
    api/                    # REST route handlers (most mutations)
  auth.ts / auth.config.ts  # NextAuth setup + route authorization rules
  proxy.ts                  # Auth gate for matched routes
  components/
    JudgingPage.tsx         # Main scoring screen
    admin/                  # AdminDashboard + modals
  hooks/
    useJudgingSession.ts    # Judge page data/load/save
    useAdminDashboard.ts    # Admin page state + API calls
  lib/
    prisma.ts               # Prisma client singleton
    require-auth.ts         # requireAuth / requireAdmin / requireScorer
    auth-users.ts           # Login + judgeCode → Judge.id mapping
    scoring.ts              # Weights, range checks, rounding
    competition-results.ts  # Rankings from FINAL submissions
    competition-snapshot.ts # Archive / copy competitions
    admin-api.ts            # Browser helpers for admin fetches
prisma/
  schema.prisma             # Data model
  seed.ts                   # Users + sample competitions
  migrations/               # Including Supabase RLS policies
```

**Mental model:** pages/hooks are UI; business rules live in `src/lib/*`; persistence goes through Prisma in API routes. There are only a couple of server actions (`login`, admin `signOut`); almost everything else is `/api/...`.

---

## Product flows

### Scoring (event night)

1. Load active config: `GET /api/competitions/active` (judging page also polls ~every 5s for config changes).
2. Load that judge’s grid: `GET /api/scores?competitionId=&judgeId=`.
3. Save: `POST /api/scores` with `{ competitionId, judgeId, isFinal, entries[] }`.
   - **Draft:** incomplete grids allowed.
   - **Final:** every company × category cell required; scores must be **1–5**.
4. Per-company weighted total: `sum(score × weight/100)`. Display rounding is **1 decimal** (`roundScore` in `src/lib/scoring.ts`).
5. Company final score on results: average of judges who have a **FINAL** session for that competition. Winner = highest average.

Judges are locked to their own `judgeId`. Admins can switch between judges on `/`.

### Admin: configure the active round

From `/admin` (via `useAdminDashboard` → `PUT /api/admin/competition`):

- Competition name + event date
- Judges (names/codes), companies/presenters, categories (weights must total **100%**)
- Broadcast message to all judges (`judgeMessage`) and optional per-judge messages
- Results preview (polls ~every 15s)

### Admin: save results / next round / history

| Action | API | Effect |
|--------|-----|--------|
| Save results snapshot | `POST /api/admin/competition/save-results` | Stores `resultsSummary` and deep-copies the competition into an archived copy (active round stays active) |
| Start next competition | `POST /api/admin/competition/next` | Marks current inactive, creates a fresh active round with default judges/companies and copied categories |
| List / view archived | `GET /api/admin/competitions/archived` (+ `/[id]`) | Past rounds |
| Make archived live | `POST .../archived/[id]` | Swaps which competition is active (fails if names collide) |
| Delete archived | `DELETE .../archived/[id]` | Cannot delete the active competition |

Historical rankings are recomputed from stored scores (FINAL sessions only), not from a frozen number alone.

---

## Auth (how login actually works)

```
/login form
  → loginAction (server)
  → NextAuth Credentials → getUserFromDb()  [src/lib/auth-users.ts]
  → bcrypt check against User.passwordHash
  → JUDGE: resolveJudgeIdForCode(judgeCode) against the *active* competition’s judges
  → JWT session (8 hours) with { role, judgeId }
```

Gates (all of these matter):

1. `src/proxy.ts` + `authorized` in `src/auth.config.ts` (page/API path rules)
2. `requireAuth` / `requireAdmin` / `requireScorer` inside route handlers
3. Page-level redirects (e.g. non-admins hitting `/admin`)

**Judge linking gotcha:** login users have `User.judgeCode` (`JA` / `JB` / `JC`). Those map to `Judge` rows on the active competition by code, or by creation order slot if codes don’t match (`JUDGE_LOGIN_SLOTS` in `auth-users.ts`). Renaming judges is fine; reordering/deleting/adding judges without codes can break who lands on which score sheet.

This app does **not** use Supabase Auth. NextAuth + Prisma own authentication/authorization.

---

## Data model (Prisma)

Core idea: **every score row is scoped by `competitionId`**, so new rounds never overwrite old ones.

```
Competition (name, eventDate, isActive, judgeMessage?, resultsSummary?)
  ├── Judge[]                 (unique name per competition; optional code/message)
  ├── Company[]               (unique name; optional presenter)
  ├── Category[]              (weight %, maxScore default 5)
  ├── SubmissionSession[]     (per judge; DRAFT | FINAL)
  └── Score[]                 (judge × company × category; unique combo)

User (username, passwordHash, role ADMIN|JUDGE, judgeCode?)
  └── not a FK to Judge — linked at login time via judgeCode / slot
```

Schema: `prisma/schema.prisma`. Deleting a competition cascades to its judges, companies, categories, sessions, and scores.

---

## API reference

| Method | Path | Who | Purpose |
|--------|------|-----|---------|
| * | `/api/auth/[...nextauth]` | Public | NextAuth |
| GET | `/api/competitions/active` | Logged in | Active config + `configRevision` |
| GET | `/api/competitions` | Logged in | Competitions + winners |
| GET | `/api/competitions/:id/results` | Logged in | Rankings for one competition |
| GET/POST | `/api/scores` | Judge or Admin | Load / upsert scores |
| GET | `/api/results` | Logged in | Rankings for active (or `?competitionId=`) |
| GET/PUT | `/api/admin/competition` | Admin | Read/update active config |
| POST | `/api/admin/competition/save-results` | Admin | Snapshot + archive copy |
| POST | `/api/admin/competition/next` | Admin | Archive current, start new active |
| GET/POST | `/api/admin/competitions/archived` | Admin | List / create inactive |
| GET/POST/DELETE | `/api/admin/competitions/archived/:id` | Admin | Details / make live / delete |
| PUT | `/api/admin/judges/:id/message` | Admin | Per-judge message |

---

## Environment variables

Create a `.env` in the repo root (see `.env.example`).

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Supabase **transaction pooler** URI (port `6543`, append `?pgbouncer=true`) |
| `DIRECT_URL` | Yes | Supabase **direct** URI (port `5432`) — used by Prisma migrations |
| `AUTH_SECRET` | Yes in prod | `openssl rand -base64 32`. Dev has a hardcoded fallback in `auth.config.ts` |
| `ADMIN_PASSWORD` | Yes for seed | Password for the admin user |
| `JUDGE_PASSWORD` | Yes for seed | Shared password for judge1/2/3 |
| `ADMIN_USERNAME` | Optional | Default `admin` |
| `JUDGE1_USERNAME` / `JUDGE2_USERNAME` / `JUDGE3_USERNAME` | Optional | Defaults `judge1` / `judge2` / `judge3` |

Supabase: **Project Settings → Database** for the two connection strings.

---

## Scripts

| Script | What it does |
|--------|----------------|
| `npm run dev` | Local Next.js server |
| `npm run build` / `start` | Production build / run |
| `npm run lint` | ESLint |
| `npm run db:deploy` | `prisma migrate deploy` (use against Supabase) |
| `npm run db:migrate` | `prisma migrate dev` (create/apply migrations locally) |
| `npm run db:seed` | Seed users + sample competitions (**destructive** to competition data) |
| `npm run db:generate` | Regenerate Prisma client |

---

## Deploy (Netlify + Supabase)

1. Set the same env vars on the Netlify site (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, passwords/usernames as needed).
2. Run `npm run db:deploy` against Supabase whenever migrations change (including after pull), so schema + RLS stay in sync.
3. Push to the connected GitHub branch; Netlify builds with `npm run build`.

There is no `netlify.toml` in the repo today — build settings live in the Netlify UI.

### Supabase RLS (important)

Migrations turn on Row Level Security and **deny** `anon` / `authenticated` access through the Supabase Data API. That is intentional: the app talks to Postgres with Prisma’s DB URL (privileged), not with the anon key. Do **not** add `auth.uid()` policies unless you migrate this app to Supabase Auth + PostgREST. App authorization stays in Next.js (`requireAuth` / `requireAdmin` / `requireScorer`).

---

## Gotchas you’ll hit

1. **MUI icon hover overlays in production** — Filled + outline icons are stacked and toggled with CSS. Emotion styles can fight `globals.css` on Netlify. Fix already in place:
   - `AppRouterCacheProvider` with `enableCssLayer: true` in `src/app/layout.tsx`
   - `!important` overlay rules in `src/app/globals.css`
   - Prefer unique class names when two buttons share similar icon CSS (e.g. archived delete vs message delete).
2. **`db:seed` deletes all competitions and scores.** Safe for a fresh local DB; dangerous on shared/prod.
3. **Score range is 1–5** in `isScoreInRange`. Some older error strings may say “0 and 5” — trust the code.
4. **Rounding is 1 decimal**, not 2.
5. **Judge login mapping is fragile across structural judge edits.** Prefer renaming over reordering/deleting the JA/JB/JC slots mid-event.
6. **Admin unique-name renames** sometimes use a two-phase `__tmp_` update to avoid Postgres unique constraint collisions — don’t “simplify” that without understanding why.
7. **Local SQLite is gone.** Everything expects Supabase Postgres.
8. **Next.js 16 differs** from older docs; check `AGENTS.md` / local Next docs before inventing middleware or App Router patterns.

---

## Suggested first debugging path

When something breaks on scoring or results:

1. Reproduce as `judge1` and as `admin`.
2. Trace UI → hook → API:
   - Judging: `JudgingPage` → `useJudgingSession` → `/api/scores` → `scoring.ts`
   - Results: `/results` or admin preview → `competition-results.ts` (FINAL sessions only)
   - Admin save/next: `useAdminDashboard` → `/api/admin/competition/*` → `competition-snapshot.ts`
3. Confirm which competition is `isActive: true` in Supabase (Table Editor) if the UI looks “stuck” on an old round.

---

## Contact / ownership

Product owner: Awesome Inc staff running 5 Across.  
Repo: `https://github.com/ainc/5across-judges-app`  
When you leave, update this README with anything that surprised you — especially env access, Netlify project name, and event-night runbooks.
