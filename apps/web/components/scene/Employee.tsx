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
 * A simple employee marker: a short cylinder (the "desk") with a
 * colored cap (online/offline) and a floating name label.
 *
 * Online = emerald cap, Offline = zinc cap.
 */
export function EmployeeMarker({ employee, position, onClick, isSelected }: Props) {
  const capColor = employee.isOnline ? "#10b981" : "#71717a";

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(employee);
      }}
    >
      {/* Desk base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.6, 16]} />
        <meshStandardMaterial color="#52525b" />
      </mesh>

      {/* Cap (online/offline indicator) */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color={capColor}
          emissive={capColor}
          emissiveIntensity={employee.isOnline ? 0.6 : 0}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial color="#fafafa" />
        </mesh>
      )}

      {/* Name label */}
      <Text
        position={[0, 1.1, 0]}
        fontSize={0.18}
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
