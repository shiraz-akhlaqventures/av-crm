# AGENTS.md

Repository for **Akhlaq Ventures — 3D Company Dashboard** (`av-crm`).
A monorepo with a Next.js 16 frontend (3D org-chart dashboard), a NestJS 11 backend, and a shared TypeScript types package. See [`PRD.md`](./PRD.md) for full product spec and [`docs/`](./docs/) for research.

---

## Current State (as of last session)

- ✅ Monorepo scaffolded, deployed to **Vercel** (web) + **Render** (api), production + staging
- ✅ **Firebase Auth** wired end-to-end: signup → ID token → backend verifies → issues our own JWT (access 15m + refresh 7d)
- ✅ **Firestore** set up (prod + staging), `users/{uid}` documents auto-created on first sign-in
- ✅ **Supabase Storage** used for file uploads (avatars, assets buckets) — Firebase Storage skipped because it requires the Blaze plan
- ✅ Login page at `/login` (email/password) verified working on both production and staging
- ⬜ No seeded data yet — Firestore collections for companies/subsidiaries/departments/employees are empty
- ⬜ 3D dashboard not yet built — `apps/web/app/page.tsx` is still the default Next.js starter

---

## Repository Layout

```
av-crm/
├── apps/
│   ├── web/                Next.js 16 frontend (R3F 3D dashboard, App Router)
│   └── api/                NestJS 11 backend (Firebase Admin, JWT auth, Supabase)
├── packages/
│   └── shared-types/       TS types shared between web and api (built to dist/)
├── docs/                   10 research documents backing the PRD
├── PRD.md                  Product Requirements Document (v2.0)
├── ENVIRONMENTS.md         Env var strategy (read this before touching secrets)
├── crush.json              Crush CLI config (zenmux LLM providers)
├── skills-lock.json        Skills required by this repo (run `npx skills` if missing)
├── turbo.json              Turbo task pipeline
├── pnpm-workspace.yaml
└── vercel.json             Vercel build/install overrides (root dir set in Vercel dashboard)
```

- **Workspace**: pnpm with `apps/*` + `packages/*` (see `pnpm-workspace.yaml`).
- **Monorepo tool**: Turbo 2.3 (`turbo.json`). Tasks: `build`, `dev`, `start`, `test`, `lint`. `dev` is `cache: false`, `persistent: true`.
- **Package manager**: pnpm 10.33 (enforced via `packageManager` in root `package.json`).

---

## Commands

All commands should be run from the **repo root** unless noted.

### Root (Turbo orchestrator)
```bash
pnpm dev          # turbo run dev  →  runs dev for all workspaces
pnpm build        # turbo run build (dependsOn: ["^build"])
pnpm test         # turbo run test
pnpm lint         # turbo run lint
```

### `apps/web` (Next.js 16)
```bash
cd apps/web
pnpm dev          # next dev (default port 3000)
pnpm build        # next build
pnpm start        # next start
pnpm lint         # eslint (flat config)
```
No test runner is configured for web — there is no `test` script.

### `apps/api` (NestJS 11)
```bash
cd apps/api
pnpm dev          # nest start --watch
pnpm build        # nest build → dist/
pnpm start        # nest start
pnpm start:debug  # nest start --debug --watch
pnpm start:prod   # node dist/main
pnpm lint         # eslint --fix (flat config)
pnpm test         # jest (unit, src/**/*.spec.ts)
pnpm test:watch
pnpm test:cov     # jest --coverage
pnpm test:e2e     # jest --config ./test/jest-e2e.json
pnpm format       # prettier --write "src/**/*.ts" "test/**/*.ts"
```

### `packages/shared-types`
```bash
cd packages/shared-types
pnpm build        # tsc → dist/ (consumed via main: ./dist/index.js)
pnpm watch        # tsc --watch
pnpm typecheck    # tsc --noEmit
```
**Must build before `apps/web` or `apps/api` can use new types** — both import via `"main": "./dist/index.js"` resolution, not via TS source. The web app additionally adds `transpilePackages: ["@av-crm/shared-types"]` in `next.config.ts` so Next can transpile it directly.

