import { Router } from "express";
import { db, playersTable, rankingsTable, gamemodesTable, apiKeysTable } from "@workspace/db";
import { eq, desc, ilike, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();

async function requireBotKey(req: any, res: any, next: any) {
  // Accept BOT_API_SECRET via x-bot-secret header (used by the Discord bot internally)
  const botSecret = process.env.BOT_API_SECRET;
  const xBotSecret = req.headers["x-bot-secret"] as string | undefined;
  if (botSecret && xBotSecret && xBotSecret === botSecret) {
    next();
    return;
  }

  // Fall back to DB API key check (Bearer token or ?key= query param)
  const authHeader = req.headers.authorization as string | undefined;
  const queryKey = req.query.key as string | undefined;
  const rawKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : queryKey;

  if (!rawKey) {
    res.status(401).json({ error: "API key required. Pass via Authorization: Bearer <key> header or ?key= query param." });
    return;
  }

  try {
    const [apiKey] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.key, rawKey)).limit(1);
    if (!apiKey || !apiKey.active) {
      res.status(401).json({ error: "Invalid or inactive API key." });
      return;
    }
    await db.update(apiKeysTable).set({ lastUsed: new Date() }).where(eq(apiKeysTable.id, apiKey.id));
    (req as any).botKey = apiKey;
    next();
  } catch (err) {
    logger.error({ err }, "Bot: API key check error");
    res.status(500).json({ error: "Internal server error" });
  }
}

// ── Bot public endpoints (key-protected) ─────────────────────────────────────

