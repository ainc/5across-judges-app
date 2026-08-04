# Pitch Judging Web App

Fast, judge-friendly scoring web app for pitch competitions with draft save, final submission validation, live weighted totals, current rankings, and historical competition results.

## Stack

- Next.js (App Router) + TypeScript
- Prisma ORM
- Supabase Postgres (`DATABASE_URL` + `DIRECT_URL`)

## Data Model

Core entities:

- `Competition`: competition run metadata (`name`, `eventDate`, `isActive`)
- `Judge`, `Company`, `Category`: competition-scoped configuration
- `SubmissionSession`: per-judge submission status (`DRAFT` or `FINAL`)
- `Score`: judge/company/category score entries scoped to one competition

All score writes and reads are scoped by `competitionId`, so new competitions do not overwrite prior competition data.

## Scoring Logic

- Categories use configurable integer weights (percent)
- Weight conversion: `decimalWeight = weight / 100`
- Judge per-company weighted score: `sum(score * decimalWeight)` over scored categories
- Final company score: average of all judges' weighted totals for that company
- Displayed final scores rounded to 2 decimals
- Winner: highest final company score

## Configuration

Competition config lives in DB and is seeded by `prisma/seed.ts`:

- Judges list
- Companies list
- Categories and weights
- Score scale max (`maxScore`, currently 5)

Use the **Admin Dashboard** (`/admin`) to manage the active competition without touching seed data:

- Edit judge and company names
- Edit scoring criteria names, weights, and max scores (weights must total 100%)
- Post a message to judges (shown on the scoring page)
- Save a text results snapshot from current final submissions
- Archive the current round and start a fresh competition (clears judge inputs on the main page)

To bootstrap a first competition locally, run `npm run db:seed`.

## API Endpoints

- `GET /api/competitions/active`: active competition config (judges, companies, categories)
- `GET /api/scores?competitionId=&judgeId=`: load a judge's saved scores and submission status (`DRAFT`, `FINAL`, or none)
- `POST /api/scores`: bulk score upsert by judge; allows draft incomplete, rejects incomplete final submissions
- `GET /api/results`: ranking, winner, score, rank, judge count, drill-down for active (or provided) competition; **final submissions only**
- `GET /api/competitions`: list past competitions with metadata and winner
- `GET /api/competitions/:competitionId/results`: selected competition rankings and score details
- `GET /api/admin/competition`: active competition admin config
- `PUT /api/admin/competition`: update judges, companies, categories, judge message, and stored results summary
- `POST /api/admin/competition/save-results`: compute rankings and store a results text snapshot on the active competition
- `POST /api/admin/competition/next`: archive active competition and create a fresh active round with the same setup

## Local Setup

1. Create a free [Supabase](https://supabase.com) project.
2. In **Project Settings → Database**, copy:
   - **Transaction pooler** URI → `DATABASE_URL` (port `6543`, append `?pgbouncer=true`)
   - **Direct connection** URI → `DIRECT_URL` (port `5432`)
3. Install dependencies:
   - `npm install`
4. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET` (generate with `openssl rand -base64 32`)
   - Optional: `ADMIN_USERNAME`/`ADMIN_PASSWORD`, `JUDGE_PASSWORD`, `JUDGE1_USERNAME`, etc.
5. Apply migrations to Supabase:
   - `npm run db:deploy`
6. Seed baseline competition data and users:
   - `npm run db:seed`
7. Start app:
   - `npm run dev`
8. Open `http://localhost:3000` (redirects to `/login` if not signed in)

Set `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `JUDGE_PASSWORD` (and optional `JUDGE*_USERNAME`) in `.env` **before** seeding so accounts are not created with placeholder credentials. Sessions expire after 8 hours. Admin can access `/admin`; judges score at `/`.

## Security (Supabase RLS)

This app authenticates with **NextAuth** and reads/writes Postgres through **Prisma** (`DATABASE_URL`). It does **not** use Supabase Auth JWTs, so policies based on `auth.uid()` are not applicable.

Migrations enable **Row Level Security** on all app tables and add explicit **deny** policies for `anon` / `authenticated`. That blocks the Supabase Data API (project URL + anon key) while Prisma keeps working via the privileged DB connection. Do **not** add `auth.uid()` policies unless you later switch these tables to Supabase Auth + PostgREST. Authorization for judges/admins is enforced in Next.js route handlers (`requireAuth` / `requireAdmin` / `requireScorer`).

After pulling RLS migrations, run `npm run db:deploy` so Supabase picks them up and the dashboard warnings clear.

## Deploy (Netlify)

Set the same env vars on Netlify (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, and any auth overrides). Run `npm run db:deploy` against Supabase before or as part of deploy so the schema exists. Local SQLite (`prisma/dev.db`) is no longer used.

## Build

- Production build: `npm run build`
- Lint: `npm run lint`

## Notes on History Retention

- Each competition has its own judges/companies/categories and score rows.
- Historical competition records remain queryable through history endpoints/pages.
- Final rankings are recomputed from stored underlying scores, preserving transparency and drill-down capability.
