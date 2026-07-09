# Scalable Data Model & Real-Time Architecture

**Context:** Akhlaq Ventures 3D Dashboard — production data architecture using Firestore + NestJS.

---

## 1. Firestore Schema Design for Scale

### Collection / Subcollection Strategy

| Level | Pattern | Rationale |
|---|---|---|
| `companies` | Root collection | Top-level tenant boundary |
| `subsidiaries` | Root collection with `companyId` | Avoid deep nesting; query across subsidiaries |
| `departments` | Root collection with `companyId`, `subsidiaryId` | Filter without collection-group query |
| `employees` | Root collection with `companyId`, `subsidiaryId`, `departmentId` | Large, frequently queried |
| `projects` | Root collection with `companyId`, `subsidiaryId`, `departmentId` | Rich filtering + pagination |
| `tasks` | Subcollection under `projects/{id}/tasks` | Natural containment; avoids huge root list |
| `activity` | Root collection + subcollection per user/project | Feed fan-out target |

### Key Rules
- Prefer **root collections** for entities that need cross-parent queries.
- Use **subcollections** for tightly scoped child data.
- Limit document size to **1 MB**; store arrays/summaries only when small.
- Model reads ahead of writes.

### Denormalization Strategies
- **Reference + snapshot fields**: store `projectId`, `projectName`, `projectStatus` on a task to avoid joins.
- **Counters**: maintain `taskCount`, `completedTaskCount`, `memberCount` on project/department docs.
- **Read-optimized views**: duplicate employee name/avatar on task docs, activity events.
- **Reverse indexes**: `employeeProjects/{employeeId}/projects`, `projectMembers/{projectId}/employees`.
- Update denormalized fields via NestJS transaction pipelines or Cloud Functions.

---

## 2. Org Hierarchy Modeling

### Flattened Hierarchy with Path Fields

```ts
interface Employee {
  id: string;
  companyId: string;          // "akhlaq-ventures"
  subsidiaryId: string;       // "xenbus" | "xenbite" | null
  departmentId: string;
  role: 'admin' | 'manager' | 'member';
  orgPath: string;            // "akhlaq-ventures/xenbus/engineering"
}
```

### Query Strategies
- Filter by exact IDs: `where('companyId', '==', id)`.
- Filter by subsidiary: `where('subsidiaryId', '==', id)`.
- Department roll-up: `where('companyId', '==', id).where('departmentId', 'in', ids)`.
- Hierarchical reports: store `managerId` and use recursive client/NestJS traversal.

### Access Control
- Use Firestore Security Rules with `resource.data.companyId == request.auth.token.companyId`.
- Encode tenant + role in **Firebase Custom Claims** via NestJS Admin SDK.

---

## 3. Pagination & Cursor-Based Queries

### Cursor Pagination (Avoid `offset`)

```ts
const q = db.collection('projects')
  .where('companyId', '==', companyId)
  .orderBy('updatedAt', 'desc')
  .orderBy(firestore.FieldPath.documentId())
  .startAfter(lastUpdatedAt, lastDocId)
  .limit(25);
```

### Best Practices
- Always include `__name__` as secondary orderBy for tie-breaking.
- Firestore allows only **one** array-typed condition per query.
- Use **composite indexes** for all sorted/filtered combinations.
- For numbered UIs, return `hasNextPage` by fetching `limit + 1`.

---

## 4. Real-Time Listener Strategy

### Use `onSnapshot` When
- User is viewing a **small, bounded dataset**:
  - Current project tasks
  - Department member status
  - Live activity feed (limited to recent N items)
- Low-latency updates are required.

### Use REST via NestJS When
- One-time data fetch:
  - Directory search results
  - KPI dashboards on first load
  - Large paginated lists
- Data changes infrequently.

### Anti-Patterns
- Do **not** attach a global listener to `employees` or `activity` at company level.
- Detach listeners on route change / component unmount.

---

## 5. Presence System at Scale

### Recommended: Firebase Realtime Database + Firestore Mirror

Firestore `onSnapshot` is expensive for high-frequency presence.

```json
// realtime database
status/{companyId}/{employeeId} = {
  "state": "online" | "away" | "busy",
  "lastChanged": 1710000000000
}
```

### Architecture
1. Client writes presence to **Realtime Database** on connect/disconnect using `onDisconnect`.
2. Cloud Function mirrors last-known status to Firestore `employees/{id}/presence` periodically.
3. Dashboard reads Firestore presence for display.
4. Heartbeat every **30–60s**; mark away after inactivity.

### Scaling Tips
- Shard by `companyId` to avoid hot paths.
- Use Realtime Database **multiple databases** for very large orgs.
- TTL / Cloud Scheduler cleans stale statuses.

