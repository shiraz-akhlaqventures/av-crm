# AGENTS.md

Repository for **Akhlaq Ventures — 3D Company Dashboard** (`av-crm`).
A monorepo with a Next.js 16 frontend (3D org-chart dashboard), a NestJS 11 backend, and a shared TypeScript types package. See [`PRD.md`](./PRD.md) for full product spec and [`docs/`](./docs/) for research.

---

## Repository Layout

```
av-crm/
├── apps/
│   ├── web/          Next.js 16 frontend (R3F 3D dashboard, App Router)
│   └── api/          NestJS 11 backend (Firebase Admin, JWT auth)
├── packages/
│   └── shared-types/ TS types shared between web and api (built to dist/)
├── docs/             10 research documents backing the PRD
├── PRD.md            Product Requirements Document (v2.0)
├── crush.json        Crush CLI config (LLM providers)
├── turbo.json        Turbo task pipeline
├── pnpm-workspace.yaml
└── vercel.json       Vercel build/install overrides (root dir set in Vercel dashboard)
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

---

## Architecture & Data Flow

```
Browser ──► Next.js (apps/web, Vercel)
                │  (REST, NEXT_PUBLIC_API_URL)
                ▼
            NestJS (apps/api, Render)
                │
                ├──► Firebase Auth  (verify ID tokens)
                ├──► Firestore      (primary data store)
                ├──► Firebase Admin (server SDK, service account)
                └──► JWT (own access/refresh tokens, @nestjs/jwt)
```

- **Frontend** is the user-facing 3D dashboard. Uses **React Server Components** by default; R3F/Three.js scenes live behind a `"use client"` boundary (see `docs/04-3d-dashboard-ux-patterns.md`).
- **Backend** is a thin REST API on NestJS. Owns auth, RBAC enforcement, and business logic. Firebase Admin verifies Firebase ID tokens; the API then issues its own JWTs (see `AuthResponse` in shared-types).
- **Data model** is a 4-level hierarchy: `Company → Subsidiary → Department → Employee`, each tagged with a `SecurityLevel` (`public | internal | confidential | restricted`). See [`packages/shared-types/src/index.ts`](packages/shared-types/src/index.ts).

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
- `apps/api/.env.example`: `PORT`, `NODE_ENV`, `CORS_ORIGIN` (default `http://localhost:3000`), `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (newlines escaped as `\n`), `JWT_SECRET`.
- `apps/web/.env.example`: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`), then `NEXT_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId).
- Both `.env` files are committed (gitignored only at root level, not per-app). The values look like placeholders — confirm with the user before relying on them.
- **CORS pairing**: web is on `:3000`, api on `:3001`. Both `CORS_ORIGIN` (api) and `NEXT_PUBLIC_API_URL` (web) must agree for cross-origin fetches.

### ts-jest scope (`apps/api`)
Jest's `rootDir` is `"src"`, and the `testRegex` is `.*\\.spec\\.ts$`. E2E tests are kept under `test/` and run with `test:e2e` using `test/jest-e2e.json`. Build excludes specs via `tsconfig.build.json`.

### NestJS module style
NestJS 11 with CommonJS (`sourceType: "commonjs"` in eslint), `nodenext` module resolution. `experimentalDecorators` + `emitDecoratorMetadata` are on. Bootstrap in `main.ts` is intentionally minimal — there's no global ValidationPipe, CORS config, or prefix. Add them here as the API grows.

### State / data libraries on the web
- **Server data**: `@tanstack/react-query` 5.
- **Client state**: `zustand` 5 (no store file exists yet — pattern not yet established).
- **3D**: `@react-three/fiber` 9 + `@react-three/drei` 10 + `@react-three/postprocessing` 3 + `three` 0.185.

### Skills available locally
Custom skills live in `.crush/skills/` (firebase, nestjs-expert, nextjs, r3f-best-practices, rbac-permissions-builder, typescript, vercel-react-best-practices, zustand). The Crush config (`crush.json`) defines zenmux LLM providers. **Load the matching skill before starting work** — these contain project-specific conventions.

---

## Testing Approach

- **`apps/api`** has Jest configured. Unit tests live next to source as `*.spec.ts`. E2E tests live in `test/` and use Supertest against a real Nest application instance. Run `pnpm test:cov` for coverage (output goes to `../coverage`).
- **`apps/web`** has no test runner set up. If you add tests, install and configure one (Vitest is the common pick for Next.js 16).
- **`packages/shared-types`** has only `typecheck` (no runtime tests for type-only code).

---

## Deployment

- **Frontend → Vercel**: [`vercel.json`](./vercel.json) sets only build/install overrides (`buildCommand: "pnpm --filter @av-crm/shared-types build && pnpm build"`, `installCommand: "pnpm install"`). Root Directory is set in Vercel → Project → Settings → General → Root Directory → `apps/web` (not a valid `vercel.json` property in monorepo mode). The `&&` ensures `packages/shared-types/dist/` exists before `next build` runs, since the package's `main` points to `./dist/index.js`.
- **Backend → Render** (per PRD; not yet wired up — no `render.yaml` exists).
- **Database / Auth / Storage → Firebase** (Firestore, Auth, Storage, FCM). Service account credentials live in the api's `.env`.

---

## Reference Files

| Concern | File |
|---|---|
| Product requirements | `PRD.md` |
| Architecture research | `docs/02-tech-stack-architecture.md`, `docs/06-nestjs-render-backend.md`, `docs/08-scalable-data-architecture.md` |
| 3D scene patterns | `docs/04-3d-dashboard-ux-patterns.md`, `docs/10-production-3d-architecture.md` |
| Security & RBAC | `docs/09-security-compliance.md` |
| Shared types | `packages/shared-types/src/index.ts` |
| Frontend layout/root | `apps/web/app/layout.tsx`, `apps/web/app/page.tsx` |
| UI primitives example | `apps/web/components/ui/button.tsx` |
| shadcn config | `apps/web/components.json` |
| Backend bootstrap | `apps/api/src/main.ts`, `apps/api/src/app.module.ts` |
| NestJS skill | `.crush/skills/nestjs-expert/SKILL.md` |
| Next.js 16 skill | `.crush/skills/nextjs/SKILL.md` |
| R3F skill | `.crush/skills/r3f-best-practices/SKILL.md` |
| RBAC skill | `.crush/skills/rbac-permissions-builder/SKILL.md` |
