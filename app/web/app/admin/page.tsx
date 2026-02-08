"use client";

import { useEffect, useState } from "react";
import { API_BASE, apiFetch, clearTokens, setTokens } from "../../lib/api";
import { withBasePath } from "../../lib/paths";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await apiFetch("/me");
        if (profile.role === "admin") {
          window.location.href = withBasePath("/admin/logged");
        }
      } catch {
        // not logged in, show form
      }
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, portal: "admin" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Login failed");
      setTokens({ accessToken: json.accessToken, refreshToken: json.refreshToken });

      const profile = await apiFetch("/me");
      if (profile.role !== "admin") {
        clearTokens();
        throw new Error("This account is not an admin.");
      }
      window.location.href = withBasePath("/admin/logged");
    } catch (err: any) {
      setError(err.message ?? "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <div className="text-xs tracking-luxe text-brand-muted">ADMIN</div>
        <h1 className="mt-2 font-display text-3xl">Sign In</h1>
      </div>

      <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7 shadow-luxe">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs tracking-[0.22em] text-brand-muted">USERNAME</label>
            <input
              className="mt-2 w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none placeholder:text-brand-muted/60 focus:border-brand-gold/60"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div>
            <label className="text-xs tracking-[0.22em] text-brand-muted">PASSWORD</label>
            <input
              className="mt-2 w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none placeholder:text-brand-muted/60 focus:border-brand-gold/60"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? <div className="text-xs text-red-400">{error}</div> : null}

          <button disabled={loading} className="btn btn-primary btn-block py-3">
            {loading ? "SIGNING IN..." : "ADMIN SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
}
