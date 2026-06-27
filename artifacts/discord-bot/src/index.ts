import { Client, GatewayIntentBits, Events } from "discord.js";
import * as panelCmd from "./commands/panel.js";
import * as submittestCmd from "./commands/submittest.js";
import * as profileCmd from "./commands/profile.js";
import * as waitlistCmd from "./commands/waitlist.js";
import * as cooldownCmd from "./commands/cooldown.js";
import {
  handleVerifyButton,
  handleVerifyModal,
  handleRegionSelect,
  handleAccountSelect,
  handleGamemodeButton,
} from "./commands/panel.js";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("❌  DISCORD_BOT_TOKEN is required. Set it in Replit Secrets.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// ── Ready ─────────────────────────────────────────────────────────────────────
client.once(Events.ClientReady, (c) => {
  console.log(`✅  Logged in as ${c.user.tag}`);
  console.log(`🌐  API base: ${process.env.API_BASE_URL ?? "http://localhost:80/api"}`);
  c.user.setActivity("VERSUS TIERS | /profile", { type: 0 });
});

// ── Interaction handler ───────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  // Slash commands
  if (interaction.isChatInputCommand()) {
    switch (interaction.commandName) {
      case "panel":       await panelCmd.execute(interaction).catch(console.error);       break;
      case "submittest":  await submittestCmd.execute(interaction).catch(console.error);  break;
      case "profile":     await profileCmd.execute(interaction).catch(console.error);     break;
      case "waitlist":    await waitlistCmd.execute(interaction).catch(console.error);    break;
      case "cooldown":    await cooldownCmd.execute(interaction).catch(console.error);    break;
    }
    return;
  }

  // Button interactions
  if (interaction.isButton()) {
    const { customId } = interaction;

    if (customId === "verify_profile") {
      await handleVerifyButton(interaction).catch(console.error);
      return;
    }

    if (customId.startsWith("gm_")) {
      const gamemode = customId.replace("gm_", "");
      await handleGamemodeButton(interaction, gamemode).catch(console.error);
      return;
    }
  }

  // Modal submissions
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "verify_username_modal") {
      await handleVerifyModal(interaction).catch(console.error);
    }
    return;
  }

  // Select menu interactions
  if (interaction.isStringSelectMenu()) {
    const { customId } = interaction;

    if (customId.startsWith("verify_region:")) {
      await handleRegionSelect(interaction).catch(console.error);
      return;
    }

    if (customId.startsWith("verify_account:")) {
      await handleAccountSelect(interaction).catch(console.error);
      return;
    }
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
client.login(token);
