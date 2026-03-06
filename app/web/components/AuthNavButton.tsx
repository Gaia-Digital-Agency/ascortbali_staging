// This module provides a navigation button that dynamically changes based on user authentication status.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, clearTokens } from "../lib/api";
import { withBasePath } from "../lib/paths";

// AuthNavButton component.
export function AuthNavButton() {
  const [role, setRole] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  // Effect hook to check and update login status, and listen for auth changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = async () => {
      const token = window.sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
      if (!token) {
        setLoggedIn(false);
        setRole(null);
        return;
      }
      try {
        const me = await apiFetch("/me");
        setRole(me?.role ?? null);
        setLoggedIn(Boolean(me?.role));
      } catch {
        clearTokens();
        setLoggedIn(false);
        setRole(null);
      }
    };
    check();
    const onFocus = () => check();
    const onAuthChange = () => check();
    window.addEventListener("focus", onFocus);
    window.addEventListener("auth:change", onAuthChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("auth:change", onAuthChange);
    };
  }, []);

  // Renders login/register buttons if not logged in.
  if (!loggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link className="btn btn-outline" href="/user">
          LOGIN
        </Link>
        <Link className="btn btn-outline" href="/user/register">
          REGISTER
        </Link>
      </div>
    );
  }

  const profileHref =
    role === "creator" ? "/creator/logged" : role === "admin" ? "/admin/logged" : "/user/logged";

  // Renders a logout button if logged in.
  return (
    <div className="flex items-center gap-2">
      <Link className="btn btn-outline" href={withBasePath(profileHref)}>
        EDIT PROFILE
      </Link>
      <button
        onClick={() => {
          clearTokens();
          setLoggedIn(false);
          setRole(null);
          window.location.assign(withBasePath("/"));
        }}
        className="btn btn-outline"
      >
        LOGOUT
      </button>
    </div>
  );
}
