# Product Requirements Document (PRD)

## Akhlaq Ventures — 3D Company Dashboard

**Version:** 2.0  
**Date:** July 8, 2026  
**Status:** Production-Ready Draft — Architecture Finalized  

---

## 1. Executive Summary

Akhlaq Ventures is the parent company of two subsidiaries: **Xenbus** and **Xenbite**. This product is a **realistic 3D company dashboard** that visualizes the entire organization — parent company, subsidiaries, departments, projects, and employees — inside an interactive 3D office environment.

Users enter a 3D office space where they can:
- View the **Akhlaq Ventures** headquarters and see an overview of the whole group.
- Navigate to subsidiary offices (**Xenbus** / **Xenbite**) and see subsidiary-specific details.
- Walk through rooms representing departments and teams.
- Click on employees working at desks to view their profile, role, current projects, and activity.
- Access different portals and data based on their role (Owner, Admin, Manager, Employee, Visitor).

The dashboard is built as a **production-grade system**: **Next.js** on Vercel for the frontend, **NestJS** on Render for the backend API, **Firebase** for auth/database/storage/messaging, and **React Three Fiber / Three.js** for the 3D experience. It is architected to scale from the Akhlaq Ventures group down through subsidiaries, departments, and hundreds of employees, with hierarchy-aware navigation, real-time data, role-based access control, and enterprise security.

---

## 2. Vision & Objectives

### Vision
Create a single, immersive command center where anyone in Akhlaq Ventures can understand the company structure, see who is doing what, and access company, subsidiary, and employee information at a glance.

### Objectives
1. Provide a **visual org chart** and company explorer in 3D space.
2. Surface **company, subsidiary, department, project, and employee data** in one dashboard.
3. Support **realistic IT industry hierarchy** (CEO, CTO, managers, engineers, security/SOC teams, HR, finance, etc.).
4. Enable **role-based portals** so Owners, Admins, Managers, Employees, and Visitors see appropriate data.
5. Integrate with real tools where possible (Slack, Jira, GitHub, HRMS, calendar).
6. Deliver a **performant, secure, and accessible** 3D experience across desktop and mobile.
7. Build on a **production-ready architecture** that scales with company growth.

---

## 3. Target Users & Personas

| Persona | Role in System | What They Need |
|---|---|---|
| **Owner / CEO** | `owner` | Full group overview, financial and operational KPIs, ability to manage all companies and users. |
| **Admin / IT Admin** | `admin` | User management, role assignment, security settings, company configuration. |
| **Manager / Department Head** | `manager` | Subsidiary/department view, team performance, project status, direct reports. |
| **Employee** | `employee` | Self-profile, current tasks/projects, team directory, company announcements. |
| **Visitor / Client** | `visitor` | Public-facing overview of Akhlaq Ventures, Xenbus, and Xenbite; no sensitive data. |

---

## 4. Product Scope

### In Scope (Production V1)
- Login system with Firebase Authentication, MFA for privileged roles, and session management.
- Role-based access control (Owner, Admin, Manager, Employee, Visitor) enforced server-side in NestJS.
- 3D office scene for Akhlaq Ventures headquarters with scalable room/wing architecture.
- Two subsidiary zones/offices: **Xenbus** and **Xenbite**.
- Department rooms (Engineering, Product, Security/SOC, HR, Sales, Finance, Legal, etc.).
- Many employee desks with clickable avatars, instancing, LOD, and progressive loading.
- Employee detail panel on click.
- Company overview panel (Akhlaq Ventures group level).
- Subsidiary detail panel when a subsidiary is selected.
- Project and activity feed display with pagination and search.
- Firestore database for users, companies, subsidiaries, departments, projects, tasks.
- Redis caching on Render for frequently accessed data.
- Real-time presence system (online/away/busy) using Firebase Realtime Database + Firestore mirror.
- Push notifications via Firebase Cloud Messaging.
- Full-text search for employees, projects, and departments (Algolia/Typesense/Meilisearch).
- Admin panel for user/company/department/project management.
- Audit logging for security and compliance.
- Responsive 2D fallback view for accessibility and low-end devices.
- Production deployment pipeline with dev/staging/prod environments.

