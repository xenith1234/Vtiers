import { REST, Routes } from "discord.js";
import * as panel          from "./commands/panel.js";
import * as submittest     from "./commands/submittest.js";
import * as profile        from "./commands/profile.js";
import * as waitlist       from "./commands/waitlist.js";
import * as cooldown       from "./commands/cooldown.js";
import * as close          from "./commands/close.js";
import * as leaderboard    from "./commands/leaderboard.js";
import * as syncgamemodes  from "./commands/syncgamemodes.js";
import * as appeal         from "./commands/appeal.js";
import * as announce       from "./commands/announce.js";
import * as teststats      from "./commands/teststats.js";
import * as activity       from "./commands/activity.js";

const token    = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId  = process.env.DISCORD_GUILD_ID;
const apiBase  = process.env.API_BASE_URL ?? "http://localhost:80/api";

if (!token || !clientId) {
  console.error("❌  DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID must be set.");
  process.exit(1);
}

// ── Fetch live gamemodes so dropdowns always match the DB ─────────────────────
type ApiGamemode = { id: number; name: string; enabled?: boolean };
let gamemodes: ApiGamemode[] = [];

try {
  console.log(`🔄  Fetching gamemodes from ${apiBase}…`);
  const res = await fetch(`${apiBase}/gamemodes`);
  if (res.ok) {
    const all = (await res.json()) as ApiGamemode[];
    gamemodes = all.filter(g => g.enabled !== false);
    console.log(`✅  Loaded ${gamemodes.length} gamemodes: ${gamemodes.map(g => g.name).join(", ")}`);
  } else {
    console.warn(`⚠️  Could not fetch gamemodes (HTTP ${res.status}). Registering without choices.`);
  }
} catch (err) {
  console.warn("⚠️  API unreachable. Registering without gamemode choices.", err);
}

// /submittest + /appeal use name-as-value (API fuzzy-matches by name)
const nameChoices = gamemodes.slice(0, 25).map(g => ({ name: g.name, value: g.name }));

// /leaderboard uses id-as-value (direct DB lookup)
const idChoices = gamemodes.slice(0, 25).map(g => ({ name: g.name, value: String(g.id) }));

const commands = [
  panel.data,
  submittest.buildData(nameChoices),
  profile.data,
  waitlist.data,
  cooldown.data,
  close.data,
  leaderboard.buildData(idChoices),
  syncgamemodes.data,
  appeal.buildData(nameChoices),
  announce.data,
  teststats.data,
  activity.data,
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
