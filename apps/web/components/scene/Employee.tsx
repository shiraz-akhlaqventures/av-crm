"use client";

import { Text } from "@react-three/drei";
import type { Employee } from "@av-crm/shared-types";

interface Props {
  employee: Employee;
  position: [number, number, number];
  onClick: (e: Employee) => void;
  isSelected?: boolean;
}

/**
 * Detailed desk setup:
 *   - Chair (cylinder + back)
 *   - Desk surface + 4 legs
 *   - PC tower under desk (green LED when online)
 *   - Monitor (screen emissive cyan when online)
 *   - Person (capsule body + sphere head)
 *   - Online status glow ring on ground
 *   - Selection ring (when this employee is picked)
 *   - Floating name label
 */
export function EmployeeMarker({
  employee,
  position,
  onClick,
  isSelected,
}: Props) {
  const isOnline = employee.isOnline;
  const screenColor = isOnline ? "#7dd3fc" : "#1f1f23";
  const screenEmissive = isOnline ? "#0ea5e9" : "#000000";

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(employee);
      }}
    >
      {/* Chair base */}
      <mesh position={[0, 0.25, -0.55]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 12]} />
        <meshStandardMaterial color="#27272a" />
      </mesh>
      {/* Chair back */}
      <mesh position={[0, 0.55, -0.7]} castShadow>
        <boxGeometry args={[0.4, 0.6, 0.1]} />
        <meshStandardMaterial color="#27272a" />
      </mesh>

      {/* Desk surface */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.06, 0.6]} />
        <meshStandardMaterial color="#52525b" />
      </mesh>
      {/* Desk legs */}
      {(
        [
          [-0.45, 0.35, -0.25],
          [0.45, 0.35, -0.25],
          [-0.45, 0.35, 0.25],
          [0.45, 0.35, 0.25],
        ] as [number, number, number][]
      ).map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.05, 0.7, 0.05]} />
          <meshStandardMaterial color="#3f3f46" />
        </mesh>
      ))}

      {/* PC tower under desk (green LED when online) */}
      <mesh position={[0.4, 0.35, -0.2]} castShadow>
        <boxGeometry args={[0.18, 0.45, 0.4]} />
        <meshStandardMaterial
          color="#18181b"
          emissive={isOnline ? "#22c55e" : "#000000"}
          emissiveIntensity={isOnline ? 0.4 : 0}
        />
      </mesh>

      {/* Monitor */}
      <group position={[0, 0.95, -0.05]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.2, 12]} />
          <meshStandardMaterial color="#27272a" />
        </mesh>
        <mesh position={[0, -0.05, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
          <meshStandardMaterial color="#27272a" />
        </mesh>
        {/* Bezel */}
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.45, 0.04]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.66, 0.41]} />
          <meshStandardMaterial
            color={screenColor}
            emissive={screenEmissive}
            emissiveIntensity={isOnline ? 0.9 : 0}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Person (capsule body) */}
      <mesh position={[0, 0.6, -0.4]} castShadow>
        <capsuleGeometry args={[0.18, 0.5, 4, 12]} />
        <meshStandardMaterial color={isOnline ? "#a78bfa" : "#71717a"} />
      </mesh>
      {/* Person (head) */}
      <mesh position={[0, 1.05, -0.4]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#fcd9b6" />
      </mesh>

      {/* Online status glow ring on ground */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshBasicMaterial
          color={isOnline ? "#10b981" : "#3f3f46"}
          transparent
          opacity={isOnline ? 0.6 : 0.3}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.85, 32]} />
          <meshBasicMaterial color="#fafafa" />
        </mesh>
      )}

      {/* Name label */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.16}
        color="#fafafa"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.012}
        outlineColor="#000"
      >
        {employee.name}
      </Text>
    </group>
  );
}
