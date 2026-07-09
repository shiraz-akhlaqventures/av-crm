# 3D Company Dashboard — Tech Stack & Architecture Research

## 1. Next.js Routing: App Router vs Pages Router

| Factor | Recommendation |
|---|---|
| **Default choice** | **App Router (`app/`)** |
| **Why** | Native React Server Components, nested layouts, streaming SSR, simpler data fetching patterns, better alignment with modern React. |
| **When Pages Router fits** | If you rely heavily on `getServerSideProps`/`getStaticProps`, have mature `_app.tsx`/`_document.tsx` customizations, or use older plugins incompatible with App Router. |
| **For 3D dashboard** | App Router with client boundary (`"use client"`) for canvas/scene components. Keep 3D scenes out of server rendering; preload metadata from RSCs. |

---

## 2. Firebase Services

| Service | Purpose |
|---|---|
| **Firebase Authentication** | Email/password, Google SSO, SAML/OIDC for enterprise. |
| **Cloud Firestore** | Primary NoSQL database for relational-style company data. |
| **Firebase Storage** | 3D assets, avatars, company logos, textures, GLB/GLTF files. |
| **Vercel** | Frontend hosting for Next.js with GitHub-connected auto-deploys, preview environments, CDN, and best-in-class Next.js feature support. |
| **Firebase Hosting** | Not used for frontend; optional backup hosting if needed. |
| **Backend API** | NestJS on Render | Business logic, auth verification, role enforcement, aggregations, integrations. |
| **Firebase Security Rules** | Row-level authorization tied to auth tokens. |
| **Cloud Messaging** | Push notifications for task/project alerts. |
| **Cloud Functions for Firebase (optional)** | Small serverless hooks if needed; primary logic lives in NestJS. |

---

## 3. Database Schema (Firestore)

Firestore is document-oriented; denormalize selectively.

### Collections

```ts
companies/{companyId}
- name: string
- plan: "free" | "pro" | "enterprise"
- settings: object
- createdAt: timestamp
- ownerId: string // user id

subsidiaries/{subsidiaryId}
- companyId: ref
- name: string
- location: { lat, lng, address }
- managerIds: string[]
- metadata: object

users/{userId}
- email: string
- displayName: string
- avatarUrl: string
- roleId: ref -> roles/{roleId}
- companyId: ref
- subsidiaryIds: ref[]
- departmentId: ref
- permissions: string[] // cached effective permissions
- lastActiveAt: timestamp
- isOnline: boolean

roles/{roleId}
- name: "owner" | "admin" | "manager" | "employee" | "visitor"
- companyId: ref
- permissions: string[] // e.g. "project:read", "employee:write"

departments/{departmentId}
- companyId: ref
- subsidiaryId: ref (optional)
- name: string
- headId: ref -> users

projects/{projectId}
- companyId: ref
- subsidiaryId: ref
- departmentId: ref
- name: string
- status: "active" | "completed" | "archived"
- progress: number // 0-100
- memberIds: string[]
- createdBy: ref
- dueDate: timestamp

tasks/{taskId}
- projectId: ref
- assigneeId: ref
- title: string
- status: "todo" | "in_progress" | "review" | "done"
- priority: number
- dueDate: timestamp
- completedAt: timestamp

assets/{assetId}
- companyId: ref
- type: "avatar" | "model" | "texture"
- url: string
- metadata: object
```

### Indexes
- `users` by `companyId + roleId`
- `projects` by `companyId + status + dueDate`
- `tasks` by `projectId + status`

---

## 4. Authentication & Authorization

### Roles Hierarchy
| Role | Capabilities |
|---|---|
| **Owner** | Full access, billing, company deletion. |
| **Admin** | Manage users, roles, departments, all subsidiaries. |
| **Manager** | Manage own subsidiary/department, projects, tasks, team members. |
| **Employee** | View assigned projects/tasks, update own status. |
| **Visitor** | Read-only dashboards, no sensitive data. |

