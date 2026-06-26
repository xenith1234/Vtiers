import { Router } from "express";
import { db, gamemodesTable, rankingsTable } from "@workspace/db";
import { eq, sql, asc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const includeDisabled = req.query.includeDisabled === "true";
    const gamemodes = await db.select().from(gamemodesTable)
      .orderBy(asc(gamemodesTable.sortOrder), asc(gamemodesTable.name));

    const withCounts = await Promise.all(gamemodes.map(async (gm) => {
      if (!includeDisabled && !gm.enabled) return null;
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(rankingsTable).where(eq(rankingsTable.gamemodeId, gm.id));
      return { ...gm, playerCount: Number(count), createdAt: gm.createdAt.toISOString() };
    }));

    res.json(withCounts.filter(Boolean));
  } catch (err) {
    logger.error({ err }, "List gamemodes error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [gm] = await db.select().from(gamemodesTable).where(eq(gamemodesTable.id, id)).limit(1);
    if (!gm) { res.status(404).json({ error: "Gamemode not found" }); return; }
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(rankingsTable).where(eq(rankingsTable.gamemodeId, gm.id));
    res.json({ ...gm, playerCount: Number(count), createdAt: gm.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Get gamemode error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, icon, description, enabled, sortOrder, color } = req.body;
    if (!name) { res.status(400).json({ error: "Name is required" }); return; }
    const [gm] = await db.insert(gamemodesTable).values({
      name, icon, description, enabled: enabled ?? true, sortOrder: sortOrder ?? 0, color
    }).returning();
    res.status(201).json({ ...gm, playerCount: 0, createdAt: gm.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Create gamemode error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { name, icon, description, enabled, sortOrder, color } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (icon !== undefined) updates.icon = icon;
    if (description !== undefined) updates.description = description;
    if (enabled !== undefined) updates.enabled = enabled;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (color !== undefined) updates.color = color;
    const [gm] = await db.update(gamemodesTable).set(updates).where(eq(gamemodesTable.id, id)).returning();
    if (!gm) { res.status(404).json({ error: "Gamemode not found" }); return; }
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(rankingsTable).where(eq(rankingsTable.gamemodeId, gm.id));
    res.json({ ...gm, playerCount: Number(count), createdAt: gm.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Update gamemode error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(gamemodesTable).where(eq(gamemodesTable.id, id));
    res.json({ message: "Gamemode deleted" });
  } catch (err) {
    logger.error({ err }, "Delete gamemode error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
