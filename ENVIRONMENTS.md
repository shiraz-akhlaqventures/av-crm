# Environments

This document explains how secrets and configuration are managed across **production**, **staging**, **preview**, and **local development** for the `av-crm` monorepo.

## Why this doc exists

The repo has two runnable apps (`apps/web`, `apps/api`) and three real deployment targets (Vercel prod, Render prod, plus staging variants). Next.js, NestJS, Vercel, and Render each handle environment variables differently. This is the source of truth so secrets end up in the right place.

## TL;DR — Where each env var lives

| Environment | Frontend (`apps/web`) | Backend (`apps/api`) |
|---|---|---|
| **Production** | Vercel dashboard → Production env vars | Render service → Environment vars |
| **Staging** | Vercel dashboard → Preview env, scoped to `staging` branch | Render staging service → Environment vars |
| **PR / feature previews** | Vercel dashboard → Preview env (auto-applied) | N/A (preview web calls Render staging api) |
| **Local development** | `apps/web/.env.local` (gitignored) | `apps/api/.env` (gitignored) |
| **Schema / docs** | `apps/web/.env.example` (committed) | `apps/api/.env.example` (committed) |

**Do not commit `.env.production`, `.env.development`, or `.env.staging`.** None of these are valid Next.js filenames and they cause build-time secret leaks. See "Why" below.

## Supported env file names

Only these filenames are recognized (Next.js convention; we follow it app-wide):

| File | When loaded | Gitignored? |
|---|---|---|
| `.env` | All envs (lowest priority) | Yes |
| `.env.local` | All envs (overrides `.env`) | Yes |
| `.env.development` | `next dev` / `NODE_ENV=development` | Yes |
| `.env.development.local` | dev only (overrides `.env.development`) | Yes |
| `.env.production` | `next build` / `NODE_ENV=production` | Yes |
| `.env.production.local` | prod only (overrides `.env.production`) | Yes |
| `.env.test` | `next test` / Jest | Yes |
| `.env.example` | Never loaded — docs only | **No (committed)** |

`.env.staging` is **not** a Next.js filename. Staging is handled by **Vercel's Preview environment** with branch filtering — env vars live in the Vercel dashboard, not in a file.

## Why not `.env.production`?

If `.env.production` is committed or shared, every build bakes those values into the JS bundle. Risks:

1. **Wrong URL ships to users** — e.g. forgetting to update `NEXT_PUBLIC_API_URL` leaves `http://localhost:3001` baked into production JS.
2. **Secret rotation requires a redeploy** — env vars in the Vercel/Render dashboards can be rotated without rebuilding; baked-in values require a full redeploy.
3. **Behavior diverges by location** — Vercel dashboard env vars override `.env.production`, but a local `next build` honors `.env.production`. Easy to ship "works on my machine" bugs.
4. **Accidental commits** — once one is committed, the secret is in git history forever (must rotate, not just delete).

## Adding a new environment variable

### Frontend (`NEXT_PUBLIC_*`)

1. Add the key to `apps/web/.env.example` with a placeholder value and a comment explaining what it is.
2. Set it in the Vercel dashboard for each environment that needs it (Production, Preview → all branches or specific branch).
3. For local dev, copy the line into `apps/web/.env.local` with a real value.
4. Never put a real `NEXT_PUBLIC_*` value in any committed file.

### Backend (server-only)

1. Add the key to `apps/api/.env.example` with a placeholder.
2. Set it in the Render dashboard for each service (prod, staging).
3. For local dev, copy into `apps/api/.env`.

## Staging setup specifics

### Vercel

1. Create a `staging` branch: `git checkout -b staging && git push origin staging`.
2. Project → Settings → Environment Variables.
3. For staging-only values:
   - Click **Add** → key, value.
   - Environment: **Preview**.
   - Branch: select `staging` only (the "Git Branch" filter below the value).
4. Each push to `staging` triggers a preview URL like `https://av-crm-web-git-staging-<team>.vercel.app`.

### Render

1. Dashboard → **New +** → **Web Service**, connect the same repo.
2. Name: `av-crm-api-staging`. Branch: `staging`. Root Directory: `apps/api`.
3. Build command and start command match production (see AGENTS.md).
4. Environment variables: staging-specific values (different Firebase project, different `CORS_ORIGIN` pointing at the Vercel staging preview URL, different `JWT_SECRET`).
5. Auto-deploy: Yes.

## Local development workflow

```bash
# One-time setup per app
cp apps/web/.env.example apps/web/.env.local      # edit with real values
cp apps/api/.env.example apps/api/.env            # edit with real values

# Run
cd apps/web && pnpm dev                           # http://localhost:3000
cd apps/api && pnpm dev                           # http://localhost:3001
```

The api's `CORS_ORIGIN` must be `http://localhost:3000` to match the web dev server.

## Rotating a secret

1. Generate a new value (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` for random secrets).
2. Update it in **every** location that uses it: Vercel Production, Vercel Preview (per branch if scoped), Render prod, Render staging, local `.env`/`.env.local`.
3. Redeploy affected services (env var changes do not always trigger an auto-rebuild).
4. If the secret was ever committed to git, treat it as compromised — rotate it in the upstream system (Firebase console, etc.) immediately. Deleting the file from git history is not enough.

## Firebase project split (recommended)

Use two Firebase projects to isolate data:

| | Production | Staging |
|---|---|---|
| Project ID | `av-crm-prod` (or whatever you chose) | `av-crm-staging` |
| Service account | prod SA | staging SA |
| Auth users | real users | test users only |
| Firestore | real data | seed / synthetic data |
| Allowed domains | `av-crm-web.vercel.app` | `av-crm-web-git-staging-*.vercel.app`, `localhost` |

Using one project with collection prefixes (`prod_*`, `stg_*`) is cheaper but easier to leak across envs.