### Re-install Skills (if missing)
```bash
npx -y skills add supabase/agent-skills
```
Skills are tracked in `skills-lock.json`. The `.crush/skills/` and `.agents/skills/` folders are runtime caches (gitignored).

---

## Architecture & Data Flow

```
Browser (Puducherry, IN)
    │
    │ ~80-120ms via Vercel edge (Mumbai bom1)
    ▼
Vercel (apps/web) ───── prod: av-crm-web.vercel.app
    │                   staging: av-crm-web-git-staging-...vercel.app
    │  (REST + CORS, NEXT_PUBLIC_API_URL)
    ▼
Render (apps/api) ──── prod: av-crm-api.onrender.com
    │                   staging: av-crm-api-staging.onrender.com  (Singapore)
    │
    ├──► Firebase Auth    verifyIdToken() on /api/auth/login
    ├──► Firestore        primary data store (admin SDK, service account)
    └──► Supabase Storage file uploads (avatars, assets buckets)
                         │
                         ▼
              JWT pair (access 15m + refresh 7d) returned to browser
```

- **Frontend** is the user-facing 3D dashboard. Uses **React Server Components** by default; R3F/Three.js scenes live behind a `"use client"` boundary (see `docs/04-3d-dashboard-ux-patterns.md`).
- **Backend** is a thin REST API on NestJS. Owns auth, RBAC enforcement, and business logic. Firebase Admin verifies Firebase ID tokens; the API then issues its own JWTs (see `AuthResponse` in shared-types).
- **Data model** is a 4-level hierarchy: `Company → Subsidiary → Department → Employee`, each tagged with a `SecurityLevel` (`public | internal | confidential | restricted`). See [`packages/shared-types/src/index.ts`](packages/shared-types/src/index.ts).
- **Region choice**: all backend services (Render, Supabase, Firestore) are in **Singapore** (`asia-southeast1`) so cross-service hops stay <10ms.

---

## Current Backend Modules (`apps/api/src/`)

| Module | Purpose | Key files |
|---|---|---|
| `firebase/` | Firebase Admin SDK wrapper (Auth + Firestore) | `firebase.service.ts` (singleton, env-var guard) |
| `auth/` | JWT login flow | `auth.controller.ts`, `auth.service.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`, `current-user.decorator.ts` |
| `supabase/` | Supabase Storage admin client | `supabase.service.ts` (SERVICE_ROLE key, bypasses RLS) |
| `all-exceptions.filter.ts` | Global error filter — logs stack trace, returns `{statusCode, message, path, timestamp}` to client |

