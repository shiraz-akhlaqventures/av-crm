# NestJS Backend on Render + Firebase Services Architecture

**Context:** The Akhlaq Ventures 3D Dashboard uses Next.js on Vercel for the frontend and needs a dedicated backend. This document explains using **NestJS** deployed on **Render** (free tier) as the API layer, while **Firebase** provides Firestore, Cloud Storage, Cloud Messaging, and Authentication.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────┐
│         GitHub Repository                   │
│   /apps/web (Next.js + R3F + Tailwind)      │
│   /apps/api (NestJS)                        │
└──────────────────┬──────────────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌─────────────┐         ┌─────────────┐
│   Vercel    │         │   Render    │
│  (Frontend) │         │  (Backend)  │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │   HTTPS / REST / WS   │
       └───────────┬───────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│                   Firebase                  │
│  - Authentication (Frontend + Admin SDK)    │
│  - Cloud Firestore (Database)               │
│  - Cloud Storage (Assets, avatars)          │
│  - Cloud Messaging (Notifications)          │
└─────────────────────────────────────────────┘
```

---

## 2. Why NestJS + Render?

### Why NestJS?
- **Structured backend:** Modules, controllers, services, guards, and pipes out of the box.
- **TypeScript-first:** Same language as frontend; excellent DX.
- **Scalable architecture:** Follows Angular-inspired patterns that scale well for teams.
- **Built-in features:** Validation, logging, configuration, scheduling, WebSockets, Swagger/OpenAPI docs.
- **Firebase Admin SDK integration:** Easy to connect to Firestore, Storage, FCM, and Auth.
- **Better for complex logic:** Role-based permissions, aggregations, webhooks, and integrations are cleaner than Cloud Functions alone.

### Why Render?
- **Free tier for web services:** Good for prototypes and small MVPs.
- **Git-based deployment:** Push to GitHub → Render auto-deploys.
- **Native support for Node.js/NestJS:** Simple `npm run start:prod` deployment.
- **Automatic HTTPS:** Free SSL certificates.
- **Environment variables:** Built-in secret management.
- **Persistent disks:** Available if needed for file caching or logs.

---

## 3. Service Responsibilities

| Service | Platform | Responsibility |
|---|---|---|
| **Frontend** | Vercel | Next.js app, 3D dashboard UI, client-side Firebase Auth, calls NestJS API. |
| **Backend API** | Render | NestJS REST/WebSocket API, business logic, role enforcement, aggregations, integrations. |
| **Authentication** | Firebase Auth | Login (email/password, Google), ID tokens, user sessions. |
| **Database** | Firestore | Primary data store for users, companies, subsidiaries, departments, projects, tasks. |
| **File Storage** | Cloud Storage | 3D models, avatars, logos, textures, documents. |
| **Notifications** | Cloud Messaging | Push notifications for announcements, task alerts, project updates. |
| **Admin SDK** | NestJS runtime | Backend verifies Firebase tokens and reads/writes Firestore/Storage/FCM. |

---

## 4. Authentication Flow

```
User logs in on Next.js frontend
        │
        ▼
Firebase Auth returns ID token
        │
        ▼
Frontend sends ID token in Authorization header
        │
        ▼
NestJS backend verifies token via Firebase Admin SDK
        │
        ▼
Backend reads user role/permissions from Firestore
        │
        ▼
Backend returns data based on role
```

### Implementation
- Frontend uses Firebase Auth SDK (`signInWithEmailAndPassword`, Google provider).
- After login, attach `Authorization: Bearer <idToken>` to every API request.
- NestJS uses a custom `FirebaseAuthGuard` to verify the token.
- User roles and permissions are stored in Firestore and cached in NestJS for the request.

---

## 5. NestJS API Structure

```
/apps/api
├── src
│   ├── main.ts
│   ├── app.module.ts
│   ├── config
│   │   └── firebase.config.ts
│   ├── firebase
│   │   └── firebase-admin.service.ts
│   ├── auth
│   │   ├── firebase-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── users
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── companies
│   ├── subsidiaries
│   ├── departments
│   ├── projects
│   ├── tasks
│   ├── employees
│   ├── activity-logs
│   └── notifications
│       └── fcm.service.ts
├── test
├── nest-cli.json
├── tsconfig.json
└── package.json
```

### Example Controller

```ts
@Controller('employees')
@UseGuards(FirebaseAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.employeesService.findOne(id, req.user);
  }

  @Post()
  @Roles('owner', 'admin')
  async create(@Body() dto: CreateEmployeeDto, @Req() req: RequestWithUser) {
    return this.employeesService.create(dto, req.user);
  }
}
```

---

## 6. Firebase Admin SDK Setup in NestJS

### Install
```bash
npm install firebase-admin
```

### Service Account
1. In Firebase Console → Project Settings → Service Accounts → Generate new private key.
2. Download the JSON key.
3. Store it as a single-line JSON string in Render environment variables (`FIREBASE_SERVICE_ACCOUNT_JSON`).
4. In `main.ts` or a config module, initialize the admin SDK:

```ts
import { initializeApp, cert } from 'firebase-admin/app';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string,
);

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
```

### Using Firestore in NestJS
```ts
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();
const user = await db.collection('users').doc(userId).get();
```

### Using Storage in NestJS
```ts
import { getStorage } from 'firebase-admin/storage';

const bucket = getStorage().bucket();
```

### Using FCM in NestJS
```ts
import { getMessaging } from 'firebase-admin/messaging';

