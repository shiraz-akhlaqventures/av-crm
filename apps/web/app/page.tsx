"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, clearAccessToken, getAccessToken } from "@/lib/api/client";
import { signOut } from "@/lib/firebase/auth";
import type {
  Company,
  Subsidiary,
  Department,
  Employee,
} from "@av-crm/shared-types";

type SubsidiaryWithDepartments = Subsidiary & { departments: Department[] };

export default function Dashboard() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [subsidiaries, setSubsidiaries] = useState<SubsidiaryWithDepartments[]>(
    [],
  );
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);

  // Redirect to /login if we don't have a JWT yet.
  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
    } else {
      // Pull our own user info from /api/auth/me for the header.
      api<{ email?: string }>("/api/auth/me")
        .then((u) => setSignedInAs(u.email ?? null))
        .catch(() => setSignedInAs(null));
    }
  }, [router]);

  // Load the company + subsidiaries + their departments.
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

        // Load departments per subsidiary in parallel.
        const enriched = await Promise.all(
          subs.map(async (s) => ({
            ...s,
            departments: await api<Department[]>(
              `/api/departments?subsidiaryId=${s.id}`,
            ),
          })),
        );
        if (cancelled) return;
        setSubsidiaries(enriched);
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

  async function onSelectDepartment(dept: Department) {
    setSelectedDept(dept);
    try {
      const list = await api<Employee[]>(
        `/api/employees?departmentId=${dept.id}`,
      );
      setEmployees(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onSignOut() {
    try {
      await signOut();
    } catch {}
    clearAccessToken();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300 max-w-lg">
          <p className="font-semibold mb-1">Error</p>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!company) return null;

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {company.name}
          </h1>
          <p className="text-sm text-zinc-500">{company.description}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-500">
            {signedInAs ? `Signed in as ${signedInAs}` : "Signed in"}
          </span>
          <button
            onClick={onSignOut}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: subsidiaries + departments tree */}
        <div className="lg:col-span-2 space-y-6">
          {subsidiaries.map((sub) => (
            <section
              key={sub.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5"
            >
              <h2 className="text-lg font-medium mb-1">{sub.name}</h2>
              <p className="text-sm text-zinc-500 mb-4">{sub.description}</p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sub.departments.map((d) => {
                  const selected = selectedDept?.id === d.id;
                  return (
                    <li key={d.id}>
                      <button
                        onClick={() => onSelectDepartment(d)}
                        className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                          selected
                            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-900"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                        }`}
                      >
                        <div className="font-medium">{d.name}</div>
                        <div className="text-xs text-zinc-500">
                          {d.description}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {/* Right column: selected department's employees */}
        <aside className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 h-fit">
          {selectedDept ? (
            <>
              <h3 className="font-medium mb-1">{selectedDept.name}</h3>
              <p className="text-xs text-zinc-500 mb-4">
                {employees.length} employee{employees.length === 1 ? "" : "s"}
              </p>
              <ul className="space-y-2">
                {employees.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">{e.name}</div>
                      <div className="text-xs text-zinc-500">{e.title}</div>
                    </div>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        e.isOnline
                          ? "bg-emerald-500"
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                      title={e.isOnline ? "online" : "offline"}
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              Click a department to see its employees.
            </p>
          )}
        </aside>
      </div>

      <footer className="mt-12 text-center text-xs text-zinc-400">
        <Link href="/login" className="hover:underline">
          Login
        </Link>
      </footer>
    </main>
  );
}