### Out of Scope (Future Phases)
- Native mobile apps (iOS/Android).
- Spatial audio or video conferencing.
- Advanced BI/executive reporting with BigQuery.
- AI-powered assistant or natural language search.
- VR/AR support.

---

## 5. Company Context

### Akhlaq Ventures
- **Type:** Parent company / holding company.
- **Subsidiaries:** Xenbus, Xenbite.
- **Mission:** To build and operate technology companies across different verticals.
- **Dashboard role:** Group-level view showing all subsidiaries, shared services, and consolidated metrics.

### Xenbus
- **Type:** Subsidiary.
- **Focus area:** To be defined (e.g., cloud infrastructure, SaaS products, IT services).
- **Dashboard role:** Subsidiary-level view with its own team, projects, and KPIs.

### Xenbite
- **Type:** Subsidiary.
- **Focus area:** To be defined (e.g., cybersecurity, AI/ML, digital services).
- **Dashboard role:** Subsidiary-level view with its own team, projects, and KPIs.

> **Open question:** Define the exact focus areas, services, and brand identities of Xenbus and Xenbite. This affects room design, department structure, sample data, and dashboard copy.

---

## 6. 3D Dashboard Experience

### Scene Hierarchy

```
Akhlaq Ventures Building (Group View)
├── Lobby / Welcome Area
│   └── Company overview kiosk
├── Xenbus Office
│   ├── Department Rooms
│   │   └── Desks with Employees
├── Xenbite Office
│   ├── Department Rooms
│   │   └── Desks with Employees
└── Shared Services (HR, Finance, Legal, IT Support)
    └── Department Rooms
        └── Desks with Employees
```

### Navigation Levels

1. **Group View (Akhlaq Ventures)**
   - Bird’s-eye or exterior view of the building.
   - Click a wing/zone to enter a subsidiary or shared services area.
   - Side panel shows group-level metrics.

2. **Subsidiary View (Xenbus / Xenbite)**
   - Focused view of the subsidiary office.
   - Shows subsidiary name, focus area, headcount, active projects, recent updates.
   - Click a department room to enter.

3. **Department View**
   - Room with multiple desks.
   - Shows department head, team members, current initiatives, KPIs.
   - Click a desk/employee to view profile.

4. **Employee Detail View**
   - Camera zooms to the selected desk.
   - Side panel displays full employee profile.

### Initial Production Scene
The first shipped scene is a single open-plan office wing with:
- 5 representative desks for the launch demo.
- Each desk belongs to a department/subsidiary.
- Clicking an employee opens a detail panel.
- A top navigation bar lets the user switch between Akhlaq Ventures, Xenbus, and Xenbite views.

The scene is built on the production chunking/instancing architecture so adding more employees, rooms, and floors does not require re-architecting.

---

## 7. Information Architecture & Data Hierarchy

The dashboard surfaces data at five levels:

```
Company Group (Akhlaq Ventures)
└── Subsidiaries (Xenbus, Xenbite)
    └── Departments (Engineering, Product, Security/SOC, HR, Sales, etc.)
        └── Employees
            └── Projects & Tasks
```

### Data Shown at Each Level

#### Group Level (Akhlaq Ventures)
- Company name, logo, tagline, founded date, website.
- List of subsidiaries.
- Total headcount, open roles.
- Active projects across all subsidiaries.
- Recent company-wide announcements.

#### Subsidiary Level (Xenbus / Xenbite)
- Subsidiary name, focus area, description.
- Subsidiary head / General Manager.
- Team size and department breakdown.
- Active projects and clients.
- Performance highlights.

#### Department Level
- Department name and head.
- Team members at desks.
- Current initiatives / OKRs.
- Key metrics (e.g., sprint velocity for Engineering, ticket SLA for Support).

