/**
 * Central API client for the backend.
 * All frontend → backend calls should go through this (or unitransApi wrappers).
 * Base URL: VITE_API_URL or http://localhost:3000
 */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000'

/**
 * Low-level fetch wrapper. Builds URL from path, sends JSON, returns parsed JSON.
 * Throws on non-ok response (message from body.error or status text).
 * @param {string} path - Path without leading slash (e.g. "umo_routes/routes")
 * @param {RequestInit & { auth?: boolean }} options - fetch options; if auth is true, caller must pass getToken() and we add Authorization
 * @param {() => Promise<string|null>} [getToken] - Optional. When options.auth is true, used to add Bearer token.
 * @returns {Promise<any>} Parsed JSON body
 */
export async function api(path, options = {}, getToken = null) {
  const url = path.startsWith("http") ? path : `${API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && (options.body && typeof options.body === "string")) {
    headers.set("Content-Type", "application/json");
  }
  // Add auth token when requested
  if (options.auth && getToken) {
    const token = await getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  if (!res.ok) {
    const msg = body?.error || res.statusText || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body;
}

export { API_BASE };
