// This module provides functions for working with application base paths.

// The application's base path, configured via an environment variable.
// Prefer NEXT_PUBLIC_BASE_PATH. Fall back to NEXT_BASE_PATH so we don't end up with
// a UI using one base path while Next is configured with another.
export const APP_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || process.env.NEXT_BASE_PATH || "").replace(/\/+$/g, "");

// Prepends the application's base path to a given path.
export function withBasePath(p: string) {
  if (!APP_BASE_PATH) return p;
  if (!p) return APP_BASE_PATH;
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${APP_BASE_PATH}${path}`;
}
