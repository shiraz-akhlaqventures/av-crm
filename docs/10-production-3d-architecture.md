# Production-Ready 3D Dashboard Architecture

**Context:** Akhlaq Ventures 3D Dashboard — scaling the React Three Fiber / Three.js office scene to support many employees, departments, and subsidiaries in production.

---

## 1. Core Design Shift: From Static Scene to Data-Driven World

A production dashboard is not a single loaded 3D file. It is a **data-driven, progressively loaded virtual office** where rooms, desks, and employees are generated from backend data.

Key principles:
- **Generate, don't model:** desks, avatars, and rooms are instantiated from data.
- **Load on demand:** only visible areas are loaded in detail.
- **Optimize aggressively:** instancing, LOD, culling, compression.
- **Decouple data from rendering:** Zustand holds scene state; R3F renders efficiently.

---

## 2. Scene Architecture for Scale

### Spatial Partitioning

Organize the 3D world by hierarchy:

```
World
├── Building (Akhlaq Ventures)
│   ├── Floor / Wing (Xenbus)
│   │   ├── Department Room (Engineering)
│   │   │   ├── Desk Cluster
│   │   │   │   ├── Desk 1 → Employee A
│   │   │   │   ├── Desk 2 → Employee B
│   │   │   │   └── ...
│   │   │   └── Department Room (Product)
│   ├── Floor / Wing (Xenbite)
│   └── Shared Services (HR, Finance, Legal)
```

### Chunking Strategy
- A **chunk** = one department room or one subsidiary wing.
- Load chunk metadata first (boundaries, desk count, theme).
- Load full geometry only when the camera is nearby.
- Unload distant chunks or swap to low-poly proxies.

### Navigation Levels
1. **Group overview** — whole building, simplified blocks.
2. **Subsidiary wing** — floor plan with department zones.
3. **Department room** — desks and avatars visible.
4. **Employee focus** — single desk with detail panel.

---

## 3. Rendering Many Employees

### Density Targets

| Employees | Strategy |
|---|---|
| 5–20 | Individual meshes, simple materials |
| 20–100 | Instanced desks/chairs/avatars, shared geometry |
| 100–500 | Instancing + LOD + billboard avatars at distance |
| 500+ | Spatial chunking + aggressive culling + impostors |

### Instancing
Use `@react-three/drei` `<Instances>` for:
- Desks
- Chairs
- Plants / room props
- Avatar bases

Example:
```tsx
<Instances limit={1000}>
  <boxGeometry args={[1, 0.1, 0.6]} />
  <meshStandardMaterial />
  {desks.map(desk => (
    <Instance key={desk.id} position={desk.position} />
  ))}
</Instances>
```

### Level of Detail (LOD)
Define 3 levels per employee:
- **LOD 0 (close):** low-poly character + photo billboard + status ring
- **LOD 1 (medium):** simple figure + name label
- **LOD 2 (far):** colored dot or badge only

Swap LOD based on distance to camera. Use `@react-three/drei/Detailed` or custom distance check.

### Billboards & Impostors
- For medium-distance avatars, use a **photo plane** that always faces camera.
- For far-distance, use a **sprite** or colored circle.
- Avoid unique 3D characters for every employee unless budget allows.

### Frustum & Occlusion Culling
- Use Three.js built-in frustum culling.
- For dense scenes, consider `@react-three/postprocessing` or manual occlusion checks.
- Hide rooms completely when not in view.

---

## 4. Asset Pipeline

### 3D Model Format
- Use **GLB/GLTF** with **Draco compression**.
- Run models through `gltfpack` for further optimization.
- Keep individual asset sizes under 2 MB for web.

### Texture Strategy
- Use texture atlases for repeated objects (desks, chairs, floors).
- Compress textures with **Basis Universal / KTX2**.
- Limit texture resolution: 512px for props, 1024px for hero assets.
- Use WebP/AVIF for UI images and photo billboards.