### Patterns
1. **Custom claims via Cloud Functions**: Set `role` claim on JWT after role assignment.
2. **Firestone security rules**: Match auth uid and claims.
3. **Permission strings** (RBAC + ABAC): check `request.auth.token.permissions.has("project:write")`.
4. **Route guards**: Middleware in Next.js (`middleware.ts`) checking session + role before entering `/admin`, `/manager`, `/dashboard`.
5. **UI gating**: Use a reusable `<Can permission="employee:write">{children}</Can>` component.

Example Firestore rule:
```js
match /companies/{companyId} {
  allow read: if request.auth != null &&
    request.auth.token.companyId == companyId;
  allow write: if request.auth.token.role in ["owner", "admin"];
}
```

---

## 5. Real-Time Data with Firestore

### Use Cases
| Feature | Implementation |
|---|---|
| Live employee status | `onSnapshot(doc(db, "users", userId))` → update `isOnline`/`lastActiveAt`. |
| Project progress bar | Aggregate listener on `tasks` → compute % client-side or via Cloud Function to `projects.progress`. |
| 3D avatar presence | Broadcast presence via `users/{userId}/presence` doc with heartbeat. |
| Notifications | `onSnapshot` on `users/{userId}/notifications`. |

### Best Practices
- Use **collection group queries** sparingly; prefer scoped listeners.
- Debounce high-frequency updates (e.g., mouse position in 3D space).
- Use `react-firebase-hooks` or custom hooks with `useEffect` cleanup.
- For expensive aggregations, update derived fields via Cloud Functions.

---

## 6. 3D Library Options for Next.js

| Library | Pros | Cons | Fit for Realistic 3D Office Dashboard |
|---|---|---|---|
| **Three.js** | Full control, huge ecosystem, industry standard. | Verbose, manual optimization. | Good if custom rendering needed. |
| **React Three Fiber (R3F)** | React-first, declarative, strong ecosystem, excellent with Next.js client components. | Requires "use client". | **Top recommendation**. |
| **Drei** | Helpers (OrbitControls, GLTF loading, environment maps, text, HTML overlays). | Adds abstraction. | Use alongside R3F. |
| **Spline** | Fast scene creation, designer-friendly, embeddable. | Limited runtime control, export constraints. | Good for simple hero/interactive scenes. |
| **Babylon.js** | Feature-rich, game-engine-like. | Heavier learning curve, larger bundle. | Good for complex simulations. |
| **Unity WebGL** | Highest fidelity, physics, animation. | Huge bundle, slow load, mobile issues. | Overkill unless game-like experience. |

### Recommendation
**React Three Fiber + Three.js + Drei** for the dashboard.
- Render 3D office floor plan with interactive desks/zones.
- Load GLTF/GLB office models from Firebase Storage.
- Use `@react-three/drei` for `<Html>` tags (employee cards, tooltips), `<Environment>`, `<ContactShadows>`, and `<Select>`.

---

## 7. Performance Considerations

| Technique | How |
|---|---|
| **Lazy loading** | Dynamic import canvas: `const OfficeScene = dynamic(() => import("./OfficeScene"), { ssr: false })`. |
| **Instancing** | Use `<Instance>` / `<Instances>` from Drei for repeated geometry (desks, chairs, plants). |
| **Level-of-detail (LOD)** | Swap high-poly models for low-poly based on camera distance. |
| **Texture optimization** | Compress textures (KTX2/Basis Universal), use WebP/AVIF, keep under 2K unless necessary. |
| **Model optimization** | Use Draco-compressed GLB; run models through gltfpack. |
| **Occlusion culling** | Use `@react-three/postprocessing` selectively; avoid overdraw. |
| **Frame rate limits** | Cap updates to active viewport; use `dpr={[1, 2]}` adaptive pixel ratio. |
| **Suspense** | Show skeleton loader while scene/GLTFs fetch. |
| **Web Workers** | Offload heavy GLTF parsing if needed. |

---

## 8. State Management

| Tool | Recommendation |
|---|---|
| **Zustand** | **Primary recommendation**. Minimal, no providers, works great with R3F, async-friendly, excellent TypeScript support. |
| **Redux Toolkit** | Use only if complex middleware, time-travel debugging, or large team conventions require it. |
| **React Context** | Acceptable for theme/auth/user, avoid for high-frequency 3D state. |
| **Jotai / Valtio** | Good alternatives if atomic state or proxy-based reactivity preferred. |

