// This module defines administrative routes for managing application data.
import { Router } from "express";
import { z } from "zod";
import { getPool } from "../lib/pg.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

// Create a new router for admin routes.
export const adminRouter = Router();

// Apply authentication and role-based access control middleware for all admin routes.
// This ensures that only authenticated admin users can access these endpoints.
adminRouter.use(requireAuth, requireRole(["admin"]));

// Route to fetch all user and creator account data for admin overview.
adminRouter.get("/accounts", async (_req, res) => {
  const pool = getPool();
  try {
    const [usersRes, creatorsRes] = await Promise.all([
      pool.query(
        `SELECT id::text AS id, username, password, created_at, updated_at
           FROM app_accounts
          WHERE role = 'user'
          ORDER BY created_at DESC`
      ),
      pool.query(
        `SELECT uuid::text AS id, username, password, temp_password, last_seen, created_at, updated_at
           FROM providers
          ORDER BY created_at DESC`
      ),
    ]);
    res.json({ users: usersRes.rows, creators: creatorsRes.rows });
  } catch {
    res.status(500).json({ error: "accounts_load_failed" });
  }
});

// Zod schema for updating a user account.
const UpdateUserSchema = z.object({
  username: z.string().min(3).max(80).regex(/^[a-zA-Z0-9_]+$/).optional(),
  password: z.string().min(6).max(200).optional(),
});

// Route to update a user account (username / password).
adminRouter.put("/accounts/users/:id", async (req, res) => {
  const parsed = UpdateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  const { username, password } = parsed.data;
  if (!username && !password) return res.status(400).json({ error: "nothing_to_update" });

  const pool = getPool();
  try {
    const setClauses: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [req.params.id];
    if (username) { values.push(username); setClauses.push(`username = $${values.length}`); }
    if (password) { values.push(password); setClauses.push(`password = $${values.length}`); }
    const rowCount = await pool.query(
      `UPDATE app_accounts SET ${setClauses.join(", ")} WHERE id = $1::uuid AND role = 'user'`,
      values
    );
    if (rowCount.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "user_update_failed" });
  }
});

// Route to delete a user account.
adminRouter.delete("/accounts/users/:id", async (req, res) => {
  const pool = getPool();
  try {
    const rowCount = await pool.query(
      `DELETE FROM app_accounts WHERE id = $1::uuid AND role = 'user'`,
      [req.params.id]
    );
    if (rowCount.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "user_delete_failed" });
  }
});

// Zod schema for updating a creator account.
const UpdateCreatorSchema = z.object({
  username: z.string().min(3).max(80).regex(/^[a-zA-Z0-9_]+$/).optional(),
  password: z.string().min(6).max(200).optional(),
  tempPassword: z.string().max(200).optional().nullable(),
});

// Route to update a creator account (username / password / temp_password).
adminRouter.put("/accounts/creators/:id", async (req, res) => {
  const parsed = UpdateCreatorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  const { username, password, tempPassword } = parsed.data;
  if (username === undefined && password === undefined && tempPassword === undefined)
    return res.status(400).json({ error: "nothing_to_update" });

  const pool = getPool();
  try {
    const setClauses: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [req.params.id];
    if (username !== undefined) { values.push(username); setClauses.push(`username = $${values.length}`); }
    if (password !== undefined) { values.push(password); setClauses.push(`password = $${values.length}`); }
    if (tempPassword !== undefined) { values.push(tempPassword ?? null); setClauses.push(`temp_password = $${values.length}`); }
    const rowCount = await pool.query(
      `UPDATE providers SET ${setClauses.join(", ")} WHERE uuid = $1::uuid`,
      values
    );
    if (rowCount.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "creator_update_failed" });
  }
});

// Route to delete a creator account.
adminRouter.delete("/accounts/creators/:id", async (req, res) => {
  const pool = getPool();
  try {
    const rowCount = await pool.query(`DELETE FROM providers WHERE uuid = $1::uuid`, [req.params.id]);
    if (rowCount.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "creator_delete_failed" });
  }
});

// Route to fetch application statistics.
// This includes counts of creators and users.
adminRouter.get("/stats", async (_req, res) => {
  // Get a database connection from the pool.
  const pool = getPool();
  try {
    // Concurrently fetch the total number of providers (creators) and users.
    const [creatorCount, userCount] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM providers"),
      pool.query("SELECT COUNT(*)::int AS count FROM app_accounts WHERE role = 'user'"),
    ]);

    // Return the counts in a JSON response.
    res.json({
      creatorCount: creatorCount.rows[0]?.count ?? 0,
      userCount: userCount.rows[0]?.count ?? 0,
    });
  } catch {
    // If there's an error, return a 500 status with an error message.
    res.status(500).json({ error: "stats_load_failed" });
  }
});

// Route to fetch advertising spaces.
// This retrieves all the ad spaces to be displayed in the admin panel.
adminRouter.get("/ads", async (_req, res) => {
  const pool = getPool();
  try {
    // Fetch ad spaces from the database, ordered by their slot position.
    const { rows } = await pool.query(
      `
      SELECT slot, image, text, link_url
        FROM advertising_spaces
       WHERE slot IN ('home-1', 'home-2', 'home-3', 'bottom')
       ORDER BY CASE slot
          WHEN 'home-1' THEN 1
          WHEN 'home-2' THEN 2
          WHEN 'home-3' THEN 3
          WHEN 'bottom' THEN 4
          ELSE 5
       END
      `
    );
    // Return the ad spaces as a JSON array.
    res.json(rows);
  } catch {
    res.status(500).json({ error: "ads_load_failed" });
  }
});