Endpoints:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api` | none | Health check (`Hello World!`) |
| GET | `/api/supabase/health` | none | Verifies Supabase connection + lists buckets |
| POST | `/api/auth/login` | none | Exchanges Firebase ID token for our JWT pair |
| GET | `/api/auth/me` | JWT | Returns the decoded JWT payload (current user) |

NestJS `main.ts` sets: global prefix `/api`, `enableCors` (uses `CORS_ORIGIN` env var), `ValidationPipe` (whitelist + forbidNonWhitelisted), `AllExceptionsFilter`, verbose Logger.

---

## Key Conventions & Gotchas

### Next.js 16 is **not** the Next.js you know
[`apps/web/AGENTS.md`](apps/web/AGENTS.md) already warns about this. Next.js 16 has breaking changes from training data — APIs, conventions, and file structure differ. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices. (`apps/web/CLAUDE.md` just imports `AGENTS.md`.)

### Path aliases
- **`apps/web`**: `@/*` maps to the web app root (`tsconfig.json` `paths`). Example: `import { cn } from "@/lib/utils"`.
- **`apps/api`**: no path aliases — uses relative imports only.
- **`packages/shared-types`**: import via package name (`@av-crm/shared-types`).

### Workspace dependency protocol
Both `apps/web` and `apps/api` declare `"@av-crm/shared-types": "workspace:*"`. After editing `packages/shared-types/src/`, run `pnpm --filter @av-crm/shared-types build` so `dist/` is up to date. The web app uses `transpilePackages`, but the api relies on the built `dist/` for runtime.

### Tailwind 4 + shadcn (base-nova style)
- Tailwind v4 with the new CSS-first config — `app/globals.css` uses `@import "tailwindcss"`, `@theme inline`, and `@custom-variant`. There is **no `tailwind.config.js`**; config lives in `globals.css`.
- shadcn is configured in `components.json` with `style: "base-nova"`, `baseColor: "neutral"`, `iconLibrary: "lucide"`. Aliases point to `@/components`, `@/lib/utils`, `@/components/ui`, `@/hooks`.
- **`@/hooks` does not exist yet** — it's reserved by shadcn config. Create it before referencing.
- shadcn components import primitives from `@base-ui/react` (not Radix). See `apps/web/components/ui/button.tsx` for the pattern: `import { Button as ButtonPrimitive } from "@base-ui/react/button"`.
- Icons come from `lucide-react`.

### ESLint flat config everywhere
Both apps use ESLint 9 flat config (`eslint.config.mjs`).
- `apps/api` adds `eslint-plugin-prettier` with `{ endOfLine: "auto" }`.
- `apps/web` extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.

### Prettier (api only)
`.prettierrc` in `apps/api`: `{ singleQuote: true, trailingComma: "all" }`. The web app has no Prettier config.

### Environment variables
See [`ENVIRONMENTS.md`](./ENVIRONMENTS.md) for the full strategy. Short version:
- Production: Vercel / Render dashboards (no committed env files).
- Staging: Vercel Preview env scoped to `staging` branch; Render staging service.
- Local: `apps/*/.env.local` (gitignored).
- Examples: `apps/*/.env.example` (committed).
- **Do not create `.env.production`, `.env.development`, or `.env.staging`** — Next.js bakes `.env.production` into the JS bundle at build time (secret leak risk) and `.env.staging` is not a recognized filename. Staging is handled by Vercel's Preview environment with branch filtering.
- **CORS pairing**: web is on `:3000`, api on `:3001`. Both `CORS_ORIGIN` (api) and `NEXT_PUBLIC_API_URL` (web) must agree for cross-origin fetches. **Must match exactly, no trailing slash.**

### Required env vars (current)

**Vercel (web) — Production:**
- `NEXT_PUBLIC_API_URL` — Render prod URL
- `NEXT_PUBLIC_FIREBASE_*` (7 keys) — Firebase web SDK config
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase web SDK

**Vercel (web) — Preview env (staging branch):**
- Same keys, staging values

**Render (api) — Production service:**
- `PORT`, `NODE_ENV`, `CORS_ORIGIN`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`

**Render (api) — Staging service:**
- Same keys, staging values, different `JWT_SECRET`

### ts-jest scope (`apps/api`)
Jest's `rootDir` is `"src"`, and the `testRegex` is `.*\\.spec\\.ts$`. E2E tests are kept under `test/` and run with `test:e2e` using `test/jest-e2e.json`. Build excludes specs via `tsconfig.build.json`.

### NestJS module style
NestJS 11 with CommonJS (`sourceType: "commonjs"` in eslint), `nodenext` module resolution. `experimentalDecorators` + `emitDecoratorMetadata` are on. Bootstrap in `main.ts` enables: CORS, global `/api` prefix, ValidationPipe, AllExceptionsFilter, verbose Logger.

### State / data libraries on the web
- **Server data**: `@tanstack/react-query` 5 (not yet used).
- **Client state**: `zustand` 5 (no store file exists yet — pattern not yet established).
- **3D**: `@react-three/fiber` 9 + `@react-three/drei` 10 + `@react-three/postprocessing` 3 + `three` 0.185.
- **Auth (client)**: `firebase@12.16.0` (browser SDK) — see `apps/web/lib/firebase/`.
- **Storage (client)**: `@supabase/ssr@0.12.0` + `@supabase/supabase-js@2.110.2` — see `apps/web/lib/supabase/`.

### Skills available locally
Custom skills live in `.crush/skills/` (firebase, nestjs-expert, nextjs, r3f-best-practices, rbac-permissions-builder, supabase, supabase-postgres-best-practices, typescript, vercel-react-best-practices, zustand). The Crush config (`crush.json`) defines zenmux LLM providers. **Load the matching skill before starting work** — these contain project-specific conventions. Run `npx -y skills add <owner>/<repo> --skill <name>` to install missing skills.

---

## Lessons Learned (Gotchas From This Build)

These are non-obvious things that wasted real time. Add to this list when you hit new ones.

1. **Firestore rejects `undefined` values.** Optional fields like `photoURL?: string` must be spread conditionally (`...(value ? { photoURL: value } : {})`) or `ignoreUndefinedProperties` must be enabled in Firestore settings. The cleanest fix is the conditional spread.

2. **`firebase-admin@14` changed import paths.** Don't use `import * as admin from "firebase-admin"` and then `admin.auth`, `admin.firestore`, `admin.credential`. Use the sub-module imports: `import { initializeApp, cert } from "firebase-admin/app"`, `import { getAuth } from "firebase-admin/auth"`, `import { getFirestore } from "firebase-admin/firestore"`.

3. **`@supabase/storage-js` is not a direct dependency.** Don't `import type { StorageClient } from "@supabase/storage-js"` — it's only a transitive dep. Access storage via `supabaseClient.storage` (type is inferred from `SupabaseClient`).

4. **Render free tier doesn't expose request logs.** Only application logs (your `console.log` / NestJS Logger output). When debugging 500s: rely on the global exception filter (`AllExceptionsFilter`) which logs the stack trace AND returns the actual error message in the JSON response (visible in browser Network tab).

5. **Vercel `rootDirectory` is a project setting, not a `vercel.json` property.** Set it in Vercel dashboard → Project → Settings → General. `vercel.json` only takes build/install overrides. Putting `rootDirectory` in `vercel.json` causes: `Invalid request: should NOT have additional property 'rootDirectory'`.

6. **`vercel.json` buildCommand runs with cwd = Root Directory.** So with `rootDirectory: apps/web`, `pnpm build --filter web` resolves to `next build --filter web` (next rejects the flag). Use `pnpm --filter @av-crm/shared-types build && pnpm build` instead — builds shared-types first, then runs `next build`.

7. **NestJS CORS is off by default.** `app.enableCors()` must be called in `main.ts` or browser cross-origin POSTs will hang on the OPTIONS preflight (returns 404 from Nest's default router).

8. **Firebase Storage requires the Blaze plan** (pay-as-you-go, free tier inside). We use **Supabase Storage** instead — both projects have `avatars` and `assets` public buckets.

9. **`FIREBASE_PRIVATE_KEY` newline handling.** Render's textarea preserves real newlines; many other services store it with literal `\n` escapes. Our `FirebaseService.ensureInitialized()` does `.replace(/\\n/g, "\n")` so both formats work.

10. **Supabase region must match Render region** for backend-to-backend hops to be fast. We chose Singapore to match Render. Don't create Supabase projects in Mumbai just because the user is geographically closer — the browser goes through Vercel's edge anyway, and the Render↔Supabase↔Firestore chain is what matters.

---

## Testing Approach

- **`apps/api`** has Jest configured. Unit tests live next to source as `*.spec.ts`. E2E tests live in `test/` and use Supertest against a real Nest application instance. Run `pnpm test:cov` for coverage (output goes to `../coverage`).
- **`apps/web`** has no test runner set up. If you add tests, install and configure one (Vitest is the common pick for Next.js 16).
- **`packages/shared-types`** has only `typecheck` (no runtime tests for type-only code).

For end-to-end smoke tests, hit the deployed endpoints:

```
curl https://av-crm-api.onrender.com/api                # "Hello World!"
curl https://av-crm-api.onrender.com/api/supabase/health
# {"ok":true,"buckets":["assets","avatars"]}
```

---

## Deployment

- **Frontend → Vercel**: [`vercel.json`](./vercel.json) sets only build/install overrides (`buildCommand: "pnpm --filter @av-crm/shared-types build && pnpm build"`, `installCommand: "pnpm install"`). Root Directory is set in Vercel → Project → Settings → General → Root Directory → `apps/web` (not a valid `vercel.json` property in monorepo mode). The `&&` ensures `packages/shared-types/dist/` exists before `next build` runs, since the package's `main` points to `./dist/index.js`.

- **Backend → Render**: Two web services (prod + staging) connected to the same GitHub repo, but different branches (`main` and `staging`). Root Directory `apps/api` for both. Build command: `pnpm install && pnpm --filter @av-crm/shared-types build && pnpm --filter api build`. Start command: `node dist/main.js`. Health check path: `/api`. Auto-deploy enabled.

- **Git workflow**: Develop on `staging` branch. Push to `staging` → Render staging redeploys + Vercel Preview rebuilds. Once verified, `git checkout main && git merge staging --no-ff && git push origin main` → production redeploys. Don't push directly to `main` unless intentional.

- **Firebase**: Two projects (`av-crm-prod`, `av-crm-staging`) both with Auth + Firestore enabled. Service account JSON downloaded for each — values stored in Render env vars, never in git.

- **Supabase**: Two projects (`av-crm-prod`, `av-crm-staging`) both with `avatars` + `assets` public buckets. Publishable keys on Vercel; secret keys on Render.

---

## Reference Files

| Concern | File |
|---|---|
| Product requirements | `PRD.md` |
| Environment strategy | `ENVIRONMENTS.md` |
| Architecture research | `docs/02-tech-stack-architecture.md`, `docs/06-nestjs-render-backend.md`, `docs/08-scalable-data-architecture.md` |
| 3D scene patterns | `docs/04-3d-dashboard-ux-patterns.md`, `docs/10-production-3d-architecture.md` |
| Security & RBAC | `docs/09-security-compliance.md` |
| Shared types | `packages/shared-types/src/index.ts` |
| Frontend layout/root | `apps/web/app/layout.tsx`, `apps/web/app/page.tsx` |
| Login page | `apps/web/app/login/page.tsx` |
| Web Firebase client | `apps/web/lib/firebase/{client,auth}.ts` |
| Web Supabase client | `apps/web/lib/supabase/{client,server,middleware}.ts` |
| Web API helper | `apps/web/lib/api/client.ts` |
| UI primitives example | `apps/web/components/ui/button.tsx` |
| shadcn config | `apps/web/components.json` |
| Backend bootstrap | `apps/api/src/main.ts`, `apps/api/src/app.module.ts` |
| Auth module | `apps/api/src/auth/` |
| Firebase admin wrapper | `apps/api/src/firebase/firebase.service.ts` |
| Supabase admin wrapper | `apps/api/src/supabase/supabase.service.ts` |
| Global error filter | `apps/api/src/all-exceptions.filter.ts` |
| NestJS skill | `.crush/skills/nestjs-expert/SKILL.md` |
| Next.js 16 skill | `.crush/skills/nextjs/SKILL.md` |
| R3F skill | `.crush/skills/r3f-best-practices/SKILL.md` |
| RBAC skill | `.crush/skills/rbac-permissions-builder/SKILL.md` |
| Supabase skill | `.crush/skills/supabase/SKILL.md` |