#### Employee Level
- Name, role, level, department, subsidiary.
- Manager and reporting line.
- Skills, certifications.
- Contact info and timezone.
- Current projects and allocation.
- Recent tasks / activity.
- Availability status (online, away, busy).

#### Project Level
- Project name, client, status, progress %.
- Team members, milestones, tech stack.
- Timeline and budget (visible based on role).

---

## 8. Detailed Features

### 8.1 Authentication & Login
- Email/password login via Firebase Authentication.
- Optional Google Workspace / SSO login.
- Password reset flow.
- Session persistence.

### 8.2 Role-Based Portals
- After login, users are routed based on role:
  - **Owner / Admin:** Full dashboard + admin panel.
  - **Manager:** Department/subsidiary view + team management.
  - **Employee:** Personal profile + team view.
  - **Visitor:** Read-only group/subsidiary overview.

### 8.3 3D Office Navigation
- Interactive 3D office scene rendered with React Three Fiber.
- Orbit controls (rotate, zoom, pan) with damping.
- Clickable zones: building, subsidiary, room, desk, employee.
- Smooth camera transitions between levels.
- Breadcrumb navigation: `Akhlaq Ventures > Xenbus > Engineering > Jordan Patel`.
- Deep-linking via URL query parameters.

### 8.4 Employee Detail Panel
- Slide-out side panel (not a 3D tooltip).
- Tabs: Profile, Projects, Activity.
- Editable by the employee or admin (based on role).
- Shows current status, skills, certifications, manager, recent tasks.

### 8.5 Company & Subsidiary Panels
- Group overview panel with subsidiaries and consolidated metrics.
- Subsidiary panel with focus area, team, projects, and news.
- Accessible from both 3D scene and top navigation.

### 8.6 Project & Activity Feed
- List of active projects per subsidiary/department.
- Activity feed: new hires, project launches, completed milestones, announcements.
- Role-aware: sensitive budget/financial data hidden from Employees and Visitors.

### 8.7 Admin Panel
- Manage users, roles, subsidiaries, departments, projects.
- Assign employees to subsidiaries/departments/managers.
- Upload company logos and 3D assets.
- View audit logs (future).

### 8.8 2D Fallback View
- Toggle between 3D office view and 2D hierarchical list view.
- Ensures accessibility and performance on low-end devices.
- Keyboard-navigable.

---

## 9. User Flows

### 9.1 Owner Logs In and Explores Group

```
Login → Owner Dashboard → 3D Group View
├── Click Xenbus → Subsidiary View → View projects/team
├── Click Xenbite → Subsidiary View → View projects/team
├── Click an employee desk → Employee Detail Panel
└── Open Admin Panel → Manage users/roles
```

### 9.2 Manager Views Their Team

```
Login → Manager Dashboard → Subsidiary View (e.g., Xenbus)
├── Click Engineering Room → Department View
├── Click employee desk → Profile / Projects / Tasks
└── View project status and team KPIs
```

### 9.3 Employee Views Own Profile

```
Login → Employee Dashboard → Own desk highlighted
├── View/edit own profile
├── View assigned projects and tasks
└── View team/department members
```

### 9.4 Visitor Views Public Overview

```
Visit public URL → Group View (read-only)
├── Click Xenbus/Xenbite → Public subsidiary overview
├── Click employee → Limited public profile
└── No access to projects, finances, or contact details
```

---

