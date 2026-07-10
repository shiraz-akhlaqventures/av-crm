"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Cloud,
} from "@react-three/drei";
import { Suspense, useEffect } from "react";
import { Office } from "./Office";
import { useIndianTime } from "./useIndianTime";
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

export function Scene(props: SceneProps) {
  const time = useIndianTime(60_000);
  const isNight = time.tod === "night";

  useEffect(() => {
    // Reserved for future camera-fit logic.
  }, [props.subsidiaries.length]);

  return (
    <Canvas shadows gl={{ antialias: true }}>
      <color attach="background" args={[time.skyColor]} />

      <fog attach="fog" args={[time.skyColor, 40, 120]} />

      <PerspectiveCamera makeDefault position={[0, 22, 36]} fov={50} />

      <directionalLight
        position={time.sunPosition}
        intensity={time.sunIntensity}
        color={time.sunColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />

      <ambientLight intensity={time.ambientIntensity} />
      <hemisphereLight args={[time.sunColor, "#0a0a0a", 0.25]} />

      {time.tod !== "night" && time.tod !== "evening" && (
        <>
          <Cloud
            position={[-20, 18, -10]}
            opacity={0.4}
            speed={0.1}
            segments={20}
          />
          <Cloud
            position={[15, 22, -25]}
            opacity={0.3}
            speed={0.1}
            segments={20}
          />
        </>
      )}
      {time.tod === "night" && (
        <Stars radius={120} depth={60} count={500} factor={3} fade speed={0.3} />
      )}

      <Suspense fallback={null}>
        <Office
          subsidiaries={props.subsidiaries}
          departmentsBySubsidiary={props.departmentsBySubsidiary}
          employeesByDepartment={props.employeesByDepartment}
          selectedDepartmentId={props.selectedDepartmentId}
          onSelectDepartment={props.onSelectDepartment}
          onSelectEmployee={props.onSelectEmployee}
          selectedEmployeeId={props.selectedEmployeeId}
          isNight={isNight}
        />
      </Suspense>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={6}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}
