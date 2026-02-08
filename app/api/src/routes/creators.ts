import { Router } from "express";
import { getPool } from "../lib/pg.js";

export const creatorsRouter = Router();

creatorsRouter.get("/", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 100);
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const offset = (page - 1) * limit;
  const pool = getPool();
  try {
    const [rowsRes, countRes] = await Promise.all([
      pool.query(
      `SELECT p.uuid,
              p.provider_id,
              p.title,
              p.model_name,
              p.age,
              p.gender,
              p.nationality,
              p.orientation,
              p.height,
              p.bust_size,
              p.city,
              p.country,
              p.url,
              p.username,
              img.image_file
         FROM providers p
    LEFT JOIN LATERAL (
           SELECT image_file
             FROM provider_images
            WHERE provider_uuid = p.uuid
            ORDER BY sequence_number ASC, image_id ASC
            LIMIT 1
         ) AS img ON true
        ORDER BY p.created_at DESC
        LIMIT $1
       OFFSET $2`,
      [limit, offset]
    ),
      pool.query("SELECT COUNT(*)::int AS total FROM providers"),
    ]);
    res.json({
      items: rowsRes.rows,
      page,
      pageSize: limit,
      total: countRes.rows[0]?.total ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load creators" });
  }
});

creatorsRouter.get("/:uuid", async (req, res) => {
  const { uuid } = req.params;
  const pool = getPool();
  try {
    const creatorRes = await pool.query(
      `SELECT p.*
         FROM providers p
        WHERE p.uuid = $1`,
      [uuid]
    );
    if (creatorRes.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    const imagesRes = await pool.query(
      `SELECT image_id, image_file, sequence_number
         FROM provider_images
        WHERE provider_uuid = $1
        ORDER BY sequence_number ASC, image_id ASC`,
      [uuid]
    );

    return res.json({
      creator: creatorRes.rows[0],
      images: imagesRes.rows,
    });
  } catch {
    return res.status(500).json({ error: "Failed to load creator" });
  }
});