## 10. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | Web application framework, routing, layouts. |
| **Language** | TypeScript | Type safety across frontend and data models. |
| **3D Rendering** | React Three Fiber + Three.js + Drei | Interactive 3D office scene. |
| **Authentication** | Firebase Authentication | Login, SSO, password reset, ID tokens. |
| **Database** | Cloud Firestore | Users, companies, subsidiaries, departments, projects, tasks. |
| **File Storage** | Firebase Storage | 3D models, avatars, logos, textures. |
| **Notifications** | Firebase Cloud Messaging | Push notifications for announcements and alerts. |
| **Backend API** | NestJS on Render | Business logic, auth verification, role enforcement, aggregations. |
| **Frontend Hosting** | Vercel | Deployment, CDN, GitHub auto-deploys, preview environments. |
| **State Management** | Zustand | 3D scene state, UI state, selection. |
| **Data Fetching** | TanStack Query / SWR + NestJS API | REST API calls; Firestore listeners only for real-time features. |
| **Caching** | Redis on Render | Session cache, org tree, KPIs, rate limiting. |
| **Search** | Algolia / Typesense / Meilisearch | Full-text search for employees, projects, departments. |
| **Real-Time Presence** | Firebase Realtime Database + Firestore mirror | Scalable online/away/busy status. |
| **Styling** | Tailwind CSS + shadcn/ui | UI components and responsive layout. |
| **Animation** | Framer Motion / @react-spring/three | Camera transitions, UI animations. |
| **CI/CD** | GitHub → Vercel (frontend); GitHub → Render (backend) | Auto-deploy frontend and backend on every push. |
| **Monitoring** | Sentry + Vercel Analytics + Render logs | Error tracking, Web Vitals, infrastructure logs. |

### Rationale
- **Next.js App Router** provides modern React patterns and is a good fit for dashboard shells with client 3D scenes.
- **Firebase** provides managed auth, database, storage, and messaging without backend database setup.
- **NestJS on Render** gives a structured, scalable API layer for business logic, role enforcement, RBAC, audit logging, and third-party integrations.
- **Vercel** is the optimal host for Next.js because it offers native GitHub integration, automatic preview deployments, and first-class support for SSR, API routes, ISR, and Edge features.
- **Tailwind CSS + shadcn/ui** provide a fast, consistent, and accessible component system.
- **Redis** reduces Firestore reads and enables rate limiting and session caching.
- **Dedicated search engine** overcomes Firestore's lack of full-text search.
- **React Three Fiber** is the most mature React-first 3D library and integrates cleanly with Next.js client components.

> See [`docs/05-firebase-hosting-vs-vercel.md`](docs/05-firebase-hosting-vs-vercel.md) for the deployment comparison, [`docs/06-nestjs-render-backend.md`](docs/06-nestjs-render-backend.md) for the NestJS + Render architecture, [`docs/07-production-deployment.md`](docs/07-production-deployment.md) for production deployment, [`docs/08-scalable-data-architecture.md`](docs/08-scalable-data-architecture.md) for data scaling, [`docs/09-security-compliance.md`](docs/09-security-compliance.md) for security, and [`docs/10-production-3d-architecture.md`](docs/10-production-3d-architecture.md) for 3D scaling.

### Data Flow & API Communication

```
Next.js Frontend (Vercel)
        │
        │ HTTPS / REST / WebSocket
        ▼
    NestJS API (Render)
        │
        ├── Redis Cache
        │
        ├── Search Engine (Algolia/Typesense/Meilisearch)
        │
        │ Firebase Admin SDK
        ▼
    Firebase Services
  - Authentication (verify ID tokens)
  - Cloud Firestore (read/write data)
  - Realtime Database (presence heartbeats)
  - Cloud Storage (assets)
  - Cloud Messaging (notifications)
```

- The frontend calls the **NestJS API** for most data operations.
- **Redis** caches frequently read data (org tree, settings, KPIs) and supports rate limiting.
- **Search engine** indexes employees, projects, and departments for full-text search.
- **Firebase Auth** handles login on the client and issues ID tokens.
- **NestJS verifies** every ID token via Firebase Admin SDK and enforces role-based permissions.
- **Firestore client listeners** are used only for bounded real-time features such as activity feeds.
- **Firebase Realtime Database** handles high-frequency presence heartbeats, mirrored to Firestore for display.
- All Firestore Security Rules remain in place as a defense-in-depth layer.

