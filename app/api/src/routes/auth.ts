// This module defines authentication routes for user login, token refresh, and logout.
import { Router } from "express";
import { z } from "zod";
import { getPool } from "../lib/pg.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { signAccessToken, signRefreshToken, verifyJwt } from "../lib/jwt.js";

export const authRouter = Router();

// Zod schema for validating login credentials.
const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  portal: z.enum(["admin", "user", "creator"]),
});

// POST route for user login.
authRouter.post("/login", rateLimit, async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  }

  const pool = getPool();
  const username = parsed.data.username.trim().toLowerCase();
  const password = parsed.data.password.trim();

  try {
    // Handle creator login.
    if (parsed.data.portal === "creator") {
      const { rows } = await pool.query(
        `
        SELECT uuid::text AS id,
               username,
               password,
               temp_password
          FROM providers
         WHERE LOWER(username) = $1
        `,
        [username]
      );

      const creator = rows[0];
      if (!creator) return res.status(401).json({ error: "invalid_credentials" });

      const ok = password === String(creator.password ?? "") || password === String(creator.temp_password ?? "");
      if (!ok) return res.status(401).json({ error: "invalid_credentials" });

      const payload = { sub: creator.id, role: "creator", username: String(creator.username) };
      const accessToken = await signAccessToken(payload);
      const refreshToken = await signRefreshToken(payload);
      return res.json({ accessToken, refreshToken });
    }

    // Handle admin/user login.
    const { rows } = await pool.query(
      `
      SELECT id::text AS id, role, username, password
        FROM app_accounts
       WHERE LOWER(username) = $1
         AND role = $2
      `,
      [username, parsed.data.portal]
    );

    const account = rows[0];
    if (!account) return res.status(401).json({ error: "invalid_credentials" });
    if (password !== String(account.password ?? "")) return res.status(401).json({ error: "invalid_credentials" });

    const payload = {
      sub: account.id,
      role: String(account.role),
      username: String(account.username),
    };
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);
    return res.json({ accessToken, refreshToken });
  } catch {
    return res.status(500).json({ error: "login_failed" });
  }
});

// Zod schema for validating refresh token request.
const RefreshSchema = z.object({ refreshToken: z.string().min(10) });

// POST route for refreshing access tokens using a refresh token.
authRouter.post("/refresh", rateLimit, async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  try {
    const verified = await verifyJwt(parsed.data.refreshToken);
    const payload = { sub: verified.sub, role: verified.role, username: verified.username };
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);
    return res.json({ accessToken, refreshToken });
  } catch {
    return res.status(401).json({ error: "invalid_refresh" });
  }
});

// POST route for user logout (currently a no-op).
authRouter.post("/logout", async (_req, res) => {
  res.json({ ok: true });
});
