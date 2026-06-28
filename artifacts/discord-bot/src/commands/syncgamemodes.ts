import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { CYAN } from "./panel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
// Resolves to artifacts/discord-bot (two levels up from src/commands/)
const BOT_ROOT   = join(__dirname, "../..");

export const data = new SlashCommandBuilder()
  .setName("syncgamemodes")
  .setDescription("Re-sync /submittest and /leaderboard gamemode choices from the admin panel (admin only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(CYAN)
        .setTitle("🔄  Syncing Gamemodes…")
        .setDescription("Fetching gamemodes from the API and re-registering slash commands. This takes a few seconds."),
    ],
  });

  try {
    const output = await runDeployCommands();

    const lines = output.trim().split("\n").slice(-8); // last 8 lines
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00FF99)
          .setTitle("✅  Gamemode Choices Updated")
          .setDescription(
            "Slash commands have been re-registered with the latest gamemodes from the admin panel.\n\n" +
            "```\n" + lines.join("\n") + "\n```\n\n" +
            "The updated `/submittest` and `/leaderboard` dropdowns are **live immediately** in this server."
          )
          .setFooter({ text: "VERSUS TIERS  •  Run this any time you add/remove gamemodes in the admin panel." })
          .setTimestamp(),
      ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Sync Failed")
          .setDescription(
            "Failed to re-register slash commands.\n\n" +
            "```\n" + msg.slice(0, 800) + "\n```\n\n" +
            "Make sure the API server is running and the bot has correct env vars."
          ),
      ],
    });
  }
}

function runDeployCommands(): Promise<string> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const child = spawn("pnpm", ["run", "deploy-commands"], {
      cwd: BOT_ROOT,
      env: process.env,
    });

    child.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout + stderr);
      } else {
        reject(new Error((stdout + stderr).trim() || `Process exited with code ${code}`));
      }
    });

    child.on("error", (err) => reject(err));

    // Safety timeout — kill after 30s
    setTimeout(() => {
      child.kill();
      reject(new Error("Timed out after 30 seconds"));
    }, 30_000);
  });
}