await getMessaging().send({
  token: deviceToken,
  notification: { title: 'Update', body: 'New project assigned.' },
});
```

---

## 7. Communication Between Frontend and Backend

### REST API
- Next.js client calls `https://api.yourapp.com/employees/:id`.
- NestJS handles business logic and Firebase interactions.
- JSON responses for dashboard data.

### Real-Time Updates
| Approach | Use Case |
|---|---|
| **Firestore client listeners** | Real-time employee status, project progress, activity feed. |
| **NestJS WebSockets** | Real-time backend events (notifications, live dashboard updates). |
| **Server-Sent Events (SSE)** | One-way real-time streams (activity feed, alerts). |

**Recommendation:** Use Firestore client listeners for data that lives in Firestore. Use NestJS WebSockets or SSE for backend-generated events (e.g., "new notification").

---

## 8. Render Free Tier — Important Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| **Web services sleep after 15 min of inactivity** | First request after idle takes 30+ seconds to wake up. | Use Render paid plan for production; or ping service periodically (not ideal). |
| **512 MB RAM** | Limited for heavy processing or large Firebase payloads. | Paginate queries; optimize payloads; offload heavy work. |
| **0.1 CPU** | Slower builds and request handling. | Keep endpoints lightweight; cache aggressively. |
| **Free PostgreSQL expires after 90 days** | Not relevant if using Firestore. | Use Firestore as primary database. |
| **Custom domains** | Supported on free web services. | Add custom domain in Render dashboard. |
| **Build time limits** | Builds must complete within free-tier limits. | Keep dependencies lean. |

**Note:** Render free tier is excellent for development and demos. For production with many users, upgrade to a paid plan to avoid cold starts.

---

## 9. Project Structure (Monorepo)

Recommended structure if using a single GitHub repo for both frontend and backend:

```
/akhlaq-ventures-dashboard
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   ├── package.json
│   │   └── next.config.js
│   └── api/                 # NestJS backend
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared-types/        # Shared TypeScript types/interfaces
├── package.json             # Root with workspace config
├── turbo.json               # Turborepo config for builds
└── README.md
```

### Build Commands
- Web: `cd apps/web && npm run build`
- API: `cd apps/api && npm run build && npm run start:prod`

### Vercel Root Directory
Set `apps/web` as the root directory in Vercel project settings.

### Render Build Settings
- **Build Command:** `cd apps/api && npm install && npm run build`
- **Start Command:** `cd apps/api && npm run start:prod`
- **Environment:** Node.js

---

## 10. CI/CD Pipeline

### Vercel (Frontend)
1. Push to GitHub.
2. Vercel auto-detects changes in `apps/web`.
3. Builds and deploys preview/production.

### Render (Backend)
1. Push to GitHub.
2. Render auto-detects changes in root or specified directory.
3. Builds and deploys the NestJS service.

### Manual/Optional GitHub Actions
For full control, use GitHub Actions:

```yaml
name: Deploy API
on:
  push:
    branches: [main]
    paths: ['apps/api/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd apps/api && npm ci && npm run build
      # Render deploy hook or render-cli can be triggered here
```

---

## 11. Environment Variables

### Frontend (Vercel)
```
NEXT_PUBLIC_API_BASE_URL=https://api.yourapp.com
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Backend (Render)
```
PORT=3001
FIREBASE_SERVICE_ACCOUNT_JSON={...}
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
# Optional
ALLOWED_ORIGINS=https://yourapp.vercel.app
```

---

## 12. Pros and Cons of This Architecture

### Pros
- **Clean separation** between frontend, backend, and Firebase services.
- **NestJS** provides a robust, maintainable backend structure.
- **Render free tier** lowers initial infrastructure cost.
- **Vercel** gives the best Next.js deployment experience.
- **Firebase** handles auth, database, storage, and messaging without backend setup.
- Easier to add complex business logic, integrations, and admin operations.
- Better testability and type safety across the stack.

### Cons
- **Render free tier cold starts** can make the API slow after inactivity.
- More moving parts than a pure Firebase/Cloud Functions setup.
- Need to manage CORS, environment variables, and deployment separately.
- Need to secure both NestJS API and Firebase Security Rules.
- Firebase Admin SDK credentials must be protected carefully.

---

## 13. Security Checklist

- [ ] Store `FIREBASE_SERVICE_ACCOUNT_JSON` as a secret in Render.
- [ ] Never expose service account keys in frontend code or repos.
- [ ] Verify Firebase ID tokens in every protected NestJS route.
- [ ] Enforce role-based access in NestJS controllers and services.
- [ ] Configure Firestore Security Rules as a second layer of defense.
- [ ] Set CORS `ALLOWED_ORIGINS` to only your Vercel domain(s).
- [ ] Enable Firebase App Check to protect public Firebase services.
- [ ] Validate all DTOs using `class-validator` in NestJS.
- [ ] Rate-limit public endpoints.

---

## 14. Summary

| Layer | Platform | Technology |
|---|---|---|
| **Frontend** | Vercel | Next.js + React Three Fiber + Tailwind CSS + shadcn/ui |
| **Backend API** | Render | NestJS + Firebase Admin SDK |
| **Authentication** | Firebase | Firebase Auth |
| **Database** | Firebase | Cloud Firestore |
| **File Storage** | Firebase | Cloud Storage |
| **Notifications** | Firebase | Cloud Messaging (FCM) |
| **CI/CD** | GitHub → Vercel/Render | Auto-deploy on push |

This architecture gives a modern, scalable, and cost-effective foundation for the MVP. Upgrade Render to a paid plan when cold starts or resource limits become a problem.
