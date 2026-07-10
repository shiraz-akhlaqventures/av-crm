"use client";

import { getIdToken } from "../firebase/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message: string,
  ) {
    super(message);
  }
}

const ACCESS_TOKEN_KEY = "av-crm.access-token";

/**
 * Tiny fetch wrapper that:
 *   - prefixes the API base URL
 *   - injects Authorization: Bearer <our JWT from sessionStorage>
 *   - parses JSON
 *   - throws ApiError on non-2xx
 *
 * Our backend's JwtStrategy expects the JWT minted by /api/auth/login
 * (signed with JWT_SECRET), NOT a Firebase ID token. So we read the
 * stored access token, falling back to a Firebase ID token only for
 * the initial /api/auth/login call.
 */
export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  const token = getAccessToken() ?? (await getIdToken().catch(() => null));
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  const text = await res.text();
  const body = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : res.statusText) || `HTTP ${res.status}`;
    if (res.status === 401) clearAccessToken();
    throw new ApiError(res.status, body, message);
  }
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
