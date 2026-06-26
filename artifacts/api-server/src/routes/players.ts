import { Router } from "express";
import { db, playersTable, rankingsTable, gamemodesTable, badgesTable, playerBadgesTable, activityLogsTable } from "@workspace/db";
import { eq, like, or, sql, desc, and } from "drizzle-orm";
import { requireAuth, requireAdmin, requireModerator } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

async function getPlayerWithBadgesAndRankings(playerId: number) {
  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, playerId)).limit(1);
  if (!player) return null;

  const badges = await db
    .select({ id: badgesTable.id, name: badgesTable.name, icon: badgesTable.icon, description: badgesTable.description, color: badgesTable.color })
    .from(playerBadgesTable)
    .innerJoin(badgesTable, eq(playerBadgesTable.badgeId, badgesTable.id))
    .where(eq(playerBadgesTable.playerId, playerId));

  const rankings = await db
    .select({
      id: rankingsTable.id,
      playerId: rankingsTable.playerId,
      gamemodeId: rankingsTable.gamemodeId,
      gamemodeName: gamemodesTable.name,
      tier: rankingsTable.tier,
      points: rankingsTable.points,
      winRate: rankingsTable.winRate,
      matches: rankingsTable.matches,
      kills: rankingsTable.kills,
      deaths: rankingsTable.deaths,
      createdAt: rankingsTable.createdAt,
      updatedAt: rankingsTable.updatedAt,
    })
    .from(rankingsTable)
    .innerJoin(gamemodesTable, eq(rankingsTable.gamemodeId, gamemodesTable.id))
    .where(eq(rankingsTable.playerId, playerId));

  return {
    ...player,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
    badges,
    rankings: rankings.map(r => ({
      ...r,
      kdr: r.deaths === 0 ? r.kills : Math.round((r.kills / r.deaths) * 100) / 100,
      rank: null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const limit = Math.min(100, parseInt(String(req.query.limit || "20")));
    const search = String(req.query.search || "");
    const country = String(req.query.country || "");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(like(playersTable.minecraftUsername, `%${search}%`));
    if (country) conditions.push(eq(playersTable.country, country));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(playersTable).where(whereClause);
    const players = await db.select().from(playersTable).where(whereClause).orderBy(desc(playersTable.points)).limit(limit).offset(offset);

    const playerIds = players.map(p => p.id);
    const badgesMap: Record<number, any[]> = {};
    if (playerIds.length > 0) {
      const allBadges = await db
        .select({ playerId: playerBadgesTable.playerId, id: badgesTable.id, name: badgesTable.name, icon: badgesTable.icon, description: badgesTable.description, color: badgesTable.color })
        .from(playerBadgesTable)
        .innerJoin(badgesTable, eq(playerBadgesTable.badgeId, badgesTable.id))
        .where(sql`${playerBadgesTable.playerId} = ANY(${sql.raw(`ARRAY[${playerIds.join(",")}]::int[]`)}) `);
      for (const b of allBadges) {
        if (!badgesMap[b.playerId]) badgesMap[b.playerId] = [];
        badgesMap[b.playerId].push({ id: b.id, name: b.name, icon: b.icon, description: b.description, color: b.color });
      }
    }

    res.json({
      players: players.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        badges: badgesMap[p.id] || [],
      })),
      total: Number(count),
      page,
      limit,
    });
  } catch (err) {
    logger.error({ err }, "List players error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/by-username/:username", async (req, res) => {
  try {
    const [player] = await db.select().from(playersTable).where(eq(playersTable.minecraftUsername, String(req.params.username))).limit(1);
    if (!player) { res.status(404).json({ error: "Player not found" }); return; }
    const detail = await getPlayerWithBadgesAndRankings(player.id);
    res.json(detail);
  } catch (err) {
    logger.error({ err }, "Get player by username error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const detail = await getPlayerWithBadgesAndRankings(id);
    if (!detail) { res.status(404).json({ error: "Player not found" }); return; }
    res.json(detail);
  } catch (err) {
    logger.error({ err }, "Get player error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, requireModerator, async (req, res) => {
  try {
    const { minecraftUsername, uuid, discord, country, countryCode, skinUrl, socialLinks } = req.body;
    if (!minecraftUsername) { res.status(400).json({ error: "minecraftUsername is required" }); return; }
    const [player] = await db.insert(playersTable).values({
      minecraftUsername, uuid, discord, country, countryCode, skinUrl, socialLinks, points: 0
    }).returning();
    await db.insert(activityLogsTable).values({ type: "player_added", description: `Player ${minecraftUsername} added`, playerName: minecraftUsername });
    res.status(201).json({ ...player, createdAt: player.createdAt.toISOString(), updatedAt: player.updatedAt.toISOString(), badges: [] });
  } catch (err) {
    logger.error({ err }, "Create player error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAuth, requireModerator, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { minecraftUsername, uuid, discord, country, countryCode, skinUrl, points, overallTier, socialLinks } = req.body;
    const updates: any = {};
    if (minecraftUsername !== undefined) updates.minecraftUsername = minecraftUsername;
    if (uuid !== undefined) updates.uuid = uuid;
    if (discord !== undefined) updates.discord = discord;
    if (country !== undefined) updates.country = country;
    if (countryCode !== undefined) updates.countryCode = countryCode;
    if (skinUrl !== undefined) updates.skinUrl = skinUrl;
    if (points !== undefined) updates.points = points;
    if (overallTier !== undefined) updates.overallTier = overallTier;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;
    const [player] = await db.update(playersTable).set(updates).where(eq(playersTable.id, id)).returning();
    if (!player) { res.status(404).json({ error: "Player not found" }); return; }
    res.json({ ...player, createdAt: player.createdAt.toISOString(), updatedAt: player.updatedAt.toISOString(), badges: [] });
  } catch (err) {
    logger.error({ err }, "Update player error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(playersTable).where(eq(playersTable.id, id));
    res.json({ message: "Player deleted" });
  } catch (err) {
    logger.error({ err }, "Delete player error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Badge routes nested under players
router.post("/:playerId/badges", requireAuth, requireModerator, async (req, res) => {
  try {
    const playerId = parseInt(String(req.params.playerId));
    const { badgeId } = req.body;
    await db.insert(playerBadgesTable).values({ playerId, badgeId }).onConflictDoNothing();
    res.json({ message: "Badge assigned" });
  } catch (err) {
    logger.error({ err }, "Assign badge error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:playerId/badges/:badgeId", requireAuth, requireModerator, async (req, res) => {
  try {
    const playerId = parseInt(String(req.params.playerId));
    const badgeId = parseInt(String(req.params.badgeId));
    await db.delete(playerBadgesTable).where(and(eq(playerBadgesTable.playerId, playerId), eq(playerBadgesTable.badgeId, badgeId)));
    res.json({ message: "Badge removed" });
  } catch (err) {
    logger.error({ err }, "Remove badge error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
