import { Router } from "express";
import { z } from "zod";
import { getPool } from "../lib/pg.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(["admin"]));

adminRouter.get("/stats", async (_req, res) => {
  const pool = getPool();
  try {
    const [creatorCount, userCount] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM providers"),
      pool.query("SELECT COUNT(*)::int AS count FROM app_accounts WHERE role = 'user'"),
    ]);

    res.json({
      creatorCount: creatorCount.rows[0]?.count ?? 0,
      userCount: userCount.rows[0]?.count ?? 0,
    });
  } catch {
    res.status(500).json({ error: "stats_load_failed" });
  }
});

adminRouter.get("/ads", async (_req, res) => {
  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `
      SELECT slot, image, text
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
    res.json(rows);
  } catch {
    res.status(500).json({ error: "ads_load_failed" });
  }
});

const UpsertAdSchema = z.object({
  slot: z.enum(["home-1", "home-2", "home-3", "bottom"]),
  image: z.string().optional().nullable(),
  text: z.string().optional().nullable(),
});

adminRouter.post("/ads", async (req, res) => {
  const parsed = UpsertAdSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const pool = getPool();
  const item = parsed.data;
  const cleanText = item.slot === "bottom" ? (item.text?.trim() || "Your Ads Here") : null;
  const cleanImage = item.slot === "bottom" ? null : (item.image?.trim() || null);

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO advertising_spaces (slot, image, text)
      VALUES ($1, $2, $3)
      ON CONFLICT (slot) DO UPDATE SET
        image = EXCLUDED.image,
        text = EXCLUDED.text,
        updated_at = NOW()
      RETURNING slot, image, text
      `,
      [item.slot, cleanImage, cleanText]
    );
    await pool.query(
      "INSERT INTO advertising_space_history (slot, image, text, action) VALUES ($1, $2, $3, 'update')",
      [item.slot, cleanImage, cleanText]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: "ads_upsert_failed" });
  }
});

adminRouter.put("/ads/:slot", async (req, res) => {
  const mergedBody = { ...req.body, slot: req.params.slot };
  const parsed = UpsertAdSchema.safeParse(mergedBody);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const pool = getPool();
  const item = parsed.data;
  const cleanText = item.slot === "bottom" ? (item.text?.trim() || "Your Ads Here") : null;
  const cleanImage = item.slot === "bottom" ? null : (item.image?.trim() || null);

  try {
    const { rows } = await pool.query(
      `
      UPDATE advertising_spaces
         SET image = $2,
             text = $3,
             updated_at = NOW()
       WHERE slot = $1
       RETURNING slot, image, text
      `,
      [item.slot, cleanImage, cleanText]
    );
    if (!rows[0]) return res.status(404).json({ error: "not_found" });
    await pool.query(
      "INSERT INTO advertising_space_history (slot, image, text, action) VALUES ($1, $2, $3, 'update')",
      [item.slot, cleanImage, cleanText]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "ads_update_failed" });
  }
});

adminRouter.delete("/ads/:slot", async (req, res) => {
  const slot = req.params.slot;
  if (!["home-1", "home-2", "home-3", "bottom"].includes(slot)) return res.status(400).json({ error: "invalid_slot" });

  const pool = getPool();
  try {
    if (slot === "bottom") {
      await pool.query(
        "UPDATE advertising_spaces SET image = NULL, text = 'Your Ads Here', updated_at = NOW() WHERE slot = 'bottom'"
      );
      await pool.query(
        "INSERT INTO advertising_space_history (slot, image, text, action) VALUES ('bottom', NULL, 'Your Ads Here', 'delete')"
      );
      return res.json({ ok: true });
    }

    await pool.query(
      `
      UPDATE advertising_spaces
         SET image = NULL, text = NULL, updated_at = NOW()
       WHERE slot = $1
      `,
      [slot]
    );
    await pool.query(
      "INSERT INTO advertising_space_history (slot, image, text, action) VALUES ($1, NULL, NULL, 'delete')",
      [slot]
    );
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "ads_delete_failed" });
  }
});
