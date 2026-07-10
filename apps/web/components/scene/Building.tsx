"use client";

import { useMemo } from "react";
import { Text } from "@react-three/drei";

interface BuildingProps {
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  color: string;
  label: string;
  isNight: boolean;
  floors?: number;
  /** When true, the roof is removed so the camera can look down into the building. */
  openTop?: boolean;
}

/**
 * A simple office building shell: 4 walls + pitched roof + windows
 * + a door cut into the front wall. Windows glow at night.
 *
 * Geometry is built procedurally (no GLTF) so we don't need any
 * asset pipeline.
 */
export function Building({
  position,
  width,
  depth,
  height,
  color,
  label,
  isNight,
  floors = 2,
  openTop = false,
}: BuildingProps) {
  const windowPositions = useMemo(() => {
    // Distribute windows across the two long walls (front + back)
    // and the two side walls (left + right).
    const positions: Array<[number, number, number, "front" | "back" | "left" | "right"]> = [];
    const winSize = 0.6;
    const winSpacing = 1.5;
    const winYStart = 1.2;
    const winYEnd = height - 0.6;

    for (let f = 0; f < floors; f++) {
      const yMid = winYStart + ((winYEnd - winYStart) * (f + 0.5)) / floors;

      // Front + back walls (along X axis)
      const countX = Math.floor((width - 1) / winSpacing);
      for (let i = 0; i < countX; i++) {
        const x = -width / 2 + 1 + i * winSpacing + winSize / 2;
        positions.push([x, yMid, depth / 2 + 0.02, "front"]);
        positions.push([x, yMid, -depth / 2 - 0.02, "back"]);
      }

      // Left + right walls (along Z axis)
      const countZ = Math.floor((depth - 1) / winSpacing);
      for (let i = 0; i < countZ; i++) {
        const z = -depth / 2 + 1 + i * winSpacing + winSize / 2;
        positions.push([width / 2 + 0.02, yMid, z, "right"]);
        positions.push([-width / 2 - 0.02, yMid, z, "left"]);
      }
    }
    return positions;
  }, [width, depth, height, floors]);

  return (
    <group position={position}>
      {/* Floor (inside the building) */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width - 0.1, depth - 0.1]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>

      {/* Walls */}
      {/* Front wall (with door gap in the middle) */}
      <WallSegments
        totalWidth={width}
        height={height}
        thickness={0.1}
        gap={{ x: 0, width: 1.6, fromBottom: 0, height: 2.4 }}
        axis="x"
      />
      {/* Back wall */}
      <mesh position={[0, height / 2, -depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Left wall */}
      <mesh
        position={[-width / 2, height / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.1, height, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Right wall */}
      <mesh position={[width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, height, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Roof (if not open top) */}
      {!openTop && (
        <mesh position={[0, height + 0.1, 0]} castShadow>
          <boxGeometry args={[width + 0.2, 0.2, depth + 0.2]} />
          <meshStandardMaterial color="#27272a" />
        </mesh>
      )}

      {/* Windows (glowing at night) */}
      {windowPositions.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <planeGeometry args={[0.55, 0.55]} />
          <meshStandardMaterial
            color={isNight ? "#fde68a" : "#1e3a8a"}
            emissive={isNight ? "#fbbf24" : "#000000"}
            emissiveIntensity={isNight ? 1.0 : 0}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Building label floating above */}
      <Text
        position={[0, height + 0.8, 0]}
        fontSize={0.7}
        color="#fafafa"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.025}
        outlineColor="#000"
      >
        {label}
      </Text>
    </group>
  );
}

/**
 * Builds a wall with a rectangular gap (door or large window).
 * Splits the wall into up to 3 segments: above the gap, left of
 * the gap, right of the gap.
 */
function WallSegments({
  totalWidth,
  height,
  thickness,
  gap,
  axis,
}: {
  totalWidth: number;
  height: number;
  thickness: number;
  gap: { x: number; width: number; fromBottom: number; height: number };
  axis: "x" | "z";
}) {
  const gapLeft = gap.x - gap.width / 2;
  const gapRight = gap.x + gap.width / 2;
  const gapTop = gap.fromBottom + gap.height;

  const segments: Array<{ position: [number, number, number]; size: [number, number, number] }> = [];

  // Top strip (above the gap)
  if (height > gapTop) {
    const w = totalWidth;
    const h = height - gapTop;
    segments.push({
      position: [0, gapTop + h / 2, totalWidth / 2],
      size: [w, h, thickness],
    });
  }

  // Left of gap
  if (gapLeft > -totalWidth / 2) {
    const w = gapLeft + totalWidth / 2;
    segments.push({
      position: [(-totalWidth / 2 + gapLeft) / 2, gap.height / 2, totalWidth / 2],
      size: [w, gap.height, thickness],
    });
  }

  // Right of gap
  if (gapRight < totalWidth / 2) {
    const w = totalWidth / 2 - gapRight;
    segments.push({
      position: [(gapRight + totalWidth / 2) / 2, gap.height / 2, totalWidth / 2],
      size: [w, gap.height, thickness],
    });
  }

  void axis; // axis param reserved for future orientation variants

  return (
    <>
      {segments.map((s, i) => (
        <mesh key={i} position={s.position} castShadow receiveShadow>
          <boxGeometry args={s.size} />
          <meshStandardMaterial color="#27272a" />
        </mesh>
      ))}
    </>
  );
}
