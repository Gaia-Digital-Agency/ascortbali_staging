// This module provides a navigation button that dynamically changes based on user authentication status.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearTokens } from "../lib/api";
import { withBasePath } from "../lib/paths";

// AuthNavButton component.
export function AuthNavButton() {
  const [loggedIn, setLoggedIn] = useState(false);

  // Effect hook to check and update login status, and listen for auth changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setLoggedIn(Boolean(window.sessionStorage.getItem("accessToken")));
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
          USER LOGIN
        </Link>
        <Link className="btn btn-outline" href="/user/register">
          REGISTER
        </Link>
      </div>
    );
  }

  // Renders a logout button if logged in.
  return (
    <button
      onClick={() => {
        clearTokens();
        setLoggedIn(false);
        window.location.assign(withBasePath("/"));
      }}
      className="btn btn-outline"
    >
      LOGOUT
    </button>
  );
}
