"use client";

import { Text } from "@react-three/drei";
import type {
  Subsidiary,
  Department,
  Employee,
} from "@av-crm/shared-types";
import { EmployeeMarker } from "./Employee";

interface OfficeProps {
  subsidiaries: Subsidiary[];
  departmentsBySubsidiary: Record<string, Department[]>;
  employeesByDepartment: Record<string, Employee[]>;
  selectedDepartmentId: string | null;
  onSelectDepartment: (dept: Department) => void;
  onSelectEmployee: (emp: Employee) => void;
  selectedEmployeeId?: string;
}

/**
 * Subsidiary rooms: a colored zone on the floor with one section
 * per department. Each department is a slightly raised platform
 * with employees arranged in a grid.
 */
export function Office({
  subsidiaries,
  departmentsBySubsidiary,
  employeesByDepartment,
  selectedDepartmentId,
  onSelectDepartment,
  onSelectEmployee,
  selectedEmployeeId,
}: OfficeProps) {
  return (
    <group>
      {/* Ground floor (whole Akhlaq Ventures HQ) */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1f1f23" />
      </mesh>

      {subsidiaries.map((sub, subIdx) => (
        <SubsidiaryZone
          key={sub.id}
          subsidiary={sub}
          departments={departmentsBySubsidiary[sub.id] ?? []}
          employeesByDepartment={employeesByDepartment}
          zoneIndex={subIdx}
          selectedDepartmentId={selectedDepartmentId}
          onSelectDepartment={onSelectDepartment}
          onSelectEmployee={onSelectEmployee}
          selectedEmployeeId={selectedEmployeeId}
        />
      ))}
    </group>
  );
}

const ZONE_COLORS: Record<string, string> = {
  xenbus: "#0e7490", // cyan
  xenbite: "#7c3aed", // violet
  ak: "#a16207", // amber (for the executive zone)
};

function SubsidiaryZone({
  subsidiary,
  departments,
  employeesByDepartment,
  zoneIndex,
  selectedDepartmentId,
  onSelectDepartment,
  onSelectEmployee,
  selectedEmployeeId,
}: {
  subsidiary: Subsidiary;
  departments: Department[];
  employeesByDepartment: Record<string, Employee[]>;
  zoneIndex: number;
  selectedDepartmentId: string | null;
  onSelectDepartment: (dept: Department) => void;
  onSelectEmployee: (emp: Employee) => void;
  selectedEmployeeId?: string;
}) {
  const zoneWidth = 22;
  const zoneDepth = 22;
  // Lay out subsidiary zones side by side
  const offsetX = (zoneIndex - (subsidiariesCountCache - 1) / 2) * (zoneWidth + 4);
  const baseColor = ZONE_COLORS[subsidiary.id] ?? "#3f3f46";

  return (
    <group position={[offsetX, 0, 0]}>
      {/* Zone label floating above */}
      <Text
        position={[0, 6, zoneDepth / 2 + 1]}
        fontSize={0.8}
        color={baseColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {subsidiary.name}
      </Text>

      {departments.map((dept, dIdx) => {
        const cols = 2;
        const col = dIdx % cols;
        const row = Math.floor(dIdx / cols);
        const cellW = zoneWidth / cols;
        const cellD = zoneDepth / 3;
        const cellX = -zoneWidth / 2 + cellW * col + cellW / 2;
        const cellZ = -zoneDepth / 2 + cellD * row + cellD / 2;

        const isSelected = selectedDepartmentId === dept.id;
        const employees = employeesByDepartment[dept.id] ?? [];

        return (
          <group key={dept.id} position={[cellX, 0, cellZ]}>
            {/* Department platform */}
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
                emissive={isSelected ? baseColor : "#000"}
                emissiveIntensity={isSelected ? 0.5 : 0}
                opacity={0.35}
                transparent
              />
            </mesh>

            {/* Department name */}
            <Text
              position={[0, 0.15, -cellD / 2 + 1]}
              fontSize={0.4}
              color={isSelected ? "#fafafa" : "#d4d4d8"}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#000"
            >
              {dept.name}
            </Text>

            {/* Employees in a grid */}
            {employees.map((emp, empIdx) => {
              const empCols = 3;
              const eCol = empIdx % empCols;
              const eRow = Math.floor(empIdx / empCols);
              const empSpacing = 1.5;
              const empStartX = -((empCols - 1) * empSpacing) / 2;
              const empX = empStartX + eCol * empSpacing;
              const empZ = (eRow - 1) * empSpacing + 1;
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
}

// Cache to keep subsidiary zones centered; updated as zones mount.
// (Simple workaround so we don't have to compute width from props.)
let subsidiariesCountCache = 1;
export function setSubsidiariesCount(n: number) {
  subsidiariesCountCache = Math.max(1, n);
}
