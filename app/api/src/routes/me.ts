// This module defines routes for authenticated users to manage their profiles and data.
import { Router } from "express";
import { z } from "zod";
import { getPool } from "../lib/pg.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

export const meRouter = Router();

// Route to get the currently authenticated user's basic information.
meRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  res.json({
    id: req.user!.id,
    role: req.user!.role,
    username: req.user!.username,
  });
});

// Zod schema for validating user profile data.
const UserProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  gender: z.enum(["female", "male", "transgender"]),
  ageGroup: z.enum(["18-24", "25-34", "35-44", "45+"]),
  nationality: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  preferredContact: z.enum(["whatsapp", "telegram", "wechat"]),
  relationshipStatus: z.enum(["single", "married", "other"]),
});

// Route to get the authenticated user's profile details.
meRouter.get("/user-profile", requireAuth, requireRole(["user"]), async (req: AuthedRequest, res) => {
  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `
      SELECT full_name,
             gender,
             age_group,
             nationality,
             city,
             preferred_contact,
             relationship_status
        FROM user_profiles
       WHERE account_id = $1::uuid
      `,
      [req.user!.id]
    );

    if (!rows[0]) return res.status(404).json({ error: "not_found" });

    return res.json({
      fullName: rows[0].full_name,
      gender: rows[0].gender,
      ageGroup: rows[0].age_group,
      nationality: rows[0].nationality,
      city: rows[0].city,
      preferredContact: rows[0].preferred_contact,
      relationshipStatus: rows[0].relationship_status,
    });
  } catch {
    return res.status(500).json({ error: "profile_load_failed" });
  }
});

// Route to update or create the authenticated user's profile.
meRouter.put("/user-profile", requireAuth, requireRole(["user"]), async (req: AuthedRequest, res) => {
  const parsed = UserProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const pool = getPool();
  const p = parsed.data;
  try {
    const { rows } = await pool.query(
      `
      INSERT INTO user_profiles (
        account_id, full_name, gender, age_group, nationality, city, preferred_contact, relationship_status
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (account_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        gender = EXCLUDED.gender,
        age_group = EXCLUDED.age_group,
        nationality = EXCLUDED.nationality,
        city = EXCLUDED.city,
        preferred_contact = EXCLUDED.preferred_contact,
        relationship_status = EXCLUDED.relationship_status,
        updated_at = NOW()
      RETURNING full_name, gender, age_group, nationality, city, preferred_contact, relationship_status
      `,
      [req.user!.id, p.fullName, p.gender, p.ageGroup, p.nationality, p.city, p.preferredContact, p.relationshipStatus]
    );
    return res.json({
      fullName: rows[0].full_name,
      gender: rows[0].gender,
      ageGroup: rows[0].age_group,
      nationality: rows[0].nationality,
      city: rows[0].city,
      preferredContact: rows[0].preferred_contact,
      relationshipStatus: rows[0].relationship_status,
    });
  } catch {
    return res.status(500).json({ error: "profile_save_failed" });
  }
});

// Zod schema for validating creator profile data.
const CreatorProfileSchema = z.object({
  title: z.string().max(255),
  url: z.string().max(2000),
  tempPassword: z.string().max(100),
  lastSeen: z.string().max(40),
  notes: z.string().max(4000),
  modelName: z.string().min(2).max(100),
  gender: z.enum(["female", "male", "transgender"]),
  age: z.coerce.number().int().min(18).max(70),
  location: z.string().max(100),
  eyes: z.string().max(20),
  hairColor: z.string().max(30),
  hairLength: z.string().max(20),
  pubicHair: z.string().max(20),
  bustSize: z.string().max(10),
  bustType: z.string().max(20),
  travel: z.string().max(50),
  weight: z.string().max(30),
  height: z.string().max(30),
  ethnicity: z.string().max(50),
  nationality: z.string().min(2).max(50),
  languages: z.string().max(400),
  phoneNumber: z.string().max(50),
  cellPhone: z.string().max(50),
  country: z.string().min(2).max(50),
  city: z.string().min(2).max(50),
  orientation: z.enum(["straight", "bisexual", "lesbian", "gay", "other"]),
  smoker: z.enum(["yes", "no"]),
  tattoo: z.enum(["yes", "no"]),
  piercing: z.enum(["yes", "no"]),
  services: z.string().min(2),
  meetingWith: z.enum(["men", "women", "couples", "all"]),
  availableFor: z.enum(["incall", "outcall", "both"]),
});

// Route to get the authenticated creator's profile details.
meRouter.get("/creator-profile", requireAuth, requireRole(["creator"]), async (req: AuthedRequest, res) => {
  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `
      SELECT uuid::text AS uuid,
             provider_id,
             username,
             title,
             url,
             temp_password,
             last_seen,
             notes,
             model_name,
             gender,
             age,
             location,
             eyes,
             hair_color,
             hair_length,
             pubic_hair,
             bust_size,
             bust_type,
             travel,
             weight,
             height,
             ethnicity,
             nationality,
             languages,
             phone_number,
             cell_phone,
             country,
             city,
             orientation,
             smoker,
             tattoo,
             piercing,
             services,
             meeting_with,
             available_for
        FROM providers
       WHERE uuid = $1::uuid
      `,
      [req.user!.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "not_found" });
    return res.json(rows[0]);
  } catch {
    return res.status(500).json({ error: "creator_load_failed" });
  }
});

