import { REST, Routes } from "discord.js";
import * as panel from "./commands/panel.js";
import * as submittest from "./commands/submittest.js";
import * as profile from "./commands/profile.js";
import * as waitlist from "./commands/waitlist.js";
import * as cooldown from "./commands/cooldown.js";

const token    = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId  = process.env.DISCORD_GUILD_ID;
const apiBase  = process.env.API_BASE_URL ?? "http://localhost:80/api";

if (!token || !clientId) {
  console.error("❌  DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID must be set.");
  process.exit(1);
}

// ── Fetch live gamemodes from the API so /submittest choices always match the DB ──
let gamemodeChoices: { name: string; value: string }[] = [];
try {
  console.log(`🔄  Fetching gamemodes from API (${apiBase})…`);
  const res = await fetch(`${apiBase}/gamemodes`);
  if (res.ok) {
    const gms = await res.json() as { name: string; enabled?: boolean }[];
    gamemodeChoices = gms
      .filter(g => g.enabled !== false)
      .slice(0, 25) // Discord max 25 choices
      .map(g => ({ name: g.name, value: g.name }));
    console.log(`✅  Loaded ${gamemodeChoices.length} gamemodes: ${gamemodeChoices.map(g => g.name).join(", ")}`);
  } else {
    console.warn(`⚠️  Could not fetch gamemodes (HTTP ${res.status}). Registering /submittest without choices — user will type gamemode name manually.`);
  }
} catch (err) {
  console.warn("⚠️  API not reachable. Registering /submittest without choices — user will type gamemode name manually.", err);
}

const commands = [
  panel.data,
  submittest.buildData(gamemodeChoices),
  profile.data,
  waitlist.data,
  cooldown.data,
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
