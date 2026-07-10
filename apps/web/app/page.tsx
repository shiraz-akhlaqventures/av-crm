"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearAccessToken, getAccessToken } from "@/lib/api/client";
import { signOut } from "@/lib/firebase/auth";
import { Scene } from "@/components/scene/Scene";
import type {
  Company,
  Subsidiary,
  Department,
  Employee,
} from "@av-crm/shared-types";

export default function Dashboard() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [departmentsBySubsidiary, setDepartmentsBySubsidiary] = useState<
    Record<string, Department[]>
  >({});
  const [employeesByDepartment, setEmployeesByDepartment] = useState<
    Record<string, Employee[]>
  >({});
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to /login if no JWT.
  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    api<{ email?: string }>("/api/auth/me")
      .then((u) => setSignedInAs(u.email ?? null))
      .catch(() => setSignedInAs(null));
  }, [router]);

  // Load the hierarchy.
  useEffect(() => {
    if (!getAccessToken()) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const companies = await api<Company[]>("/api/companies");
        if (cancelled) return;
        const ak = companies.find((c) => c.id === "ak") ?? companies[0];
        if (!ak) {
          setError("No companies found. Run the seed script.");
          setLoading(false);
          return;
        }
        setCompany(ak);

        const subs = await api<Subsidiary[]>(
          `/api/subsidiaries?companyId=${ak.id}`,
        );
        if (cancelled) return;
        setSubsidiaries(subs);

        const deptMap: Record<string, Department[]> = {};
        const empMap: Record<string, Employee[]> = {};
        await Promise.all(
          subs.map(async (sub) => {
            const depts = await api<Department[]>(
              `/api/departments?subsidiaryId=${sub.id}`,
            );
            deptMap[sub.id] = depts;
            await Promise.all(
              depts.map(async (d) => {
                const emps = await api<Employee[]>(
                  `/api/employees?departmentId=${d.id}`,
                );
                empMap[d.id] = emps;
              }),
            );
          }),
        );
        if (cancelled) return;
        setDepartmentsBySubsidiary(deptMap);
        setEmployeesByDepartment(empMap);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSignOut() {
    try {
      await signOut();
    } catch {}
    clearAccessToken();
    router.replace("/login");
  }

  const selectedDepartment = useMemo(() => {
    if (!selectedDepartmentId) return null;
    for (const list of Object.values(departmentsBySubsidiary)) {
      const found = list.find((d) => d.id === selectedDepartmentId);
      if (found) return found;
    }
    return null;
  }, [selectedDepartmentId, departmentsBySubsidiary]);

  const selectedEmployees = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return employeesByDepartment[selectedDepartmentId] ?? [];
  }, [selectedDepartmentId, employeesByDepartment]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-300">
        <p>Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-zinc-950">
        <div className="rounded-md border border-red-300 bg-red-950 p-4 text-sm text-red-200 max-w-lg">
          <p className="font-semibold mb-1">Error</p>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      {/* 3D Canvas (full bleed) */}
      <div className="absolute inset-0">
        <Scene
          subsidiaries={subsidiaries}
          departmentsBySubsidiary={departmentsBySubsidiary}
          employeesByDepartment={employeesByDepartment}
          selectedDepartmentId={selectedDepartmentId}
          onSelectDepartment={(d) => setSelectedDepartmentId(d.id)}
          onSelectEmployee={(e) => setSelectedEmployee(e)}
          selectedEmployeeId={selectedEmployee?.id}
        />
      </div>

      {/* Top header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/70 to-transparent">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {company?.name ?? "Akhlaq Ventures"}
          </h1>
          <p className="text-xs text-zinc-400">
            {subsidiaries.length} subsidiaries ·{" "}
            {Object.values(departmentsBySubsidiary).reduce(
              (n, list) => n + list.length,
              0,
            )}{" "}
            departments ·{" "}
            {Object.values(employeesByDepartment).reduce(
              (n, list) => n + list.length,
              0,
            )}{" "}
            employees
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-300">
          <span>{signedInAs}</span>
          <button
            onClick={onSignOut}
            className="rounded-md border border-zinc-600 px-3 py-1 hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Selected department panel */}
      {selectedDepartment && (
        <aside className="absolute top-24 right-4 z-10 w-72 rounded-lg border border-zinc-700 bg-zinc-900/90 backdrop-blur p-4 text-zinc-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">{selectedDepartment.name}</h3>
            <button
              onClick={() => setSelectedDepartmentId(null)}
              className="text-zinc-500 hover:text-zinc-200 text-xs"
            >
              close
            </button>
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            {selectedDepartment.description}
          </p>
          <ul className="space-y-1.5">
            {selectedEmployees.map((e) => (
              <li
                key={e.id}
                className={`flex items-center justify-between gap-2 text-sm rounded-md px-2 py-1 cursor-pointer ${
                  selectedEmployee?.id === e.id
                    ? "bg-zinc-700"
                    : "hover:bg-zinc-800"
                }`}
                onClick={() => setSelectedEmployee(e)}
              >
                <div>
                  <div className="text-sm">{e.name}</div>
                  <div className="text-xs text-zinc-500">{e.title}</div>
                </div>
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    e.isOnline ? "bg-emerald-400" : "bg-zinc-500"
                  }`}
                  title={e.isOnline ? "online" : "offline"}
                />
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* Selected employee panel */}
      {selectedEmployee && (
        <aside className="absolute bottom-4 right-4 z-10 w-72 rounded-lg border border-zinc-700 bg-zinc-900/90 backdrop-blur p-4 text-zinc-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">{selectedEmployee.name}</h3>
            <button
              onClick={() => setSelectedEmployee(null)}
              className="text-zinc-500 hover:text-zinc-200 text-xs"
            >
              close
            </button>
          </div>
          <p className="text-sm text-zinc-300">{selectedEmployee.title}</p>
          <p className="text-xs text-zinc-500">{selectedEmployee.email}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {selectedEmployee.department} ·{" "}
            <span
              className={
                selectedEmployee.isOnline ? "text-emerald-400" : "text-zinc-500"
              }
            >
              {selectedEmployee.isOnline ? "online" : "offline"}
            </span>
          </p>
        </aside>
      )}

      {/* Hint overlay (bottom-left) */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-zinc-500">
        Drag to rotate · scroll to zoom · click a department or employee
      </div>
    </main>
  );
}