// Zod schema for validating advertising space upsert data.
// This ensures that the request body has the correct shape and data types.
const UpsertAdSchema = z.object({
  slot: z.enum(["home-1", "home-2", "home-3", "bottom"]),
  image: z.string().optional().nullable(),
  text: z.string().optional().nullable(),
  link_url: z.string().optional().nullable(),
});

// Normalizes a URL for an ad link.
// It ensures the URL is valid and has an http/https protocol.
const normalizeLinkUrl = (slot: "home-1" | "home-2" | "home-3" | "bottom", value?: string | null) => {
  // The 'bottom' slot does not have a link URL.
  if (slot === "bottom") return null;
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

// Route to create or update an advertising space.
// This is an "upsert" operation: it creates a new ad space if it doesn't exist,
// or updates it if it does.
adminRouter.post("/ads", async (req, res) => {
  // Validate the request body against the Zod schema.
  const parsed = UpsertAdSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const pool = getPool();
  const item = parsed.data;
  // Sanitize and normalize the input data.
  const cleanText = item.slot === "bottom" ? (item.text?.trim() || "Your Ads Here") : null;
  const cleanImage = item.slot === "bottom" ? null : (item.image?.trim() || null);
  const cleanLinkUrl = normalizeLinkUrl(item.slot, item.link_url);
  // Validate the link URL.
  if (item.slot !== "bottom" && item.link_url?.trim() && !cleanLinkUrl) {
    return res.status(400).json({ error: "invalid_link_url" });
  }

  try {
    // Perform the upsert operation in the database.
    const { rows } = await pool.query(
      `
      INSERT INTO advertising_spaces (slot, image, text, link_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slot) DO UPDATE SET
        image = EXCLUDED.image,
        text = EXCLUDED.text,
        link_url = EXCLUDED.link_url,
        updated_at = NOW()
      RETURNING slot, image, text, link_url
      `,
      [item.slot, cleanImage, cleanText, cleanLinkUrl]
    );
    // Record the change in the history table.
    await pool.query(
      "INSERT INTO advertising_space_history (slot, image, text, link_url, action) VALUES ($1, $2, $3, $4, 'update')",
      [item.slot, cleanImage, cleanText, cleanLinkUrl]
    );
    // Return the newly created or updated ad space.
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: "ads_upsert_failed" });
  }
});

// Route to update an advertising space by slot.
adminRouter.put("/ads/:slot", async (req, res) => {
  // Merge the request body and the slot from the URL parameters.
  const mergedBody = { ...req.body, slot: req.params.slot };
  // Validate the merged data.
  const parsed = UpsertAdSchema.safeParse(mergedBody);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const pool = getPool();
  const item = parsed.data;
  // Sanitize and normalize the input data.
  const cleanText = item.slot === "bottom" ? (item.text?.trim() || "Your Ads Here") : null;
  const cleanImage = item.slot === "bottom" ? null : (item.image?.trim() || null);
  const cleanLinkUrl = normalizeLinkUrl(item.slot, item.link_url);
  // Validate the link URL.
  if (item.slot !== "bottom" && item.link_url?.trim() && !cleanLinkUrl) {
    return res.status(400).json({ error: "invalid_link_url" });
  }

  try {
    // Update the ad space in the database.
    const { rows } = await pool.query(
      `
      UPDATE advertising_spaces
         SET image = $2,
             text = $3,
             link_url = $4,
             updated_at = NOW()
       WHERE slot = $1
       RETURNING slot, image, text, link_url
      `,
      [item.slot, cleanImage, cleanText, cleanLinkUrl]
    );
    // If no row was updated, the ad space was not found.
    if (!rows[0]) return res.status(404).json({ error: "not_found" });
    // Record the change in the history table.
    await pool.query(
      "INSERT INTO advertising_space_history (slot, image, text, link_url, action) VALUES ($1, $2, $3, $4, 'update')",
      [item.slot, cleanImage, cleanText, cleanLinkUrl]
    );
    // Return the updated ad space.
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "ads_update_failed" });
  }
});

// Route to delete (clear) an advertising space by slot.
adminRouter.delete("/ads/:slot", async (req, res) => {
  const slot = req.params.slot;
  // Validate the slot parameter.
  if (!["home-1", "home-2", "home-3", "bottom"].includes(slot)) return res.status(400).json({ error: "invalid_slot" });

  const pool = getPool();
  try {
    // For the 'bottom' slot, reset it to its default state.
    if (slot === "bottom") {
      await pool.query(
        "UPDATE advertising_spaces SET image = NULL, text = 'Your Ads Here', link_url = NULL, updated_at = NOW() WHERE slot = 'bottom'"
      );
      // Record the change in the history table.
      await pool.query(
        "INSERT INTO advertising_space_history (slot, image, text, link_url, action) VALUES ('bottom', NULL, 'Your Ads Here', NULL, 'delete')"
      );
      return res.json({ ok: true });
    }

    // For other slots, clear their content.
    await pool.query(
      `
      UPDATE advertising_spaces
         SET image = NULL, text = NULL, link_url = NULL, updated_at = NOW()
       WHERE slot = $1
      `,
      [slot]
    );
    // Record the change in the history table.
    await pool.query(
      "INSERT INTO advertising_space_history (slot, image, text, link_url, action) VALUES ($1, NULL, NULL, NULL, 'delete')",
      [slot]
    );
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "ads_delete_failed" });
  }
});