---

## 11. Data Model

Firestore collections and key fields. See [`docs/08-scalable-data-architecture.md`](docs/08-scalable-data-architecture.md) for pagination, denormalization, multi-tenancy, and scaling strategies.

### `companies`
```ts
{
  id: string;
  name: string;              // "Akhlaq Ventures"
  type: "parent";
  logoUrl: string;
  website: string;
  description: string;
  foundedAt: timestamp;
  settings: object;
  ownerId: string;
  createdAt: timestamp;
}
```

### `subsidiaries`
```ts
{
  id: string;
  companyId: string;         // parent company ref
  name: string;              // "Xenbus" or "Xenbite"
  focusArea: string;         // e.g., "Cloud Infrastructure"
  description: string;
  logoUrl: string;
  generalManagerId: string;
  location: { address: string; timezone: string };
  createdAt: timestamp;
}
```

### `departments`
```ts
{
  id: string;
  companyId: string;
  subsidiaryId: string | null;  // null for shared services under parent
  name: string;                 // "Engineering", "Security / SOC", "HR"
  headId: string;               // department head user ref
  description: string;
  color: string;                // hex color for 3D room theming
  createdAt: timestamp;
}
```

### `users`
```ts
{
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: "owner" | "admin" | "manager" | "employee" | "visitor";
  companyId: string;
  subsidiaryIds: string[];
  departmentId: string;
  managerId: string | null;
  title: string;                // "Senior Security Engineer"
  level: string;                // "L5"
  skills: string[];
  certifications: { name: string; expiresAt: timestamp }[];
  bio: string;
  timezone: string;
  phone: string;
  isOnline: boolean;
  lastActiveAt: timestamp;
  presence: {
    state: "online" | "away" | "busy" | "offline";
    lastChanged: timestamp;
  };
  permissions: string[];        // cached RBAC permissions
  createdAt: timestamp;
}
```

### `projects`
```ts
{
  id: string;
  companyId: string;
  subsidiaryId: string;
  departmentId: string;
  name: string;
  client: string;
  status: "planning" | "active" | "at_risk" | "completed" | "archived";
  progress: number;             // 0-100
  startDate: timestamp;
  dueDate: timestamp;
  memberIds: string[];
  techStack: string[];
  budget: number;               // role-gated
  description: string;
  createdAt: timestamp;
}
```

### `tasks`
```ts
{
  id: string;
  projectId: string;
  assigneeId: string;
  title: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "critical";
  dueDate: timestamp;
  completedAt: timestamp | null;
  createdAt: timestamp;
}
```

### `activityLogs`
```ts
{
  id: string;
  companyId: string;
  type: "new_hire" | "project_launch" | "milestone" | "announcement";
  title: string;
  description: string;
  actorId: string;
  createdAt: timestamp;
}
```

---

## 12. Authentication & Authorization

### Roles & Permissions

| Permission | Owner | Admin | Manager | Employee | Visitor |
|---|---|---|---|---|---|
| View group overview | ✅ | ✅ | ✅ | ✅ | ✅ |
| View subsidiary details | ✅ | ✅ | ✅* | ✅* | ✅* |
| View department details | ✅ | ✅ | ✅* | ✅* | ❌ |
| View employee profiles | ✅ | ✅ | ✅* | ✅* | Limited |
| View project details | ✅ | ✅ | ✅* | ✅* | ❌ |
| View financials/budget | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit other users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage roles/subsidiaries | ✅ | ✅ | ❌ | ❌ | ❌ |
| Access admin panel | ✅ | ✅ | ❌ | ❌ | ❌ |

`*` Limited to assigned subsidiary/department.

### Implementation
- Frontend uses Firebase Auth for login and obtains an ID token.
- NestJS backend verifies the Firebase ID token via Firebase Admin SDK on every protected request.
- NestJS reads user role and companyId from Firestore and enforces RBAC in controllers and services.
- Firestore Security Rules act as a second layer, ensuring direct client access is also restricted.
- Next.js Middleware (`middleware.ts`) checks for a valid session/token; role checks happen in server fetches or client guards.
- Reusable `<Can permission="...">` component for UI gating.