---

## 6. Activity Feed Architecture

### Hybrid Fan-Out + Pull Model

#### Company-wide / Department Feeds (Pull-Based)
```ts
db.collection('activity')
  .where('companyId', '==', companyId)
  .where('audience', 'array-contains', userId)
  .orderBy('createdAt', 'desc')
  .limit(50);
```

#### User-Specific Feeds (Fan-Out)
- Cloud Function writes activity to `users/{userId}/feed/{activityId}` for direct notifications.
- Fan-out limited to small blast radius (team, project members).

### Scaling
- Pre-filter by `companyId` to avoid cross-tenant scanning.
- Use **timeline shards** (`feed_2024_06`) if feed volume exceeds query performance.
- Aggregations (unread counts) stored per user.

---

## 7. Aggregations at Scale

### Counter Strategy
Use distributed counters for high-write metrics:
```ts
// projectCounters/{projectId}/shards/{0..9}
{ completedTasks: 3, totalTasks: 5 }
```

### Where to Aggregate
| Use Case | Implementation |
|---|---|
| Live project progress bar | NestJS or Cloud Function updates `Project.completedTaskCount` |
| Headcount by dept | Scheduled Cloud Function / BigQuery |
| KPI dashboard | Pre-aggregated doc `companyMetrics/{companyId}` updated hourly |
| Ad-hoc analytics | Export to **BigQuery** via Firebase Extension |

### Client-Side vs Server-Side
- **Client-side**: only for derived values from already-loaded docs.
- **NestJS backend**: for permission-gated, business-rule aggregations.
- **BigQuery / Looker Studio**: historical KPIs, not live queries.

---

## 8. Search Functionality

### Firestore Limitations
- No full-text search.
- `>=`/`<=` text filters require exact prefix only.
- Cannot combine text search with range filters easily.

### Recommended Alternatives
| Engine | Best For | Notes |
|---|---|---|
| **Algolia** | Best UX, instant search | Higher cost; managed |
| **Typesense** | Open-source, fast | Good for medium scale |
| **Meilisearch** | Developer-friendly | Easy deploy |

### Sync Architecture
```
Firestore onWrite
    ↓
Cloud Function / NestJS
    ↓
Search Index (Algolia / Typesense / Meilisearch)
```

Enforce tenant isolation via search API keys scoped by `companyId`.

---

## 9. Caching Strategies

### Redis on Render
- Cache frequently read, rarely mutated data:
  - Org tree
  - Company settings
  - Aggregated KPIs
- Use short TTLs for live dashboards.
- Use Redis for rate limiting and NestJS session/API-key store.

### CDN Caching
- Static assets, exported reports, generated images.

### TanStack Query Caching
```ts
useQuery({
  queryKey: ['projects', companyId, page],
  queryFn: fetchProjects,
  staleTime: 30_000,
  gcTime: 5 * 60_000,
});
```

---

## 10. Multi-Tenancy

### Tenant Isolation
- Every document contains `companyId` (and optionally `subsidiaryId`).
- Composite indexes include `companyId` first.
- Firestore Rules check `resource.data.companyId == request.auth.token.companyId`.

### Subsidiary-Level Isolation
- Custom claim `subsidiaryIds: string[]`.
- Rules check `request.auth.token.subsidiaryIds.hasAny(resource.data.subsidiaryIds)`.

### Shared vs Separate Firebase Projects
| Approach | When |
|---|---|
| Single Firebase project with tenant tags | Recommended for Akhlaq Ventures + Xenbus/Xenbite |
| Separate Firebase projects | Required for strong isolation / regulatory separation |

---

## 11. Backup, Export & Disaster Recovery

### Automated Backups
- Enable **Firestore managed backups**.
- Schedule exports via `gcloud firestore export` + Cloud Scheduler.

```bash
gcloud firestore export gs://akhlaq-ventures-backups/firestore/$(date +%Y%m%d)
```

### Disaster Recovery
- Test restores quarterly into a separate Firebase project.
- Use Firebase Extensions for BigQuery sync.
- Document RTO/RPO targets.

---

## Summary Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NestJS Backend (Render)                  │
│  REST API  │  Cloud Functions  │  Admin SDK  │  Redis Cache │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  ┌───────────┐        ┌────────────┐        ┌──────────────┐
  │ Firestore │        │  Realtime  │        │ Search Index │
  │  (data)   │        │  Database  │        │Algolia/Types │
  └───────────┘        │ (presence) │        │  ense/Meili  │
        │              └────────────┘        └──────────────┘
        ▼
   BigQuery / GCS
 (analytics + backups)
```
