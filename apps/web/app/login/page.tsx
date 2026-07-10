"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/firebase/auth";
import { api, setAccessToken } from "@/lib/api/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const cred =
        mode === "signin"
          ? await signIn(email, password)
          : await signUp(email, password);

      const idToken = await cred.user.getIdToken();
      const data = await api<{ accessToken: string; refreshToken: string }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ idToken }) },
      );

      // Store the JWT so subsequent API calls pass it in the
      // Authorization header. sessionStorage clears on tab close.
      setAccessToken(data.accessToken);

      // Redirect to the dashboard.
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-6">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          Akhlaq Ventures
        </h1>
        <p className="text-sm text-zinc-500 mb-6">
          {mode === "signin" ? "Sign in to your account" : "Create an account"}
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-sm">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {busy
              ? "Working…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 w-full text-center"
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have one? Sign in"}
        </button>
      </div>
    </main>
  );
}
