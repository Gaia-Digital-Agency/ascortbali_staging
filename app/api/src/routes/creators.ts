// Defines routes for fetching creator data.
import { Router } from "express";
import { getPool } from "../lib/pg.js";

export const creatorsRouter = Router();

// Route to get a paginated list of creators.
creatorsRouter.get("/", async (req, res) => {
  // The homepage requests up to 500 creators in one call. Keep a sane cap, but
  // don't silently truncate to 100 which makes "auto-added" cards appear missing.
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 500);
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const offset = (page - 1) * limit;
  const pool = getPool();
  try {
    const [rowsRes, countRes] = await Promise.all([
      // Query for a paginated list of creators with their primary image.
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
        ORDER BY (img.image_file IS NULL) ASC, p.created_at DESC
        LIMIT $1
       OFFSET $2`,
      [limit, offset]
    ),
      // Query for the total number of creators.
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

// Route to get a single creator by their UUID.
creatorsRouter.get("/:uuid", async (req, res) => {
  const { uuid } = req.params;
  const pool = getPool();
  try {
    // Query for the creator's details.
    const creatorRes = await pool.query(
      `SELECT p.*
         FROM providers p
        WHERE p.uuid = $1::uuid`,
      [uuid]
    );
    if (creatorRes.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    // Query for all of the creator's images.
    const imagesRes = await pool.query(
      `SELECT image_id, image_file, sequence_number
         FROM provider_images
        WHERE provider_uuid = $1::uuid
        ORDER BY sequence_number ASC, image_id ASC`,
      [uuid]
    );

    return res.json({
      creator: creatorRes.rows[0],
      images: imagesRes.rows,
    });
  } catch (err) {
    console.error("GET /creators/:uuid failed", { uuid, err });
    return res.status(500).json({ error: "Failed to load creator" });
  }
});
