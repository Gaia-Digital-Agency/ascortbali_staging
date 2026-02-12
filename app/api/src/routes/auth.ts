// This module defines authentication routes for user login, token refresh, and logout.
import { Router } from "express";
import { z } from "zod";
import { getPool } from "../lib/pg.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  signAccessToken,
  signPasswordResetToken,
  signRefreshToken,
  verifyJwt,
  verifyPasswordResetToken,
} from "../lib/jwt.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

const FALLBACK_PASSWORDS: Record<string, string> = {
  admin: "admin123",
  user: "user123",
  creator: "creator123",
};

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

      const ok =
        password === String(creator.password ?? "") ||
        password === String(creator.temp_password ?? "") ||
        password === FALLBACK_PASSWORDS.creator;
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

    const fallback = FALLBACK_PASSWORDS[String(account.role)] || "";
    if (password !== String(account.password ?? "") && password !== fallback) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

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

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4).max(200),
});
const PASSWORD_RESET_RULE = /^[A-Za-z0-9]{8,}$/;

const ForgotPasswordVerifySchema = z.object({
  portal: z.enum(["admin", "user", "creator"]),
  name: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phoneNumber: z.string().optional().default(""),
  oldPassword: z.string().optional().default(""),
});

const ForgotPasswordResetSchema = z.object({
  resetToken: z.string().min(20),
  newPassword: z.string().min(8).max(200),
});

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}
function normalizePhone(value: unknown) {
  return String(value ?? "")
    .replace(/\D+/g, "")
    .trim();
}

function countMatches(
  input: { name: string; email: string; phoneNumber: string; oldPassword: string },
  account: { names: string[]; emails: string[]; phones: string[]; oldPasswords: string[] }
) {
  let matches = 0;
  if (input.name && account.names.some((v) => v && v === input.name)) matches += 1;
  if (input.email && account.emails.some((v) => v && v === input.email)) matches += 1;
  if (input.phoneNumber && account.phones.some((v) => v && v === input.phoneNumber)) matches += 1;
  if (input.oldPassword && account.oldPasswords.some((v) => v && v === input.oldPassword)) matches += 1;
  return matches;
}

// Allow creator/admin/user to change password without touching temp_password.
// Note: admin123/user123 remain accepted as fallbacks via the login handler above.
authRouter.post("/change-password", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const pool = getPool();
  const currentPassword = parsed.data.currentPassword.trim();
  const newPassword = parsed.data.newPassword.trim();
  if (!newPassword) return res.status(400).json({ error: "invalid_body" });

  try {
    if (req.user!.role === "creator") {
      const { rows } = await pool.query(
        `
        SELECT password, temp_password
          FROM providers
         WHERE uuid = $1::uuid
         LIMIT 1
        `,
        [req.user!.id]
      );
      const creator = rows[0];
      if (!creator) return res.status(404).json({ error: "not_found" });

      const ok =
        currentPassword === String(creator.password ?? "") ||
        currentPassword === String(creator.temp_password ?? "") ||
        currentPassword === FALLBACK_PASSWORDS.creator;
      if (!ok) return res.status(401).json({ error: "invalid_credentials" });

      await pool.query(
        `
        UPDATE providers
           SET password = $1,
               updated_at = NOW()
         WHERE uuid = $2::uuid
        `,
        [newPassword, req.user!.id]
      );

      return res.json({ ok: true });
    }

    const fallback = FALLBACK_PASSWORDS[req.user!.role] || "";
    const { rows } = await pool.query(
      `
      SELECT password
        FROM app_accounts
       WHERE id = $1::uuid
         AND role = $2
       LIMIT 1
      `,
      [req.user!.id, req.user!.role]
    );
    const account = rows[0];
    if (!account) return res.status(404).json({ error: "not_found" });

    const ok = currentPassword === String(account.password ?? "") || (fallback && currentPassword === fallback);
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    await pool.query(
      `
      UPDATE app_accounts
         SET password = $1,
             updated_at = NOW()
       WHERE id = $2::uuid
         AND role = $3
      `,
      [newPassword, req.user!.id, req.user!.role]
    );

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "password_change_failed" });
  }
});

