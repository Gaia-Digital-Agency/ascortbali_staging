import { Router } from "express";
import { z } from "zod";
import { hmacIp } from "../lib/security.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { getPool } from "../lib/pg.js";

export const analyticsRouter = Router();

let analyticsTableReady = false;

async function ensureAnalyticsTable() {
  if (analyticsTableReady) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitor_analytics (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ip_hash TEXT UNIQUE NOT NULL,
      country VARCHAR(80),
      city VARCHAR(80),
      user_agent VARCHAR(300),
      first_seen TIMESTAMP NOT NULL DEFAULT NOW(),
      last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
      total_visits INTEGER NOT NULL DEFAULT 1
    )
  `);
  analyticsTableReady = true;
}

const VisitSchema = z.object({
  country: z.string().max(80).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  userAgent: z.string().max(300).optional().nullable(),
});

analyticsRouter.post("/visit", async (req, res) => {
  const parsed = VisitSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  try {
    await ensureAnalyticsTable();
    const pool = getPool();
    const ip = req.ip || "0.0.0.0";
    const ipHash = hmacIp(ip);
    const country = parsed.data.country ?? null;
    const city = parsed.data.city ?? null;
    const userAgent = parsed.data.userAgent ?? null;

    const result = await pool.query(
      `
      INSERT INTO visitor_analytics (ip_hash, country, city, user_agent, first_seen, last_seen, total_visits)
      VALUES ($1, $2, $3, $4, NOW(), NOW(), 1)
      ON CONFLICT (ip_hash) DO UPDATE SET
        country = COALESCE(EXCLUDED.country, visitor_analytics.country),
        city = COALESCE(EXCLUDED.city, visitor_analytics.city),
        user_agent = COALESCE(EXCLUDED.user_agent, visitor_analytics.user_agent),
        last_seen = NOW(),
        total_visits = visitor_analytics.total_visits + 1
      RETURNING id::text AS id
      `,
      [ipHash, country, city, userAgent]
    );

    return res.json({ visitorId: result.rows[0]?.id ?? null });
  } catch {
    // Never crash API because analytics is non-critical
    return res.json({ visitorId: null });
  }
});

analyticsRouter.get("/status", async (req, res) => {
  try {
    await ensureAnalyticsTable();
    const pool = getPool();
    const ip = req.ip || "0.0.0.0";
    const ipHash = hmacIp(ip);

    const [countRes, visitorRes] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM visitor_analytics"),
      pool.query("SELECT city, country FROM visitor_analytics WHERE ip_hash = $1 LIMIT 1", [ipHash]),
    ]);

    const visitorCount = countRes.rows[0]?.count ?? 0;
    const visitor = visitorRes.rows[0];
    const location = [visitor?.city, visitor?.country].filter(Boolean).join(", ") || "Unknown";

    return res.json({ visitorCount, ip, location });
  } catch {
    return res.json({ visitorCount: 0, ip: req.ip || "0.0.0.0", location: "Unknown" });
  }
});

const LinkSchema = z.object({
  visitorId: z.string().uuid(),
});

analyticsRouter.post("/link", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = LinkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  // This MVP keeps link as no-op to avoid schema mismatch with legacy Prisma models.
  return res.json({ ok: true, userId: req.user!.id, visitorId: parsed.data.visitorId });
});