---

## 13. 3D Scene Design

### Visual Style Recommendation
Start with a **clean low-poly 3D office** style. It is performant, professional, and easy to theme by department/subsidiary. Avoid hyper-realistic assets for the MVP due to load times and complexity.

### Scene Components
- **Building shell** — outer walls, floor, glass partitions.
- **Subsidiary zones** — color-coded areas or separate wings.
- **Department rooms** — enclosed or open-plan zones with signage.
- **Desks** — repeated instanced geometry.
- **Employee avatars** — low-poly characters or photo billboards with status rings.
- **Info kiosks** — 3D screens showing company/subsidiary highlights.
- **Camera rig** — animated transitions between overview and focus states.

### Interaction Details
- Hover over desk: highlight + show name tooltip.
- Click desk: zoom camera, open detail panel.
- Click subsidiary zone: transition to subsidiary view.
- Drag to orbit, scroll to zoom, right-click to pan.
- ESC or back button returns to previous level.

### Performance Targets
- First contentful paint < 1.5s on desktop, < 3s on mobile.
- Time to interactive < 3s on desktop, < 5s on mobile.
- 3D scene target 60fps on mid-range desktop, 30fps on mobile.
- Memory usage < 200 MB desktop, < 100 MB mobile.
- Use instancing, LOD, Draco-compressed GLB models, and texture atlases.
- Progressive chunk loading; only visible rooms load in detail.
- Provide adaptive quality (low/medium/high) based on device capability.

---

## 14. UI/UX Requirements

### Layout
- **Header:** Logo, company/subsidiary switcher, user menu, 2D/3D toggle, notifications.
- **Left sidebar (collapsible):** Breadcrumb navigation, quick links, department list.
- **Main area:** 3D scene or 2D fallback view.
- **Right panel:** Contextual details (company, subsidiary, employee, project).

### Navigation
- Breadcrumbs must reflect current 3D location.
- Persistent top-level switches: Akhlaq Ventures | Xenbus | Xenbite.
- Keyboard shortcuts: `Esc` to zoom out, `Tab` to focus next interactive object, `Enter` to select.

### Responsive Design
- 3D scene is primary on desktop.
- On mobile/tablet, default to 2D hierarchical view with optional lightweight 3D preview.
- Panels adapt to screen width.

### Accessibility
- 2D fallback view is required.
- All 3D interactions have keyboard equivalents.
- Respect `prefers-reduced-motion`.
- Sufficient color contrast; do not rely on color alone for status.
- `aria-live` regions for selection changes and loading states.

---

## 15. Non-Functional Requirements

### Performance
- Lazy-load 3D scene and assets; load chunks progressively.
- Debounce and throttle real-time updates in the 3D view.
- Use Next.js dynamic imports with `ssr: false` for the canvas.
- Cache API responses with TanStack Query and Redis.
- Optimize assets: Draco GLB, KTX2 textures, texture atlases, instancing.

### Security
- All API access controlled and logged by the NestJS backend.
- NestJS verifies Firebase ID tokens and enforces RBAC on every protected route.
- MFA enforced for Owner, Admin, and SOC/Finance roles.
- Firestore Security Rules act as a second layer of defense.
- No sensitive employee or financial data exposed to Visitors.
- Enable Firebase App Check for production.
- Role changes are applied by NestJS via Firebase Admin SDK and reflected in Firestore.
- Audit logs for authentication, authorization, data exports, and admin actions.

### Scalability
- Firestore schema supports adding more subsidiaries, departments, and employees without restructuring.
- 3D scene uses instancing, LOD, and chunking so adding more desks/avatars does not collapse performance.
- Cursor-based pagination for all list endpoints.
- Redis caching for hot reads and rate limiting.
- Dedicated search engine for full-text search.