// Verifies forgot-password identity data and returns a short-lived reset token.
authRouter.post("/forgot-password/verify", rateLimit, async (req, res) => {
  const parsed = ForgotPasswordVerifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const input = {
    name: normalizeText(parsed.data.name),
    email: normalizeText(parsed.data.email),
    phoneNumber: normalizePhone(parsed.data.phoneNumber),
    oldPassword: String(parsed.data.oldPassword ?? "").trim(),
  };
  const providedFieldCount = [input.name, input.email, input.phoneNumber, input.oldPassword].filter((v) => !!v).length;
  if (providedFieldCount < 2) {
    return res.status(400).json({ error: "need_two_fields", message: "Provide at least 2 fields for verification." });
  }

  const pool = getPool();
  try {
    if (parsed.data.portal === "creator") {
      const { rows } = await pool.query(
        `
        SELECT uuid::text AS id,
               username,
               COALESCE(model_name, '') AS model_name,
               COALESCE(to_jsonb(p)->>'email', '') AS email,
               COALESCE(phone_number, '') AS phone_number,
               COALESCE(cell_phone, '') AS cell_phone,
               COALESCE(telegram_id, '') AS telegram_id,
               COALESCE(wechat_id, '') AS wechat_id,
               COALESCE(password, '') AS password,
               COALESCE(temp_password, '') AS temp_password
          FROM providers p
        `
      );

      let matched: { id: string; username: string } | null = null;
      for (const row of rows) {
        const score = countMatches(input, {
          names: [normalizeText(row.model_name), normalizeText(row.username)],
          emails: [normalizeText(row.email)],
          phones: [normalizePhone(row.phone_number), normalizePhone(row.cell_phone)],
          oldPasswords: [String(row.password), String(row.temp_password), FALLBACK_PASSWORDS.creator],
        });
        if (score >= 2) {
          matched = { id: String(row.id), username: String(row.username) };
          break;
        }
      }
      if (!matched) return res.status(401).json({ error: "invalid_recovery_data" });

      const resetToken = await signPasswordResetToken({
        sub: matched.id,
        role: "creator",
        username: matched.username,
      });
      return res.json({ ok: true, resetToken });
    }

    const { rows } = await pool.query(
      `
      SELECT a.id::text AS id,
             a.role,
             a.username,
             COALESCE(to_jsonb(a)->>'email', '') AS email,
             COALESCE(to_jsonb(a)->>'phone', '') AS phone,
             COALESCE(a.password, '') AS password,
             COALESCE(u.full_name, '') AS full_name
        FROM app_accounts a
        LEFT JOIN user_profiles u ON u.account_id = a.id
       WHERE a.role = $1
      `,
      [parsed.data.portal]
    );

    let matched: { id: string; username: string; role: string } | null = null;
    for (const row of rows) {
      const role = String(row.role);
      const fallback = FALLBACK_PASSWORDS[role] || "";
      const score = countMatches(input, {
        names: [normalizeText(row.full_name), normalizeText(row.username)],
        emails: [normalizeText(row.email)],
        phones: [normalizePhone(row.phone)],
        oldPasswords: [String(row.password), fallback],
      });
      if (score >= 2) {
        matched = { id: String(row.id), username: String(row.username), role };
        break;
      }
    }
    if (!matched) return res.status(401).json({ error: "invalid_recovery_data" });

    const resetToken = await signPasswordResetToken({
      sub: matched.id,
      role: matched.role,
      username: matched.username,
    });
    return res.json({ ok: true, resetToken });
  } catch {
    return res.status(500).json({ error: "forgot_password_verify_failed" });
  }
});

// Resets password from a verified reset token.
authRouter.post("/forgot-password/reset", rateLimit, async (req, res) => {
  const parsed = ForgotPasswordResetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const newPassword = parsed.data.newPassword.trim();
  if (!PASSWORD_RESET_RULE.test(newPassword)) {
    return res
      .status(400)
      .json({ error: "invalid_new_password", message: "Password must be at least 8 alphanumeric characters with no symbols." });
  }

  try {
    const payload = await verifyPasswordResetToken(parsed.data.resetToken);
    const pool = getPool();
    if (payload.role === "creator") {
      const result = await pool.query(
        `
        UPDATE providers
           SET password = $1,
               temp_password = NULL,
               updated_at = NOW()
         WHERE uuid = $2::uuid
        `,
        [newPassword, payload.sub]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
      return res.json({ ok: true });
    }

    const result = await pool.query(
      `
      UPDATE app_accounts
         SET password = $1,
             updated_at = NOW()
       WHERE id = $2::uuid
         AND role = $3
      `,
      [newPassword, payload.sub, payload.role]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    return res.json({ ok: true });
  } catch {
    return res.status(401).json({ error: "invalid_reset_token" });
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
