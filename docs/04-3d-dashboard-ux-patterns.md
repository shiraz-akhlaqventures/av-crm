# 3D Office Dashboard UX Research

## 1. Interaction Patterns

- **Click to select**: Use raycasting with visual feedback (outline, highlight, scale pulse). Show details in a side panel, not a 3D tooltip that occludes the scene.
- **Zoom-to-focus**: Animate camera to target object's bounding sphere center. Maintain readable distance based on object size.
- **Orbit controls**: Enable rotate/zoom/pan with damping. Restrict polar angle to prevent floor clipping. Use min/max distance to keep context.
- **Transitions**: Animate camera position/lookAt with `lerp` or a tweening library. Keep transitions under 400ms. Avoid motion sickness with smooth, predictable paths.

## 2. Representing Hierarchy in 3D Space

- **Building** → **Floor** → **Room** → **Desk** → **Employee**: Nest nodes logically using scene graph groups.
- Use vertical stacking for floors, color coding for departments, and distinct zones for rooms.
- Progressive disclosure: load floor geometry on demand; hide lower-detail levels as camera zooms out.
- Each level exposes a clickable target with metadata (name, role, capacity, status).

## 3. Visual Style Tradeoffs

| Style | Pros | Cons | Best For |
|---|---|---|---|
| **Realistic** | Immersive, recognizable | Heavy assets, slow loading, harder to stylize data | Virtual HQ, showcases |
| **Low-poly** | Fast, clean, scannable | Less spatial realism | Daily dashboards, performance-critical apps |
| **Isometric** | Clear hierarchy, no camera confusion | Less immersive, fixed viewpoint | Status boards, mobile views |

Recommendation: Start low-poly. It maps cleanly to data states and runs reliably on lower-end devices.

## 4. Employee Avatar Options and Performance Implications

- **Abstract dots/shapes**: Cheapest. Color + badge conveys status. Good for dense views.
- **Low-poly characters**: Reusable geometry + texture atlases. Moderate cost; batch instances.
- **Photo billboards**: Fast with one plane per avatar. Readable but can look cluttered.
- **3D scanned/animated avatars**: Highest fidelity, highest cost. Avoid for dashboards; reserve for VR or profile focus mode.

Performance tip: Use `InstancedMesh` for repeated avatars/desks. Limit unique materials and textures.

## 5. Camera Movement and Scene State Transitions

- Define preset camera states: **overview**, **floor**, **room**, **desk**.
- Store target position, lookAt, and zoom level per state.
- Transition with easing functions; disable user input during animation.
- Sync camera state to URL query params for deep-linking.
- Keep a breadcrumb or minimap so users don't lose context.

## 6. Performance Optimization Techniques for Browser 3D

- Use **instancing** for repeated objects (desks, chairs, plants, avatars).
- Implement **LOD** (level of detail) and frustum culling.
- Keep draw calls low by merging static geometry and using texture atlases.
- Use **drei/PerformanceMonitor** and **drei/Instances** in React Three Fiber.
- Lazy-load heavy floors; unload off-screen levels.
- Avoid real-time shadows on mobile; use baked lightmaps or contact shadows.
- Target 60fps by capping pixel ratio and disabling anti-aliasing on low-end GPUs.
- Use **Suspense** and async loading for models; show placeholders.

## 7. Accessibility and 2D Fallback Recommendations

- Provide a **2D list/tree view** toggle of the same hierarchy.
- Ensure all selectable objects have keyboard-focusable equivalents.
- Add `aria-live` regions for selection changes and loading states.
- Respect `prefers-reduced-motion`: disable camera fly-throughs.
- Maintain color-independent status indicators (icons, patterns, labels).
- Test keyboard navigation (Tab, Enter, Escape to zoom out).

## 8. Existing Product Examples

- **Gather.town** / **Teamflow** / **SoWork**: spatial audio + 2.5D office maps.
- **Mozilla Hubs**: lightweight web-based 3D rooms.
- **Robin / OfficeSpace**: 2D/3D floor plans with occupancy data.
- **Sofy**: 3D office for seating and team visibility.
- **Tandem / Remo**: focus on presence and meeting zones rather than full 3D dashboards.

## 9. Recommended Library Stack with React Three Fiber

- **@react-three/fiber**: React renderer for Three.js.
- **@react-three/drei**: helpers for controls, text, instances, HTML overlays, environment.
- **@react-three/postprocessing**: optional bloom, depth of field for polish.
- **zustand**: global state for camera level, selection, hierarchy data.
- **framer-motion** or **@react-spring/three**: camera and UI transitions.
- **three-stdlib** or direct **three.js** for geometry generation.
- **react-use-gesture** for custom pointer interactions if needed.
- **Vite** for fast HMR and modern bundling.

### Starter architecture

```
/app
  /components
    OfficeScene.jsx
    Floor.jsx
    Room.jsx
    Desk.jsx
    EmployeeAvatar.jsx
    CameraRig.jsx
    SelectionPanel.jsx
  /state
    sceneStore.js
  /hooks
    useCameraTransition.js
```