### Suggested split
- **Zustand**: 3D scene state (camera, selected object, hovered employee), UI shell state.
- **React Query / SWR**: Server/Firestore cache layer.
- **Firebase Auth context**: Auth session.

---

## 9. Deployment & CI/CD with Vercel + NestJS/Render + Firebase

### Architecture
Use **Vercel** for the Next.js frontend, **NestJS on Render** for the backend API, and **Firebase** for managed services (Auth, Firestore, Storage, FCM).

```
GitHub Repository
        │
        ├──────────────┐
        ▼              ▼
      Vercel         Render
  - Next.js      - NestJS API
  - 3D dashboard - Auth verification
  - UI panels    - Business logic
        │              │
        │ Firebase SDK │ Firebase Admin SDK
        └───────┬──────┘
                ▼
            Firebase
      - Authentication
      - Cloud Firestore
      - Cloud Storage
      - Cloud Messaging
```

### Why Vercel for Frontend?
- Native, zero-config GitHub integration.
- Best support for Next.js App Router, SSR, API routes, ISR, Edge Functions, and Middleware.
- Automatic preview deployments for every pull request.
- Built-in image optimization and Web Vitals analytics.

### Why NestJS + Render for Backend?
- Structured, scalable API layer with TypeScript.
- Clean separation of business logic from frontend and Firebase services.
- Render free tier lowers initial cost; easy upgrade path.
- Firebase Admin SDK provides secure access to Firestore, Storage, and FCM.

### Firebase Services
- **Firebase Authentication** handles login and issues ID tokens.
- **Cloud Firestore** stores all application data.
- **Cloud Storage** hosts 3D assets, avatars, and logos.
- **Cloud Messaging** delivers push notifications.
- **Firebase Security Rules** act as a second layer of defense for direct client access.

### Recommended Pipeline
1. Push code to GitHub.
2. Vercel automatically builds and deploys the frontend from `apps/web`.
3. Render automatically builds and deploys the NestJS backend from `apps/api`.
4. GitHub Actions optionally deploys Firestore rules and storage rules:
   ```bash
   firebase deploy --only firestore,storage --token "$FIREBASE_TOKEN"
   ```

### Firebase CLI Configuration (`firebase.json`)
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": { "rules": "storage.rules" }
}
```

### Vercel Configuration
- Set `apps/web` as the root directory in Vercel project settings.
- Add environment variables in the Vercel dashboard:
  ```
  NEXT_PUBLIC_API_BASE_URL=https://api.yourapp.com
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
  NEXT_PUBLIC_FIREBASE_APP_ID=
  ```

### Render Configuration
- Build command: `cd apps/api && npm install && npm run build`
- Start command: `cd apps/api && npm run start:prod`
- Add `FIREBASE_SERVICE_ACCOUNT_JSON` as a secret environment variable.

### Preview Deployments
- Vercel creates preview URLs for every pull request automatically.
- Render can deploy preview instances via deploy hooks or Git branches.

### Environment Management
- Store `NEXT_PUBLIC_FIREBASE_*` in `.env.local` for local dev and Vercel dashboard for production/preview.
- Store `FIREBASE_SERVICE_ACCOUNT_JSON` and backend secrets in Render.
- Use Firebase App Check to protect public Firebase services.

> See [`docs/06-nestjs-render-backend.md`](06-nestjs-render-backend.md) for the full NestJS + Render architecture, code examples, and Render free-tier details.

---

## Final Stack Recommendation

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ App Router |
| 3D | React Three Fiber + Three.js + Drei |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| File Storage | Firebase Cloud Storage |
| Notifications | Firebase Cloud Messaging |
| Backend API | NestJS on Render |
| Frontend Hosting | Vercel (GitHub-connected auto-deploys) |
| State | Zustand + TanStack Query/SWR |
| Styling | Tailwind CSS + shadcn/ui |
| CI/CD | GitHub → Vercel (frontend); GitHub → Render (backend) |
| Monitoring | Vercel Analytics + Firebase Performance Monitoring |
