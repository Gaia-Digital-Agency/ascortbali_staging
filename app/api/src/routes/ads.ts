import { Router } from "express";
import { getPool } from "../lib/pg.js";

export const adsRouter = Router();

adsRouter.get("/", async (_req, res) => {
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
