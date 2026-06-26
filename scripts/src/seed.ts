import { db, usersTable, playersTable, gamemodesTable, rankingsTable, badgesTable, playerBadgesTable, activityLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "vt_salt_2024").digest("hex");
}

const TIERS = ["HT5", "HT4", "HT3", "HT2", "HT1", "LT5", "LT4", "LT3", "LT2", "LT1", "UR"];
const TIER_ORDER: Record<string, number> = { HT5: 11, HT4: 10, HT3: 9, HT2: 8, HT1: 7, LT5: 6, LT4: 5, LT3: 4, LT2: 3, LT1: 2, UR: 1 };
const TIER_POINTS: Record<string, number> = {
  HT5: 2500, HT4: 2200, HT3: 1900, HT2: 1600, HT1: 1300,
  LT5: 1000, LT4: 800, LT3: 600, LT2: 400, LT1: 200, UR: 50
};

const GAMEMODES = [
  { name: "Sword PvP", icon: "⚔️", description: "Classic sword fighting", color: "#ef4444" },
  { name: "Axe PvP", icon: "🪓", description: "Axe-based combat", color: "#f97316" },
  { name: "Crystal PvP", icon: "💎", description: "End crystal PvP", color: "#8b5cf6" },
  { name: "Pot PvP", icon: "🧪", description: "Potion-based combat", color: "#06b6d4" },
  { name: "Shield PvP", icon: "🛡️", description: "Shield mechanics", color: "#64748b" },
  { name: "Bow PvP", icon: "🏹", description: "Archery combat", color: "#22c55e" },
  { name: "Vanilla", icon: "🌿", description: "No-debuff vanilla combat", color: "#84cc16" },
  { name: "Debuff", icon: "💀", description: "Weakness/slowness debuffs", color: "#1e1b4b" },
  { name: "SMP PvP", icon: "🏰", description: "Survival multiplayer combat", color: "#78350f" },
  { name: "Bedfight", icon: "🛏️", description: "Bed destruction combat", color: "#e11d48" },
  { name: "UHC", icon: "❤️", description: "Ultra Hardcore", color: "#dc2626" },
  { name: "SkyWars", icon: "🌤️", description: "Island-based combat", color: "#0ea5e9" },
  { name: "BedWars", icon: "🛡️", description: "Team bed protection", color: "#d97706" },
  { name: "SG / HG", icon: "🎮", description: "Survival Games / Hunger Games", color: "#7c3aed" },
  { name: "Sumo", icon: "🥊", description: "Knockback pushing", color: "#ec4899" },
  { name: "NoPot", icon: "🚫", description: "No potion combat", color: "#6b7280" },
  { name: "Gapple", icon: "🍎", description: "Golden apple combat", color: "#eab308" },
  { name: "Midfight", icon: "🎯", description: "Center island combat", color: "#f43f5e" },
  { name: "Parkour PvP", icon: "🏃", description: "Parkour + combat", color: "#14b8a6" },
  { name: "Buildtech", icon: "🔧", description: "Building technique combat", color: "#a855f7" },
  { name: "Pearl Rush", icon: "⚡", description: "Ender pearl combat", color: "#fbbf24" },
  { name: "Tower Defense", icon: "🏯", description: "Tower-based defense", color: "#059669" },
  { name: "Stick PvP", icon: "🪄", description: "Stick-only combat", color: "#6366f1" },
  { name: "Fist PvP", icon: "👊", description: "No weapons, fist only", color: "#9ca3af" },
  { name: "Combo PvP", icon: "💥", description: "Combination combos", color: "#fb923c" },
];

const PLAYER_NAMES = [
  "Notch", "Herobrine", "xXPvPGodXx", "DragonSlayer99", "CrystalWarrior",
  "SwordMaster420", "NightShadow", "IceQueen", "FirePhoenix", "ThunderBolt",
  "ShadowBlade", "VoidWalker", "StormRider", "BlazeFighter", "PearlMaster",
  "ComboCrusher", "TierHunter", "ProPvPer", "AxeKing", "PotBot",
  "ShieldBreaker", "BowSniper", "GappleGod", "SumoChamp", "BuilderPro",
  "MidFightKing", "PearlGod", "NoPotChamp", "UHCPro", "SkyWarsPro",
  "BedWarsLegend", "SGChampion", "DebouffPro", "VanillaPvPer", "SMPKing",
];