### Reliability
- Graceful fallback if 3D fails to load (show 2D view automatically).
- Offline indicator if Firestore connection is lost.
- Automated Firestore backups and tested restore procedure.
- Health checks on NestJS `/health` endpoint.
- Error tracking with Sentry on frontend and backend.

### Observability
- Vercel Analytics for Web Vitals.
- Sentry for error tracking and performance monitoring.
- Render logs and Google Cloud Logging for backend/Firebase.
- Uptime monitoring for frontend and backend.
- Alerts for error spikes, latency, and quota usage.

---

## 16. Integrations

### Production V1 Integrations
| System | Data | Priority |
|---|---|---|
| **Firebase Auth** | Login, SSO, MFA | Required |
| **Firebase Realtime Database** | Presence heartbeats | Required |
| **Firebase Cloud Messaging** | Push notifications | Required |

### Phase 2 Integrations (Post-Launch)
| System | Data |
|---|---|
| **Slack / Microsoft Teams** | Presence status, announcements |
| **Jira / Linear / Asana** | Tasks, project progress |
| **GitHub / GitLab** | Code activity, pull requests |
| **Google Calendar / Outlook** | Availability, meetings, OOO |
| **HRMS (BambooHR, Workday)** | Employee profiles, org chart, PTO |
| **Salesforce / HubSpot** | Clients, pipeline, deals |
| **Security tools (Splunk, Sentinel)** | SOC alerts, incidents, vulnerabilities |

Until integrations are live, data is manually entered or seeded via the admin panel.

---

## 17. Milestones & Phases

### Phase 0 — Foundation (Weeks 1–2)
- [ ] Finalize Xenbus and Xenbite focus areas, branding, and department structure.
- [ ] Set up monorepo with Next.js frontend and NestJS backend.
- [ ] Set up Firebase project (Auth, Firestore, Realtime Database, Storage, Cloud Messaging).
- [ ] Set up Vercel (frontend), Render (backend), and Redis.
- [ ] Implement Firebase Auth login, MFA for admins, and NestJS token verification.
- [ ] Create Firestore schema, composite indexes, and seed sample data.

### Phase 1 — 3D Production Scene (Weeks 3–5)
- [ ] Build data-driven 3D office scene with React Three Fiber.
- [ ] Implement instanced desks, avatars, and room chunking.
- [ ] Add LOD, frustum culling, and progressive loading.
- [ ] Implement camera transitions and clickable objects.
- [ ] Build employee detail side panel and group/subsidiary overview panels.
- [ ] Add 5 sample employees across departments.

### Phase 2 — Backend & Data Layer (Weeks 6–7)
- [ ] Build NestJS modules for companies, subsidiaries, departments, employees, projects, tasks.
- [ ] Implement RBAC guards and resource-level permissions.
- [ ] Connect 3D scene to NestJS API; use TanStack Query for caching.
- [ ] Implement pagination, search indexing, and activity feed.
- [ ] Build admin panel for user/company/department/project management.

### Phase 3 — Real-Time & Polish (Weeks 8–9)
- [ ] Implement presence system (Realtime Database → Firestore mirror).
- [ ] Add push notifications via FCM.
- [ ] Build 2D fallback view and accessibility improvements.
- [ ] Performance optimization and mobile responsiveness.
- [ ] Security hardening, audit logging, and penetration testing prep.

### Phase 4 — Launch (Week 10)
- [ ] Staging environment testing and load testing.
- [ ] QA, security review, and production deployment.
- [ ] Deploy frontend to Vercel + backend to Render + Firebase services.
- [ ] Documentation and team onboarding.

### Phase 5 — Scale (Post-Launch)
- [ ] Add more employees, departments, rooms, and floors.
- [ ] Third-party integrations (Slack, Jira, GitHub, HRMS, calendar).
- [ ] Advanced analytics, BI dashboards, and BigQuery export.
- [ ] SOC 2 / ISO 27001 readiness if required.