// Route to update the authenticated creator's profile.
meRouter.put("/creator-profile", requireAuth, requireRole(["creator"]), async (req: AuthedRequest, res) => {
  const parsed = CreatorProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const p = parsed.data;
  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `
      UPDATE providers
         SET title = $2,
             url = $3,
             temp_password = $4,
             last_seen = $5,
             notes = $6,
             model_name = $7,
             gender = $8,
             age = $9,
             location = $10,
             eyes = $11,
             hair_color = $12,
             hair_length = $13,
             pubic_hair = $14,
             bust_size = $15,
             bust_type = $16,
             travel = $17,
             weight = $18,
             height = $19,
             ethnicity = $20,
             nationality = $21,
             languages = $22,
             phone_number = $23,
             cell_phone = $24,
             country = $25,
             city = $26,
             orientation = $27,
             smoker = $28,
             tattoo = $29,
             piercing = $30,
             services = $31,
             meeting_with = $32,
             available_for = $33,
             updated_at = NOW()
       WHERE uuid = $1::uuid
       RETURNING uuid::text AS uuid,
                 provider_id,
                 username,
                 title,
                 url,
                 temp_password,
                 last_seen,
                 notes,
                 model_name,
                 gender,
                 age,
                 location,
                 eyes,
                 hair_color,
                 hair_length,
                 pubic_hair,
                 bust_size,
                 bust_type,
                 travel,
                 weight,
                 height,
                 ethnicity,
                 nationality,
                 languages,
                 phone_number,
                 cell_phone,
                 country,
                 city,
                 orientation,
                 smoker,
                 tattoo,
                 piercing,
                 services,
                 meeting_with,
                 available_for
      `,
      [
        req.user!.id,
        p.title,
        p.url,
        p.tempPassword,
        p.lastSeen,
        p.notes,
        p.modelName,
        p.gender,
        p.age,
        p.location,
        p.eyes,
        p.hairColor,
        p.hairLength,
        p.pubicHair,
        p.bustSize,
        p.bustType,
        p.travel,
        p.weight,
        p.height,
        p.ethnicity,
        p.nationality,
        p.languages,
        p.phoneNumber,
        p.cellPhone,
        p.country,
        p.city,
        p.orientation,
        p.smoker,
        p.tattoo,
        p.piercing,
        p.services,
        p.meetingWith,
        p.availableFor,
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: "not_found" });
    return res.json(rows[0]);
  } catch {
    return res.status(500).json({ error: "creator_save_failed" });
  }
});

// Route to get the authenticated creator's images.
meRouter.get("/creator-images", requireAuth, requireRole(["creator"]), async (req: AuthedRequest, res) => {
  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `
      SELECT image_id, image_file, sequence_number
        FROM provider_images
       WHERE provider_uuid = $1::uuid
       ORDER BY sequence_number ASC
      `,
      [req.user!.id]
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "images_load_failed" });
  }
});

// Zod schema for validating creator image data.
const CreatorImageSchema = z.object({
  sequenceNumber: z.coerce.number().int().min(1).max(7),
  imageFile: z.string().min(1),
});

// Route to create a new image for the authenticated creator.
meRouter.post("/creator-images", requireAuth, requireRole(["creator"]), async (req: AuthedRequest, res) => {
  const parsed = CreatorImageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const pool = getPool();
  const imageId = `MANUAL_${req.user!.id.slice(0, 8)}_${parsed.data.sequenceNumber}`;
  try {
    const { rows } = await pool.query(
      `
      INSERT INTO provider_images (image_id, provider_uuid, provider_id, image_file, sequence_number, resolution)
      SELECT $2, p.uuid, p.provider_id, $3, $1, 'clean'
      FROM providers p
      WHERE p.uuid = $4::uuid
      ON CONFLICT (provider_uuid, sequence_number) DO UPDATE SET
        image_id = EXCLUDED.image_id,
        image_file = EXCLUDED.image_file
      RETURNING image_id, image_file, sequence_number
      `,
      [parsed.data.sequenceNumber, imageId, parsed.data.imageFile.trim(), req.user!.id]
    );
    return res.status(201).json(rows[0]);
  } catch {
    return res.status(500).json({ error: "image_save_failed" });
  }
});

// Route to update an existing image for the authenticated creator.
meRouter.put("/creator-images/:imageId", requireAuth, requireRole(["creator"]), async (req: AuthedRequest, res) => {
  const parsed = CreatorImageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });

  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `
      UPDATE provider_images
         SET sequence_number = $1,
             image_file = $2
       WHERE image_id = $3
         AND provider_uuid = $4::uuid
       RETURNING image_id, image_file, sequence_number
      `,
      [parsed.data.sequenceNumber, parsed.data.imageFile.trim(), req.params.imageId, req.user!.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "not_found" });
    return res.json(rows[0]);
  } catch {
    return res.status(500).json({ error: "image_update_failed" });
  }
});

// Route to delete an image for the authenticated creator.
meRouter.delete("/creator-images/:imageId", requireAuth, requireRole(["creator"]), async (req: AuthedRequest, res) => {
  const pool = getPool();
  try {
    const { rowCount } = await pool.query(
      `
      DELETE FROM provider_images
       WHERE image_id = $1
         AND provider_uuid = $2::uuid
      `,
      [req.params.imageId, req.user!.id]
    );
    if (!rowCount) return res.status(404).json({ error: "not_found" });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "image_delete_failed" });
  }
});