const COUNTRIES = [
  { name: "United States", code: "US" },
  { name: "Germany", code: "DE" },
  { name: "France", code: "FR" },
  { name: "United Kingdom", code: "GB" },
  { name: "Canada", code: "CA" },
  { name: "Australia", code: "AU" },
  { name: "Netherlands", code: "NL" },
  { name: "Brazil", code: "BR" },
  { name: "Spain", code: "ES" },
  { name: "Poland", code: "PL" },
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Admin user
  const [adminUser] = await db.insert(usersTable).values({
    username: "admin",
    email: "admin@versustiers.gg",
    passwordHash: hashPassword("admin123"),
    role: "owner",
    status: "active",
  }).onConflictDoNothing().returning();
  console.log(adminUser ? "✅ Created admin: admin@versustiers.gg / admin123" : "ℹ️  Admin already exists");

  // Gamemodes
  console.log("📝 Creating gamemodes...");
  for (let i = 0; i < GAMEMODES.length; i++) {
    await db.insert(gamemodesTable).values({ ...GAMEMODES[i], enabled: true, sortOrder: i }).onConflictDoNothing();
  }
  const allGamemodes = await db.select().from(gamemodesTable);
  console.log(`✅ ${allGamemodes.length} gamemodes ready`);

  // Badges
  console.log("🏅 Creating badges...");
  const badgeData = [
    { name: "LEGEND", icon: "👑", description: "Top 1 all-time", color: "#f59e0b" },
    { name: "VETERAN", icon: "⭐", description: "Long-time player", color: "#8b5cf6" },
    { name: "STAFF", icon: "🛡️", description: "Staff member", color: "#06b6d4" },
    { name: "STREAMER", icon: "🎥", description: "Content creator", color: "#ef4444" },
    { name: "MVP", icon: "🔥", description: "Most Valuable Player", color: "#f97316" },
  ];
  for (const bd of badgeData) {
    await db.insert(badgesTable).values(bd).onConflictDoNothing();
  }
  const allBadges = await db.select().from(badgesTable);
  console.log(`✅ ${allBadges.length} badges ready`);

  // Players
  console.log("👥 Creating players...");
  const existing = await db.select().from(playersTable);
  const existingNames = new Set(existing.map(p => p.minecraftUsername));
  let created = 0;
  for (const name of PLAYER_NAMES) {
    if (existingNames.has(name)) continue;
    const country = pick(COUNTRIES);
    await db.insert(playersTable).values({
      minecraftUsername: name,
      discord: `${name.toLowerCase()}`,
      country: country.name,
      countryCode: country.code,
      points: 0,
      overallTier: "UR",
    });
    created++;
  }
  console.log(`✅ Created ${created} new players`);

  // Rankings
  console.log("🏆 Creating rankings...");
  const allPlayers = await db.select().from(playersTable);
  let rankCount = 0;
  
  for (const player of allPlayers) {
    const gmCount = rand(3, 8);
    const shuffled = [...allGamemodes].sort(() => Math.random() - 0.5).slice(0, gmCount);
    let bestTier = "UR";
    let totalPts = 0;

    for (const gm of shuffled) {
      const tier = TIERS[rand(0, TIERS.length - 1)];
      const basePts = TIER_POINTS[tier] ?? 50;
      const points = Math.max(0, basePts + rand(-150, 150));
      const matches = rand(50, 500);
      const kills = rand(Math.floor(matches * 0.5), Math.floor(matches * 2));
      const deaths = rand(Math.floor(matches * 0.2), Math.floor(matches * 0.8));
      const winRate = Math.round((rand(20, 80) + Math.random()) * 10) / 10;

      try {
        await db.insert(rankingsTable).values({
          playerId: player.id,
          gamemodeId: gm.id,
          tier, points, winRate, matches, kills, deaths,
        }).onConflictDoNothing();
        if ((TIER_ORDER[tier] ?? 0) > (TIER_ORDER[bestTier] ?? 0)) bestTier = tier;
        totalPts += points;
        rankCount++;
      } catch { /* skip */ }
    }

    await db.update(playersTable)
      .set({ overallTier: bestTier, points: totalPts })
      .where(eq(playersTable.id, player.id));
  }
  console.log(`✅ Created ${rankCount} rankings`);

  // Assign badges to first 10 players
  console.log("🏅 Assigning badges...");
  for (let i = 0; i < Math.min(10, allPlayers.length); i++) {
    const badge = allBadges[i % allBadges.length];
    if (badge) {
      await db.insert(playerBadgesTable).values({ playerId: allPlayers[i].id, badgeId: badge.id }).onConflictDoNothing();
    }
  }

  // Activity logs
  await db.insert(activityLogsTable).values([
    { type: "system", description: "Database seeded with initial data" },
    { type: "player_added", description: "35 players added to the ranking system" },
    { type: "season_start", description: "Season 1 rankings are now live!" },
  ]);

  console.log("🎉 Database seed complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
