import { Router } from "express";
import { db, rankingsTable, playersTable, gamemodesTable, badgesTable, playerBadgesTable, activityLogsTable } from "@workspace/db";
import { eq, sql, desc, asc, and } from "drizzle-orm";
import { requireAuth, requireModerator } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

async function getPlayerBadges(playerIds: number[]) {
  if (playerIds.length === 0) return {};
  const allBadges = await db
    .select({ playerId: playerBadgesTable.playerId, id: badgesTable.id, name: badgesTable.name, icon: badgesTable.icon, description: badgesTable.description, color: badgesTable.color })
    .from(playerBadgesTable)
    .innerJoin(badgesTable, eq(playerBadgesTable.badgeId, badgesTable.id))
    .where(sql`${playerBadgesTable.playerId} = ANY(${sql.raw(`ARRAY[${playerIds.join(",")}]::int[]`)})`);
  const map: Record<number, any[]> = {};
  for (const b of allBadges) {
    if (!map[b.playerId]) map[b.playerId] = [];
    map[b.playerId].push({ id: b.id, name: b.name, icon: b.icon, description: b.description, color: b.color });
  }
  return map;
}

const TIER_ORDER: Record<string, number> = { HT5: 11, HT4: 10, HT3: 9, HT2: 8, HT1: 7, LT5: 6, LT4: 5, LT3: 4, LT2: 3, LT1: 2, UR: 1 };

