import { REST, Routes } from "discord.js";
import * as panel from "./commands/panel.js";
import * as submittest from "./commands/submittest.js";
import * as profile from "./commands/profile.js";

const token    = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId  = process.env.DISCORD_GUILD_ID; // optional: deploy to single guild (instant)

if (!token || !clientId) {
  console.error("❌  DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID must be set.");
  process.exit(1);
}

const commands = [panel.data, submittest.data, profile.data].map(c => c.toJSON());
const rest = new REST({ version: "10" }).setToken(token);

try {
  console.log(`🔄  Registering ${commands.length} slash commands…`);

  if (guildId) {
    // Guild commands: instant refresh (for testing)
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`✅  Registered to guild ${guildId}`);
  } else {
    // Global commands: up to 1 hour to propagate
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("✅  Registered globally (up to 1h to propagate)");
  }
} catch (err) {
  console.error("❌  Failed to register commands:", err);
  process.exit(1);
}
