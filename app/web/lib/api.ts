// This module provides functions for interacting with the backend API.
import { APP_BASE_PATH, withBasePath } from "./paths";

// Determine the API base URL from environment variables or defaults.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (APP_BASE_PATH ? withBasePath("/api") : "http://localhost:4000");

export type Tokens = { accessToken: string; refreshToken: string };

// Functions for managing authentication tokens in session storage.
export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("accessToken");
}
export function setTokens(t: Tokens) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("accessToken", t.accessToken);
  window.sessionStorage.setItem("refreshToken", t.refreshToken);
  window.dispatchEvent(new Event("auth:change"));
}

// Clears authentication tokens from session and local storage.
export function clearTokens() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem("accessToken");
    window.sessionStorage.removeItem("refreshToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.dispatchEvent(new Event("auth:change"));
  } catch {
    // ignore
  }
}

// A wrapper around `fetch` that adds the API base URL and authorization token.
export async function apiFetch(path: string, init?: RequestInit) {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (!headers.get("content-type")) headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `http_${res.status}`);
  }
  return res.json();
}
