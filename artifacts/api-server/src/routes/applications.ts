import { Router } from "express";
import { db, applicationsTable } from "@workspace/db";
import { eq, desc, sql, ilike, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.post("/apply", async (req, res) => {
  try {
    const { minecraftUsername, discord, gamemodes, evidence, notes } = req.body;
    if (!minecraftUsername || !discord || !gamemodes || !evidence) {
      res.status(400).json({ error: "Missing required fields: minecraftUsername, discord, gamemodes, evidence" });
      return;
    }
    const [app] = await db.insert(applicationsTable).values({
      minecraftUsername: String(minecraftUsername),
      discord: String(discord),
      gamemodes: String(gamemodes),
      evidence: String(evidence),
      notes: notes ? String(notes) : null,
    }).returning();
    res.status(201).json({
      ...app,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      reviewedAt: app.reviewedAt?.toISOString() ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Submit application error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/applications", requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const limit = Math.min(100, parseInt(String(req.query.limit || "20")));
    const status = String(req.query.status || "");
    const search = String(req.query.search || "");
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (status) conditions.push(eq(applicationsTable.status, status as any));
    if (search) conditions.push(ilike(applicationsTable.minecraftUsername, `%${search}%`));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(applicationsTable).where(whereClause);
    const apps = await db.select().from(applicationsTable)
      .where(whereClause)
      .orderBy(desc(applicationsTable.createdAt))
      .limit(limit).offset(offset);

    res.json({
      applications: apps.map(a => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        reviewedAt: a.reviewedAt?.toISOString() ?? null,
      })),
      total: Number(count), page, limit,
    });
  } catch (err) {
    logger.error({ err }, "List applications error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/applications/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id)).limit(1);
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
    res.json({
      ...app,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      reviewedAt: app.reviewedAt?.toISOString() ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Get application error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/applications/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { status, reviewNotes, reviewedBy } = req.body;
    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (reviewNotes !== undefined) updates.reviewNotes = reviewNotes;
    if (reviewedBy !== undefined) updates.reviewedBy = reviewedBy;
    if (status && status !== "pending") updates.reviewedAt = new Date();
    const [app] = await db.update(applicationsTable).set(updates).where(eq(applicationsTable.id, id)).returning();
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
    res.json({
      ...app,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      reviewedAt: app.reviewedAt?.toISOString() ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Update application error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/applications/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(applicationsTable).where(eq(applicationsTable.id, id));
    res.json({ message: "Application deleted" });
  } catch (err) {
    logger.error({ err }, "Delete application error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
