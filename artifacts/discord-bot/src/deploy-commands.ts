import { REST, Routes } from "discord.js";
import * as panel from "./commands/panel.js";
import * as submittest from "./commands/submittest.js";
import * as profile from "./commands/profile.js";
import * as waitlist from "./commands/waitlist.js";
import * as cooldown from "./commands/cooldown.js";
import * as close from "./commands/close.js";
import * as leaderboard from "./commands/leaderboard.js";
import * as syncgamemodes from "./commands/syncgamemodes.js";

const token    = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId  = process.env.DISCORD_GUILD_ID;
const apiBase  = process.env.API_BASE_URL ?? "http://localhost:80/api";

if (!token || !clientId) {
  console.error("❌  DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID must be set.");
  process.exit(1);
}

// ── Fetch live gamemodes so /submittest and /leaderboard choices match the DB ──
type GamemodeFromApi = { id: number; name: string; enabled?: boolean };
let gamemodes: GamemodeFromApi[] = [];

try {
  console.log(`🔄  Fetching gamemodes from API (${apiBase})…`);
  const res = await fetch(`${apiBase}/gamemodes`);
  if (res.ok) {
    const all = await res.json() as GamemodeFromApi[];
    gamemodes = all.filter(g => g.enabled !== false);
    console.log(`✅  Loaded ${gamemodes.length} gamemodes: ${gamemodes.map(g => g.name).join(", ")}`);
  } else {
    console.warn(`⚠️  Could not fetch gamemodes (HTTP ${res.status}). Registering without choices.`);
  }
} catch (err) {
  console.warn("⚠️  API not reachable. Registering without choices.", err);
}

// /submittest uses gamemode NAME as value (API fuzzy-matches by name)
const submitChoices = gamemodes.slice(0, 25).map(g => ({ name: g.name, value: g.name }));

// /leaderboard uses gamemode ID as value (direct DB lookup)
const lbChoices = gamemodes.slice(0, 25).map(g => ({ name: g.name, value: String(g.id) }));

const commands = [
  panel.data,
  submittest.buildData(submitChoices),
  profile.data,
  waitlist.data,
  cooldown.data,
  close.data,
  leaderboard.buildData(lbChoices),
  syncgamemodes.data,
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

try {
  console.log(`🔄  Registering ${commands.length} slash commands…`);
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`✅  Registered to guild ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("✅  Registered globally (up to 1h to propagate)");
  }
} catch (err) {
  console.error("❌  Failed to register commands:", err);
  process.exit(1);
}
