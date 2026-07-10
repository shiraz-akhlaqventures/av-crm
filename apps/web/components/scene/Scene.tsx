"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
} from "@react-three/drei";
import { Suspense, useEffect } from "react";
import { Office, setSubsidiariesCount } from "./Office";
import type {
  Subsidiary,
  Department,
  Employee,
} from "@av-crm/shared-types";

interface SceneProps {
  subsidiaries: Subsidiary[];
  departmentsBySubsidiary: Record<string, Department[]>;
  employeesByDepartment: Record<string, Employee[]>;
  selectedDepartmentId: string | null;
  onSelectDepartment: (dept: Department) => void;
  onSelectEmployee: (emp: Employee) => void;
  selectedEmployeeId?: string;
}

export function Scene({
  subsidiaries,
  departmentsBySubsidiary,
  employeesByDepartment,
  selectedDepartmentId,
  onSelectDepartment,
  onSelectEmployee,
  selectedEmployeeId,
}: SceneProps) {
  useEffect(() => {
    setSubsidiariesCount(subsidiaries.length);
  }, [subsidiaries.length]);

  return (
    <Canvas
      shadows
      gl={{ antialias: true }}
      onCreated={({ scene }) => {
        // Background color via direct hex so we don't pull in three types
        // just for the Color constructor.
        (scene.background as unknown) = null;
      }}
    >
      <color attach="background" args={["#09090b"]} />

      <PerspectiveCamera makeDefault position={[0, 14, 22]} fov={50} />

      {/* Lights */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[10, 18, 10]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <hemisphereLight args={["#a78bfa", "#0a0a0a", 0.3]} />

      {/* Subtle stars so the background isn't pitch-black */}
      <Stars radius={100} depth={50} count={200} factor={2} fade speed={0.3} />

      {/* Floor + zones */}
      <Suspense fallback={null}>
        <Office
          subsidiaries={subsidiaries}
          departmentsBySubsidiary={departmentsBySubsidiary}
          employeesByDepartment={employeesByDepartment}
          selectedDepartmentId={selectedDepartmentId}
          onSelectDepartment={onSelectDepartment}
          onSelectEmployee={onSelectEmployee}
          selectedEmployeeId={selectedEmployeeId}
        />
      </Suspense>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={6}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
