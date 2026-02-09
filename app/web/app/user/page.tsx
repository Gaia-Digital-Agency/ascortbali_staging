// This module defines the User Login page component.
"use client";

import { useState } from "react";
import { API_BASE, apiFetch, setTokens } from "../../lib/api";
import { withBasePath } from "../../lib/paths";

// UserLoginPage functional component.
export default function UserLoginPage() {
  // State variables for username, password, loading status, and error messages.
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("user123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handles the form submission for user login.
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Send login request to the API.
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, portal: "user" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Login failed");
      // Store access and refresh tokens.
      setTokens({ accessToken: json.accessToken, refreshToken: json.refreshToken });

      // Verify account role and redirect to the user dashboard.
      const profile = await apiFetch("/me");
      if (profile.role !== "user") {
        throw new Error("This account is not a user account.");
      }
      window.location.href = withBasePath("/user/logged");
    } catch (err: any) {
      setError(err.message ?? "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* Page header section. */}
      <div className="text-center">
        <div className="text-xs tracking-luxe text-brand-muted">USER</div>
        <h1 className="mt-2 font-display text-3xl">Sign In</h1>
      </div>

      {/* Login form. */}
      <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7 shadow-luxe">
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Username input field. */}
          <div>
            <label className="text-xs tracking-[0.22em] text-brand-muted">USERNAME</label>
            <input
              className="mt-2 w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none placeholder:text-brand-muted/60 focus:border-brand-gold/60"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user"
            />
          </div>

          {/* Password input field. */}
          <div>
            <label className="text-xs tracking-[0.22em] text-brand-muted">PASSWORD</label>
            <input
              className="mt-2 w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none placeholder:text-brand-muted/60 focus:border-brand-gold/60"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Error message display. */}
          {error ? <div className="text-xs text-red-400">{error}</div> : null}

          {/* Submit button. */}
          <button disabled={loading} className="btn btn-primary btn-block py-3">
            {loading ? "SIGNING IN..." : "USER SIGN IN"}
          </button>

          {/* Hint for login credentials. */}
          <div className="pt-2 text-center text-xs tracking-[0.18em] text-brand-muted">Use PostgreSQL seeded user credentials.</div>
        </form>
      </div>
    </div>
  );
}
