import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
export const servicesRouter = Router();
const ListQuery = z.object({
    q: z.string().optional(),
    category: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
    sort: z.enum(["newest", "updated", "price_asc", "price_desc", "featured"]).default("featured"),
});
servicesRouter.get("/", async (req, res) => {
    const parsed = ListQuery.safeParse(req.query);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_query", details: parsed.error.flatten() });
    const { q, category, page, pageSize, sort } = parsed.data;
    const where = { active: true };
    if (category)
        where.categoryId = category;
    if (q) {
        where.OR = [
            { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ];
    }
    const orderBy = sort === "newest"
        ? { createdAt: "desc" }
        : sort === "updated"
            ? { updatedAt: "desc" }
            : sort === "price_asc"
                ? { basePrice: "asc" }
                : sort === "price_desc"
                    ? { basePrice: "desc" }
                    : { featuredRank: "asc" };
    const total = await prisma.service.count({ where });
    const items = await prisma.service.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true, creator: { select: { id: true, email: true } } },
    });
    res.json({ items, page, pageSize, total });
});
servicesRouter.get("/:id", async (req, res) => {
    const id = req.params.id;
    const service = await prisma.service.findUnique({
        where: { id },
        include: { category: true, creator: { select: { id: true, email: true, providerProfile: true } } },
    });
    if (!service)
        return res.status(404).json({ error: "not_found" });
    if (!service.active)
        return res.status(404).json({ error: "not_found" });
    res.json(service);
});
const UpsertSchema = z.object({
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(4000),
    mainImageUrl: z.string().min(1).optional().nullable(),
    galleryImages: z.array(z.string().min(1)).max(4).optional().nullable(),
    categoryId: z.string().uuid().nullable().optional(),
    basePrice: z.coerce.number().positive(),
    durationMinutes: z.coerce.number().int().min(5).max(24 * 60),
    active: z.boolean().default(true),
});
servicesRouter.post("/", requireAuth, requireRole(["provider", "creator", "admin"]), async (req, res) => {
    const parsed = UpsertSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const svc = await prisma.service.create({
        data: {
            creatorId: req.user.id,
            title: parsed.data.title,
            description: parsed.data.description,
            mainImageUrl: parsed.data.mainImageUrl ?? null,
            galleryImages: parsed.data.galleryImages ?? Prisma.JsonNull,
            categoryId: parsed.data.categoryId ?? null,
            basePrice: parsed.data.basePrice.toFixed(2),
            durationMinutes: parsed.data.durationMinutes,
            active: parsed.data.active,
        },
    });
    res.status(201).json(svc);
});
servicesRouter.put("/:id", requireAuth, requireRole(["provider", "creator", "admin"]), async (req, res) => {
    const id = req.params.id;
    const parsed = UpsertSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing)
        return res.status(404).json({ error: "not_found" });
    if (req.user.role !== "admin" && existing.creatorId !== req.user.id)
        return res.status(403).json({ error: "forbidden" });
    const svc = await prisma.service.update({
        where: { id },
        data: {
            title: parsed.data.title,
            description: parsed.data.description,
            mainImageUrl: parsed.data.mainImageUrl ?? null,
            galleryImages: parsed.data.galleryImages ?? Prisma.JsonNull,
            categoryId: parsed.data.categoryId ?? null,
            basePrice: parsed.data.basePrice.toFixed(2),
            durationMinutes: parsed.data.durationMinutes,
            active: parsed.data.active,
        },
    });
    res.json(svc);
});