router.get("/bot/player/:username", requireBotKey, async (req, res) => {
  try {
    const username = String(req.params.username);
    const [player] = await db.select().from(playersTable)
      .where(ilike(playersTable.minecraftUsername, username)).limit(1);

    if (!player) { res.status(404).json({ error: "Player not found", username }); return; }

    const rankings = await db.select({
      tier: rankingsTable.tier,
      points: rankingsTable.points,
      kills: rankingsTable.kills,
      deaths: rankingsTable.deaths,
      matches: rankingsTable.matches,
      winRate: rankingsTable.winRate,
      gamemodeName: gamemodesTable.name,
      gamemodeIcon: gamemodesTable.icon,
    })
      .from(rankingsTable)
      .innerJoin(gamemodesTable, eq(rankingsTable.gamemodeId, gamemodesTable.id))
      .where(eq(rankingsTable.playerId, player.id))
      .orderBy(desc(rankingsTable.points));

    res.json({
      id: player.id,
      username: player.minecraftUsername,
      discord: player.discord,
      country: player.country,
      overallTier: player.overallTier || "UR",
      points: player.points,
      avatarUrl: `https://mc-heads.net/avatar/${player.minecraftUsername}/64`,
      rankings: rankings.map(r => ({
        gamemode: r.gamemodeName,
        icon: r.gamemodeIcon,
        tier: r.tier,
        points: r.points,
        kills: r.kills,
        deaths: r.deaths,
        matches: r.matches,
        winRate: r.winRate,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Bot: get player error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bot/tier/:username", requireBotKey, async (req, res) => {
  try {
    const username = String(req.params.username);
    const [player] = await db.select().from(playersTable)
      .where(ilike(playersTable.minecraftUsername, username)).limit(1);

    if (!player) { res.status(404).json({ error: "Player not found", username }); return; }

    const gamemodeId = req.query.gamemode ? parseInt(String(req.query.gamemode)) : undefined;
    const baseWhere = eq(rankingsTable.playerId, player.id);
    const whereClause = gamemodeId ? and(baseWhere, eq(rankingsTable.gamemodeId, gamemodeId)) : baseWhere;

    const rankings = await db.select({
      tier: rankingsTable.tier,
      points: rankingsTable.points,
      gamemodeName: gamemodesTable.name,
    })
      .from(rankingsTable)
      .innerJoin(gamemodesTable, eq(rankingsTable.gamemodeId, gamemodesTable.id))
      .where(whereClause)
      .orderBy(desc(rankingsTable.points));

    res.json({
      username: player.minecraftUsername,
      overallTier: player.overallTier || "UR",
      totalPoints: player.points,
      rankings: rankings.map(r => ({ gamemode: r.gamemodeName, tier: r.tier, points: r.points })),
    });
  } catch (err) {
    logger.error({ err }, "Bot: get tier error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bot/leaderboard", requireBotKey, async (req, res) => {
  try {
    const limit = Math.min(25, parseInt(String(req.query.limit || "10")));
    const gamemodeId = req.query.gamemode ? parseInt(String(req.query.gamemode)) : undefined;

    if (gamemodeId) {
      const results = await db.select({
        minecraftUsername: playersTable.minecraftUsername,
        tier: rankingsTable.tier,
        points: rankingsTable.points,
        kills: rankingsTable.kills,
        deaths: rankingsTable.deaths,
        matches: rankingsTable.matches,
        winRate: rankingsTable.winRate,
        gamemodeName: gamemodesTable.name,
      })
        .from(rankingsTable)
        .innerJoin(playersTable, eq(rankingsTable.playerId, playersTable.id))
        .innerJoin(gamemodesTable, eq(rankingsTable.gamemodeId, gamemodesTable.id))
        .where(eq(rankingsTable.gamemodeId, gamemodeId))
        .orderBy(desc(rankingsTable.points))
        .limit(limit);

      res.json(results.map((r, i) => ({
        rank: i + 1, username: r.minecraftUsername, gamemode: r.gamemodeName,
        tier: r.tier, points: r.points,
        kills: r.kills, deaths: r.deaths, matches: r.matches, winRate: r.winRate,
      })));
    } else {
      const results = await db.select().from(playersTable).orderBy(desc(playersTable.points)).limit(limit);
      res.json(results.map((p, i) => ({
        rank: i + 1, username: p.minecraftUsername, overallTier: p.overallTier || "UR",
        points: p.points, discord: p.discord, country: p.country,
      })));
    }
  } catch (err) {
    logger.error({ err }, "Bot: leaderboard error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bot/search", requireBotKey, async (req, res) => {
  try {
    const q = String(req.query.q || "");
    if (!q || q.length < 2) { res.status(400).json({ error: "Query must be at least 2 characters" }); return; }
    const players = await db.select().from(playersTable)
      .where(ilike(playersTable.minecraftUsername, `%${q}%`)).limit(10);
    res.json(players.map(p => ({
      id: p.id, username: p.minecraftUsername, overallTier: p.overallTier || "UR",
      points: p.points, discord: p.discord, country: p.country,
    })));
  } catch (err) {
    logger.error({ err }, "Bot: search error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bot/gamemodes", requireBotKey, async (req, res) => {
  try {
    const gamemodes = await db.select().from(gamemodesTable).orderBy(gamemodesTable.name);
    res.json(gamemodes.map(g => ({ id: g.id, name: g.name, icon: g.icon, description: g.description })));
  } catch (err) {
    logger.error({ err }, "Bot: gamemodes error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: API key management ─────────────────────────────────────────────────

router.get("/api-keys", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const keys = await db.select().from(apiKeysTable).orderBy(desc(apiKeysTable.createdAt));
    res.json(keys.map(k => ({
      id: k.id, name: k.name, description: k.description, key: k.key,
      active: k.active, lastUsed: k.lastUsed?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, "List api keys error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api-keys", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "Name is required" }); return; }
    const key = "vt_" + crypto.randomBytes(24).toString("hex");
    const [created] = await db.insert(apiKeysTable).values({ name: name.trim(), description: description ?? null, key }).returning();
    res.status(201).json({
      id: created.id, name: created.name, description: created.description, key: created.key,
      active: created.active, lastUsed: null, createdAt: created.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Create api key error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/api-keys/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { active, name, description } = req.body;
    const updates: Record<string, any> = {};
    if (active !== undefined) updates.active = active;
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    const [updated] = await db.update(apiKeysTable).set(updates).where(eq(apiKeysTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      id: updated.id, name: updated.name, description: updated.description, key: updated.key,
      active: updated.active, lastUsed: updated.lastUsed?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Update api key error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/api-keys/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id));
    res.json({ message: "API key deleted" });
  } catch (err) {
    logger.error({ err }, "Delete api key error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