---

## 18. Success Metrics

| Metric | Target |
|---|---|
| 3D scene load time (desktop) | < 3 seconds |
| 3D scene load time (mobile) | < 5 seconds |
| Time to first meaningful interaction | < 3 seconds desktop, < 5 seconds mobile |
| 3D frame rate (desktop) | 60fps on mid-range GPU |
| API p95 response time | < 200ms |
| Dashboard daily active users (internal) | > 70% of employees |
| Employee profile completeness | > 80% |
| Page crash/error rate | < 0.5% |
| Accessibility audit score | > 90% |
| Firestore read efficiency | < 10 reads per dashboard load |
| Uptime | > 99.9% |

---

## 19. Open Questions & Assumptions

### Assumptions
1. The dashboard will be web-based and used primarily on desktop, with mobile fallback.
2. Initial data will be seeded manually; third-party integrations come after launch.
3. Xenbus and Xenbite each operate as distinct subsidiaries with separate teams and projects.
4. The 5-employee desk scene is the launch demo; the architecture must support scaling to hundreds of employees.

### Open Questions to Resolve
1. What are the exact focus areas/services of Xenbus and Xenbite?
2. Which departments should exist in each subsidiary at launch?
3. Do you have logos, brand colors, and employee photos/avatars ready?
4. Should visitors access the dashboard without login, or is it fully authenticated?
5. What is the budget for 3D assets (custom models vs. stock/low-poly)?
6. Should the dashboard support real-time presence updates in the MVP?
7. Which Firebase plan / region should be used?
8. Which Render plan should be used? Free tier has cold starts after 15 min of inactivity.
9. Do you need mobile/tablet support from day one?

---

## 20. Appendix: Research Documents

Detailed research findings are stored in the `/docs` directory:

- [`docs/01-it-industry-org-structure.md`](docs/01-it-industry-org-structure.md) — Real IT industry hierarchy, departments, roles, security teams.
- [`docs/02-tech-stack-architecture.md`](docs/02-tech-stack-architecture.md) — Next.js + NestJS + Firebase + 3D library recommendations, schema, deployment.
- [`docs/03-dashboard-data-model.md`](docs/03-dashboard-data-model.md) — Company, subsidiary, employee, project, and security data model.
- [`docs/04-3d-dashboard-ux-patterns.md`](docs/04-3d-dashboard-ux-patterns.md) — 3D interaction patterns, performance, accessibility, library stack.
- [`docs/05-firebase-hosting-vs-vercel.md`](docs/05-firebase-hosting-vs-vercel.md) — Deployment platform comparison: Firebase Hosting vs Vercel for Next.js.
- [`docs/06-nestjs-render-backend.md`](docs/06-nestjs-render-backend.md) — NestJS backend on Render + Firebase services architecture.
- [`docs/07-production-deployment.md`](docs/07-production-deployment.md) — Production deployment plans, CI/CD, monitoring, backups.
- [`docs/08-scalable-data-architecture.md`](docs/08-scalable-data-architecture.md) — Scalable Firestore schema, pagination, presence, search, caching.
- [`docs/09-security-compliance.md`](docs/09-security-compliance.md) — Security hardening, RBAC/ABAC, audit logging, compliance.
- [`docs/10-production-3d-architecture.md`](docs/10-production-3d-architecture.md) — Production 3D scene architecture, instancing, LOD, asset pipeline.

---

## 21. Next Steps

1. **Confirm scope and open questions** — especially Xenbus/Xenbite focus areas and branding.
2. **Approve tech stack** — Next.js (Vercel) + NestJS (Render) + Firebase + React Three Fiber.
3. **Create design mockups/wireframes** for the 3D scene and UI panels.
4. **Set up the project repository** and Firebase project.
5. **Seed sample data** for Akhlaq Ventures, Xenbus, Xenbite, and 5 employees.
6. **Begin Phase 0 development**.