router.get("/leaderboard", async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(String(req.query.limit || "50")));
    const players = await db.select().from(playersTable).orderBy(desc(playersTable.points)).limit(limit);
    const playerIds = players.map(p => p.id);
    const badgesMap = await getPlayerBadges(playerIds);
    const result = players.map((p, i) => ({
      rank: i + 1,
      player: { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(), badges: badgesMap[p.id] || [] },
      totalPoints: p.points,
      overallTier: p.overallTier || "UR",
      gamemodeCount: 0,
    }));
    res.json(result);
  } catch (err) {
    logger.error({ err }, "Leaderboard error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/player/:playerId", async (req, res) => {
  try {
    const playerId = parseInt(String(req.params.playerId));
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
    res.json(rankings.map(r => ({
      ...r,
      kdr: r.deaths === 0 ? r.kills : Math.round((r.kills / r.deaths) * 100) / 100,
      rank: null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, "Get player rankings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const gamemodeId = req.query.gamemodeId ? parseInt(String(req.query.gamemodeId)) : undefined;
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const limit = Math.min(100, parseInt(String(req.query.limit || "20")));
    const tier = String(req.query.tier || "");
    const sortBy = String(req.query.sortBy || "points");
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (gamemodeId) conditions.push(eq(rankingsTable.gamemodeId, gamemodeId));
    if (tier) conditions.push(eq(rankingsTable.tier, tier));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(rankingsTable).where(whereClause);

    let orderBy;
    if (sortBy === "winRate") orderBy = desc(rankingsTable.winRate);
    else if (sortBy === "matches") orderBy = desc(rankingsTable.matches);
    else if (sortBy === "kills") orderBy = desc(rankingsTable.kills);
    else if (sortBy === "recent") orderBy = desc(rankingsTable.updatedAt);
    else orderBy = desc(rankingsTable.points);

    const rows = await db
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
        updatedAt: rankingsTable.updatedAt,
        player: {
          id: playersTable.id,
          minecraftUsername: playersTable.minecraftUsername,
          uuid: playersTable.uuid,
          discord: playersTable.discord,
          country: playersTable.country,
          countryCode: playersTable.countryCode,
          skinUrl: playersTable.skinUrl,
          points: playersTable.points,
          overallTier: playersTable.overallTier,
          createdAt: playersTable.createdAt,
          updatedAt: playersTable.updatedAt,
        }
      })
      .from(rankingsTable)
      .innerJoin(gamemodesTable, eq(rankingsTable.gamemodeId, gamemodesTable.id))
      .innerJoin(playersTable, eq(rankingsTable.playerId, playersTable.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const playerIds = [...new Set(rows.map(r => r.playerId))];
    const badgesMap = await getPlayerBadges(playerIds);

    // Fetch all gamemode rankings for every player in this page
    let allGamemodeRankings: Array<{ playerId: number; gamemodeId: number; gamemodeName: string; gamemodeIcon: string | null; tier: string }> = [];
    if (playerIds.length > 0) {
      allGamemodeRankings = await db
        .select({
          playerId: rankingsTable.playerId,
          gamemodeId: rankingsTable.gamemodeId,
          gamemodeName: gamemodesTable.name,
          gamemodeIcon: gamemodesTable.icon,
          tier: rankingsTable.tier,
        })
        .from(rankingsTable)
        .innerJoin(gamemodesTable, eq(rankingsTable.gamemodeId, gamemodesTable.id))
        .where(sql`${rankingsTable.playerId} = ANY(${sql.raw(`ARRAY[${playerIds.join(",")}]::int[]`)})`);
    }
    const gmRankMap: Record<number, Array<{ gamemodeId: number; gamemodeName: string; gamemodeIcon: string | null; tier: string }>> = {};
    for (const gmr of allGamemodeRankings) {
      if (!gmRankMap[gmr.playerId]) gmRankMap[gmr.playerId] = [];
      gmRankMap[gmr.playerId].push({ gamemodeId: gmr.gamemodeId, gamemodeName: gmr.gamemodeName, gamemodeIcon: gmr.gamemodeIcon, tier: gmr.tier });
    }

    const rankings = rows.map((r, i) => ({
      id: r.id,
      player: {
        id: r.player.id,
        minecraftUsername: r.player.minecraftUsername,
        uuid: r.player.uuid,
        discord: r.player.discord,
        country: r.player.country,
        countryCode: r.player.countryCode,
        skinUrl: r.player.skinUrl,
        points: r.player.points,
        overallTier: r.player.overallTier,
        createdAt: r.player.createdAt.toISOString(),
        updatedAt: r.player.updatedAt.toISOString(),
        badges: badgesMap[r.player.id] || [],
      },
      gamemodeId: r.gamemodeId,
      gamemodeName: r.gamemodeName,
      tier: r.tier,
      points: r.points,
      winRate: r.winRate,
      matches: r.matches,
      kills: r.kills,
      deaths: r.deaths,
      kdr: r.deaths === 0 ? r.kills : Math.round((r.kills / r.deaths) * 100) / 100,
      rank: offset + i + 1,
      updatedAt: r.updatedAt.toISOString(),
      gamemodeRankings: gmRankMap[r.playerId] || [],
    }));

    res.json({ rankings, total: Number(count), page, limit });
  } catch (err) {
    logger.error({ err }, "List rankings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, requireModerator, async (req, res) => {
  try {
    const { playerId, gamemodeId, tier, points, winRate, matches, kills, deaths } = req.body;
    if (!playerId || !gamemodeId || !tier) { res.status(400).json({ error: "playerId, gamemodeId, and tier are required" }); return; }
    const [ranking] = await db.insert(rankingsTable).values({
      playerId, gamemodeId, tier, points: points ?? 0,
      winRate: winRate ?? 0, matches: matches ?? 0, kills: kills ?? 0, deaths: deaths ?? 0
    }).returning();
    // Update overall tier based on highest tier
    const allRankings = await db.select().from(rankingsTable).where(eq(rankingsTable.playerId, playerId));
    const best = allRankings.reduce((a, b) => (TIER_ORDER[a.tier] || 0) > (TIER_ORDER[b.tier] || 0) ? a : b);
    const totalPts = allRankings.reduce((sum, r) => sum + r.points, 0);
    await db.update(playersTable).set({ overallTier: best.tier, points: totalPts }).where(eq(playersTable.id, playerId));
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, playerId)).limit(1);
    await db.insert(activityLogsTable).values({ type: "ranking_updated", description: `${player?.minecraftUsername} ranked ${tier} in gamemode ${gamemodeId}`, playerName: player?.minecraftUsername });
    res.status(201).json({ ...ranking, kdr: 0, rank: null, createdAt: ranking.createdAt.toISOString(), updatedAt: ranking.updatedAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Create ranking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAuth, requireModerator, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { tier, points, winRate, matches, kills, deaths } = req.body;
    const updates: any = {};
    if (tier !== undefined) updates.tier = tier;
    if (points !== undefined) updates.points = points;
    if (winRate !== undefined) updates.winRate = winRate;
    if (matches !== undefined) updates.matches = matches;
    if (kills !== undefined) updates.kills = kills;
    if (deaths !== undefined) updates.deaths = deaths;
    const [ranking] = await db.update(rankingsTable).set(updates).where(eq(rankingsTable.id, id)).returning();
    if (!ranking) { res.status(404).json({ error: "Ranking not found" }); return; }
    const allRankings = await db.select().from(rankingsTable).where(eq(rankingsTable.playerId, ranking.playerId));
    const best = allRankings.reduce((a, b) => (TIER_ORDER[a.tier] || 0) > (TIER_ORDER[b.tier] || 0) ? a : b);
    const totalPts = allRankings.reduce((sum, r) => sum + r.points, 0);
    await db.update(playersTable).set({ overallTier: best.tier, points: totalPts }).where(eq(playersTable.id, ranking.playerId));
    res.json({ ...ranking, kdr: ranking.deaths === 0 ? ranking.kills : Math.round((ranking.kills / ranking.deaths) * 100) / 100, rank: null, createdAt: ranking.createdAt.toISOString(), updatedAt: ranking.updatedAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Update ranking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, requireModerator, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(rankingsTable).where(eq(rankingsTable.id, id));
    res.json({ message: "Ranking deleted" });
  } catch (err) {
    logger.error({ err }, "Delete ranking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