### Asset Storage & Delivery
- Store in **Firebase Cloud Storage**.
- Serve through **Google Cloud CDN**.
- Use signed URLs for private assets (e.g., employee photos).
- Version assets in filenames or paths for cache busting.

### Build Pipeline
```
Blender / Spline / 3D tool
        ↓
    Export GLB
        ↓
  Draco / gltfpack compression
        ↓
   Upload to Cloud Storage
        ↓
   CDN delivery to browser
```

---

## 5. Loading Strategies

### Progressive Loading
1. Load shell scene (building exterior / floor plan) first.
2. Load active department room in detail.
3. Preload adjacent rooms at low resolution.
4. Load employee avatars asynchronously as camera approaches.

### Data Loading
- Fetch room/department data from NestJS API on navigation.
- Use React `Suspense` + `ErrorBoundary` around 3D chunks.
- Show skeleton placeholders while chunk loads.

### Asset Caching
- Cache GLB files in browser with service worker.
- Use TanStack Query to cache API responses.
- Reuse geometry/material across identical objects.

---

## 6. Real-Time Updates Without Re-Render

### Presence Updates
- Use Firestore listener on a small presence doc per employee.
- Update only the material color / status indicator, not the whole scene.
- Batch presence updates and throttle to 1 Hz.

### Activity / Project Updates
- Update Zustand store first; scene reads from store.
- Use `useFrame` sparingly; prefer event-driven updates.
- For many updates, batch and apply on next frame.

### State Management Pattern
```ts
interface SceneStore {
  chunks: Record<string, Chunk>;
  selectedEmployeeId: string | null;
  hoveredEmployeeId: string | null;
  cameraTarget: CameraState;
  updatePresence: (id: string, status: Presence) => void;
}
```

---

## 7. Performance Targets & Monitoring

### Targets
- First Contentful Paint: < 1.5s desktop, < 3s mobile
- Time to Interactive: < 3s desktop, < 5s mobile
- 3D scene frame rate: 60fps on mid-range desktop, 30fps on mobile
- Memory usage: < 200 MB on desktop, < 100 MB on mobile

### Monitoring
- Use `drei/PerformanceMonitor` to detect GPU strain.
- Automatically reduce quality (dpr, shadows, LOD) if FPS drops.
- Track Web Vitals in Vercel Analytics.

---

## 8. Mobile & Tablet Strategy

### Adaptive Quality
- Detect device tier via GPU info or performance test.
- On low-end / mobile:
  - Reduce pixel ratio (`dpr={[1, 1.5]}`).
  - Disable real-time shadows.
  - Use simpler LOD levels.
  - Default to 2D fallback view.

### Touch Interaction
- Tap to select, pinch to zoom, two-finger rotate.
- Larger hit targets for touch.
- Simplified camera constraints to prevent disorientation.

---

## 9. Recommended Production Libraries

| Purpose | Library |
|---|---|
| Core 3D | `@react-three/fiber`, `three` |
| Helpers | `@react-three/drei` |
| State | `zustand` |
| Transitions | `@react-spring/three` or `framer-motion` |
| Gesture | `@use-gesture/react` |
| Physics (optional) | `@react-three/rapier` |
| Postprocessing (optional) | `@react-three/postprocessing` |
| LOD helpers | `@react-three/drei/Detailed` |
| GLTF optimization | `gltfjsx`, `gltfpack`, `three-stdlib` |
| Testing | `@react-three/test-renderer` (limited) |

---

## 10. Production Checklist for 3D

- [ ] All repeated geometry uses instancing.
- [ ] GLB models are Draco-compressed and gltfpacked.
- [ ] Textures are compressed and atlased.
- [ ] LOD system is in place for avatars and furniture.
- [ ] Distant rooms use low-poly proxies.
- [ ] Camera transitions are smooth and constrained.
- [ ] Loading states and fallbacks are implemented.
- [ ] Performance monitor adapts quality dynamically.
- [ ] Mobile defaults to 2D view or reduced 3D.
- [ ] Accessibility: keyboard navigation and 2D fallback.
- [ ] Assets served via CDN with proper caching headers.
