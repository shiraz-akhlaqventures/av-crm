import { getIdToken } from "../firebase/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message: string) {
    super(message);
  }
}

/**
 * Tiny fetch wrapper that:
 *   - prefixes the API base URL
 *   - injects Authorization: Bearer <firebase ID token>
 *   - parses JSON
 *   - throws ApiError on non-2xx
 */
export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  // Only attach token if the user is signed in.
  const token = await getIdToken().catch(() => null);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  const text = await res.text();
  const body = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : res.statusText) || `HTTP ${res.status}`;
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
