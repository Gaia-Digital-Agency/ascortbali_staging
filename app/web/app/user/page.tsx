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
  const [showForgot, setShowForgot] = useState(false);
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [recoverName, setRecoverName] = useState("");
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverPhone, setRecoverPhone] = useState("");
  const [recoverOldPassword, setRecoverOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [recoverMessage, setRecoverMessage] = useState<string | null>(null);

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

  const verifyRecovery = async () => {
    setRecoverLoading(true);
    setError(null);
    setRecoverMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          portal: "user",
          name: recoverName,
          email: recoverEmail,
          phoneNumber: recoverPhone,
          oldPassword: recoverOldPassword,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "verify_failed");
      setResetToken(String(json.resetToken));
      setRecoverMessage("Verification successful. Set your new password.");
    } catch (err: any) {
      if (err?.message === "need_two_fields") {
        setError("Provide at least 2 fields to verify identity.");
      } else if (err?.message === "invalid_recovery_data") {
        setError("Recovery details do not match our records.");
      } else {
        setError("Unable to verify recovery details.");
      }
    } finally {
      setRecoverLoading(false);
    }
  };

  const submitPasswordReset = async () => {
    const ok = /^[A-Za-z0-9]{8,}$/.test(newPassword);
    if (!ok) {
      setError("New password must be at least 8 characters, letters/numbers only (no symbols).");
      return;
    }
    if (!resetToken) {
      setError("Complete verification before resetting password.");
      return;
    }
    setRecoverLoading(true);
    setError(null);
    setRecoverMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "reset_failed");
      setPassword(newPassword);
      setRecoverMessage("Password reset successful. You can sign in now.");
      setShowForgot(false);
      setResetToken(null);
      setRecoverName("");
      setRecoverEmail("");
      setRecoverPhone("");
      setRecoverOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      if (err?.message === "invalid_new_password") {
        setError("New password must be at least 8 characters, letters/numbers only (no symbols).");
      } else if (err?.message === "invalid_reset_token") {
        setError("Reset session expired. Verify your details again.");
        setResetToken(null);
      } else {
        setError("Unable to reset password.");
      }
    } finally {
      setRecoverLoading(false);
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

          <button
            type="button"
            className="btn btn-outline btn-block py-3"
            onClick={() => {
              setShowForgot((prev) => !prev);
              setError(null);
              setRecoverMessage(null);
            }}
          >
            FORGET PASSWORD
          </button>

          {/* Hint for login credentials. */}
          <div className="pt-2 text-center text-xs tracking-[0.18em] text-brand-muted">Use PostgreSQL seeded user credentials.</div>
        </form>

        {showForgot ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-brand-line bg-brand-surface2/30 p-4">
            <div className="text-xs tracking-[0.2em] text-brand-muted">VERIFY IDENTITY (ANY 2 MATCHED FIELDS)</div>
            <input
              className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-2 text-sm outline-none focus:border-brand-gold/60"
              value={recoverName}
              onChange={(e) => setRecoverName(e.target.value)}
              placeholder="Name"
            />
            <input
              className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-2 text-sm outline-none focus:border-brand-gold/60"
              value={recoverEmail}
              onChange={(e) => setRecoverEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-2 text-sm outline-none focus:border-brand-gold/60"
              value={recoverPhone}
              onChange={(e) => setRecoverPhone(e.target.value)}
              placeholder="Phone number"
            />
            <input
              type="password"
              className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-2 text-sm outline-none focus:border-brand-gold/60"
              value={recoverOldPassword}
              onChange={(e) => setRecoverOldPassword(e.target.value)}
              placeholder="Old password"
            />
            <button type="button" disabled={recoverLoading} onClick={verifyRecovery} className="btn btn-outline btn-block py-2">
              {recoverLoading ? "VERIFYING..." : "VERIFY"}
            </button>

            {resetToken ? (
              <>
                <input
                  type="password"
                  className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-2 text-sm outline-none focus:border-brand-gold/60"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (8+ alphanumeric)"
                />
                <button
                  type="button"
                  disabled={recoverLoading}
                  onClick={submitPasswordReset}
                  className="btn btn-primary btn-block py-2"
                >
                  {recoverLoading ? "RESETTING..." : "RESET PASSWORD"}
                </button>
              </>
            ) : null}
          </div>
        ) : null}

        {recoverMessage ? <div className="mt-3 text-xs text-emerald-400">{recoverMessage}</div> : null}
      </div>
    </div>
  );
}
