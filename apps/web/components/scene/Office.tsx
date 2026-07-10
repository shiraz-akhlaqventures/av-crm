"use client";

import { Text } from "@react-three/drei";
import type {
  Subsidiary,
  Department,
  Employee,
} from "@av-crm/shared-types";
import { EmployeeMarker } from "./Employee";
import { Building } from "./Building";

interface OfficeProps {
  subsidiaries: Subsidiary[];
  departmentsBySubsidiary: Record<string, Department[]>;
  employeesByDepartment: Record<string, Employee[]>;
  selectedDepartmentId: string | null;
  onSelectDepartment: (dept: Department) => void;
  onSelectEmployee: (emp: Employee) => void;
  selectedEmployeeId?: string;
  isNight: boolean;
}

const ZONE_COLORS: Record<string, string> = {
  xenbus: "#0e7490",
  xenbite: "#7c3aed",
  ak: "#a16207",
};

const BUILDING_WIDTH = 22;
const BUILDING_DEPTH = 22;
const BUILDING_HEIGHT = 6;
const BUILDING_SPACING = 8;

/**
 * HQ office complex:
 *   - One ground plane (the entire Akhlaq Ventures campus)
 *   - One building per subsidiary, side by side
 *   - Inside each building: one platform per department
 *   - Employees arranged in a grid on each platform
 */
export function Office({
  subsidiaries,
  departmentsBySubsidiary,
  employeesByDepartment,
  selectedDepartmentId,
  onSelectDepartment,
  onSelectEmployee,
  selectedEmployeeId,
  isNight,
}: OfficeProps) {
  const totalWidth =
    subsidiaries.length * BUILDING_WIDTH +
    (subsidiaries.length - 1) * BUILDING_SPACING;
  const startX = -totalWidth / 2 + BUILDING_WIDTH / 2;

  return (
    <group>
      {/* Campus ground */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[totalWidth + 30, BUILDING_DEPTH + 30]} />
        <meshStandardMaterial color="#1f1f23" />
      </mesh>

      {subsidiaries.map((sub, subIdx) => {
        const offsetX = startX + subIdx * (BUILDING_WIDTH + BUILDING_SPACING);
        const baseColor = ZONE_COLORS[sub.id] ?? "#3f3f46";
        return (
          <group key={sub.id} position={[offsetX, 0, 0]}>
            <Building
              position={[0, 0, 0]}
              width={BUILDING_WIDTH}
              depth={BUILDING_DEPTH}
              height={BUILDING_HEIGHT}
              color={baseColor}
              label={sub.name}
              isNight={isNight}
              floors={2}
              openTop={false}
            />

            {(departmentsBySubsidiary[sub.id] ?? []).map((dept, dIdx) => {
              const cols = 2;
              const col = dIdx % cols;
              const row = Math.floor(dIdx / cols);
              const cellW = (BUILDING_WIDTH - 4) / cols;
              const cellD = (BUILDING_DEPTH - 6) / 3;
              const cellX = -BUILDING_WIDTH / 2 + cellW / 2 + 2 + col * cellW;
              const cellZ = -BUILDING_DEPTH / 2 + cellD / 2 + 2 + row * cellD;

              const isSelected = selectedDepartmentId === dept.id;
              const employees = employeesByDepartment[dept.id] ?? [];

              return (
                <group key={dept.id} position={[cellX, 0, cellZ]}>
                  <mesh
                    position={[0, 0.05, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    receiveShadow
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDepartment(dept);
                    }}
                  >
                    <planeGeometry args={[cellW - 1, cellD - 1]} />
                    <meshStandardMaterial
                      color={isSelected ? "#fafafa" : baseColor}
                      emissive={isSelected ? baseColor : "#000000"}
                      emissiveIntensity={isSelected ? 0.5 : 0}
                      opacity={0.4}
                      transparent
                    />
                  </mesh>

                  <Text
                    position={[0, 0.15, -cellD / 2 + 0.6]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={0.32}
                    color={isSelected ? "#fafafa" : "#d4d4d8"}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.012}
                    outlineColor="#000"
                  >
                    {dept.name}
                  </Text>

                  {employees.map((emp, empIdx) => {
                    const empCols = 3;
                    const eCol = empIdx % empCols;
                    const eRow = Math.floor(empIdx / empCols);
                    const empSpacing = 1.7;
                    const empStartX = -((empCols - 1) * empSpacing) / 2;
                    const empX = empStartX + eCol * empSpacing;
                    const empZ = (eRow - 1) * empSpacing + 1.2;
                    return (
                      <EmployeeMarker
                        key={emp.id}
                        employee={emp}
                        position={[empX, 0, empZ]}
                        isSelected={selectedEmployeeId === emp.id}
                        onClick={onSelectEmployee}
                      />
                    );
                  })}
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
