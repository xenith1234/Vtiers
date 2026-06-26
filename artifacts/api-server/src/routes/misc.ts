import { Router } from "express";
import { db, usersTable, playersTable, gamemodesTable, rankingsTable, badgesTable, settingsTable, announcementsTable, activityLogsTable } from "@workspace/db";
import { eq, like, or, sql, desc, ilike, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

// Badges
router.get("/badges", async (_req, res) => {
  try {
    const badges = await db.select().from(badgesTable);
    res.json(badges.map(b => ({ ...b, createdAt: undefined })));
  } catch (err) {
    logger.error({ err }, "List badges error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/badges", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, icon, description, color } = req.body;
    if (!name || !icon) { res.status(400).json({ error: "Name and icon are required" }); return; }
    const [badge] = await db.insert(badgesTable).values({ name, icon, description, color }).returning();
    res.status(201).json(badge);
  } catch (err) {
    logger.error({ err }, "Create badge error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/badges/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(badgesTable).where(eq(badgesTable.id, id));
    res.json({ message: "Badge deleted" });
  } catch (err) {
    logger.error({ err }, "Delete badge error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "");
    const country = String(req.query.country || "");
    const tier = String(req.query.tier || "");
    const gamemode = String(req.query.gamemode || "");
    const discord = String(req.query.discord || "");

    let query = db.select().from(playersTable);
    const conditions: any[] = [];

    if (q) conditions.push(ilike(playersTable.minecraftUsername, `%${q}%`));
    if (country) conditions.push(eq(playersTable.country, country));
    if (tier) conditions.push(eq(playersTable.overallTier, tier));
    if (discord) conditions.push(ilike(playersTable.discord, `%${discord}%`));

    const players = await db.select().from(playersTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(50);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(playersTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      players: players.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        badges: [],
      })),
      total: Number(count),
    });
  } catch (err) {
    logger.error({ err }, "Search error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Settings
const DEFAULT_SETTINGS = {
  siteName: "VERSUS TIERS",
  siteDescription: "The Ultimate Minecraft PvP Tier Rankings",
  discordInvite: "https://discord.gg/versustiers",
  logoUrl: "",
  primaryColor: "#00e5ff",
  backgroundType: "clouds",
  announcementBannerText: "",
  announcementBannerEnabled: "false",
  homepageTitle: "The Ultimate Minecraft PvP Tier Rankings",
  homepageSubtitle: "Compete. Rank. Dominate.",
};

router.get("/settings", async (_req, res) => {
  try {
    const rows = await db.select().from(settingsTable);
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    res.json({
      ...merged,
      announcementBannerEnabled: merged.announcementBannerEnabled === "true",
    });
  } catch (err) {
    logger.error({ err }, "Get settings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/settings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const updates = req.body as Record<string, any>;
    for (const [key, value] of Object.entries(updates)) {
      const strVal = typeof value === "boolean" ? String(value) : String(value);
      await db.insert(settingsTable).values({ key, value: strVal })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value: strVal } });
    }
    const rows = await db.select().from(settingsTable);
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    res.json({ ...merged, announcementBannerEnabled: merged.announcementBannerEnabled === "true" });
  } catch (err) {
    logger.error({ err }, "Update settings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Announcements
router.get("/announcements", async (_req, res) => {
  try {
    const rows = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
    res.json(rows.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
  } catch (err) {
    logger.error({ err }, "List announcements error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/announcements", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { text, active } = req.body;
    if (!text) { res.status(400).json({ error: "Text is required" }); return; }
    const [ann] = await db.insert(announcementsTable).values({ text, active: active ?? true }).returning();
    res.status(201).json({ ...ann, createdAt: ann.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Create announcement error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/announcements/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { text, active } = req.body;
    const updates: any = {};
    if (text !== undefined) updates.text = text;
    if (active !== undefined) updates.active = active;
    const [ann] = await db.update(announcementsTable).set(updates).where(eq(announcementsTable.id, id)).returning();
    if (!ann) { res.status(404).json({ error: "Announcement not found" }); return; }
    res.json({ ...ann, createdAt: ann.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Update announcement error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/announcements/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    logger.error({ err }, "Delete announcement error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Stats
router.get("/stats", async (_req, res) => {
  try {
    const [{ users }] = await db.select({ users: sql<number>`count(*)` }).from(usersTable);
    const [{ players }] = await db.select({ players: sql<number>`count(*)` }).from(playersTable);
    const [{ gamemodes }] = await db.select({ gamemodes: sql<number>`count(*)` }).from(gamemodesTable);
    const [{ rankings }] = await db.select({ rankings: sql<number>`count(*)` }).from(rankingsTable);
    const oneHourAgo = new Date(Date.now() - 3600000);
    const [{ recent }] = await db.select({ recent: sql<number>`count(*)` }).from(usersTable)
      .where(sql`${usersTable.createdAt} > ${oneHourAgo}`);
    res.json({
      totalUsers: Number(users),
      totalPlayers: Number(players),
      totalGamemodes: Number(gamemodes),
      totalRankings: Number(rankings),
      onlineUsers: Math.floor(Math.random() * 15) + 5,
      recentRegistrations: Number(recent),
    });
  } catch (err) {
    logger.error({ err }, "Stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/recent-activity", async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(String(req.query.limit || "10")));
    const rows = await db.select().from(activityLogsTable).orderBy(desc(activityLogsTable.createdAt)).limit(limit);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    logger.error({ err }, "Recent activity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/tier-distribution", async (req, res) => {
  try {
    const gamemodeId = req.query.gamemodeId ? parseInt(String(req.query.gamemodeId)) : undefined;
    const whereClause = gamemodeId ? eq(rankingsTable.gamemodeId, gamemodeId) : undefined;
    const rows = await db.select({ tier: rankingsTable.tier, count: sql<number>`count(*)` })
      .from(rankingsTable).where(whereClause)
      .groupBy(rankingsTable.tier).orderBy(desc(sql`count(*)`));
    res.json(rows.map(r => ({ tier: r.tier, count: Number(r.count) })));
  } catch (err) {
    logger.error({ err }, "Tier distribution error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/top-players", async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(String(req.query.limit || "10")));
    const players = await db.select().from(playersTable).orderBy(desc(playersTable.points)).limit(limit);
    res.json(players.map((p, i) => ({
      rank: i + 1,
      player: { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(), badges: [] },
      totalPoints: p.points,
      overallTier: p.overallTier || "UR",
      gamemodeCount: 0,
    })));
  } catch (err) {
    logger.error({ err }, "Top players error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Users management (admin)
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const limit = Math.min(100, parseInt(String(req.query.limit || "20")));
    const search = String(req.query.search || "");
    const role = String(req.query.role || "");
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (search) conditions.push(or(ilike(usersTable.username, `%${search}%`), ilike(usersTable.email, `%${search}%`)));
    if (role) conditions.push(eq(usersTable.role, role as any));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(whereClause);
    const users = await db.select().from(usersTable).where(whereClause).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
    res.json({
      users: users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt.toISOString(), lastLogin: u.lastLogin?.toISOString() ?? null })),
      total: Number(count), page, limit,
    });
  } catch (err) {
    logger.error({ err }, "List users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!u) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ id: u.id, username: u.username, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt.toISOString(), lastLogin: u.lastLogin?.toISOString() ?? null });
  } catch (err) {
    logger.error({ err }, "Get user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { username, email, role, status } = req.body;
    const updates: any = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;
    const [u] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
    if (!u) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ id: u.id, username: u.username, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt.toISOString(), lastLogin: u.lastLogin?.toISOString() ?? null });
  } catch (err) {
    logger.error({ err }, "Update user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ message: "User deleted" });
  } catch (err) {
    logger.error({ err }, "Delete user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/suspend", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.update(usersTable).set({ status: "suspended" }).where(eq(usersTable.id, id));
    res.json({ message: "User suspended" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/ban", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.update(usersTable).set({ status: "banned" }).where(eq(usersTable.id, id));
    res.json({ message: "User banned" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
