import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { fetchActivity } from "../lib/api.js";
import { CYAN } from "./panel.js";

const TIER_DOT: Record<string, string> = {
  HT1: "🟡", HT2: "🟠", HT3: "🔵", HT4: "🔵", HT5: "🟢",
  LT1: "🟣", LT2: "🟣", LT3: "🔷", LT4: "⚪", LT5: "⚪", UR: "⬛",
};

function timeAgo(iso: string): string {
  const ms   = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const data = new SlashCommandBuilder()
  .setName("activity")
  .setDescription("Show the latest ranking updates across all gamemodes");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    const entries = await fetchActivity(12);

    if (entries.length === 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(CYAN)
            .setTitle("📡  Recent Activity")
            .setDescription("*No ranking updates yet. Submit some tests with `/submittest`!*"),
        ],
      });
      return;
    }

    const lines = entries.map(e => {
      const dot = TIER_DOT[e.tier] ?? "⚫";
      return `${dot} **${e.username}** → \`${e.tier}\` in **${e.gamemode}** · *${timeAgo(e.updatedAt)}*`;
    });

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(CYAN)
          .setTitle("📡  Recent Ranking Activity")
          .setDescription(lines.join("\n"))
          .setFooter({ text: `Latest ${entries.length} updates  •  VERSUS TIERS` })
          .setTimestamp(),
      ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Failed to Load Activity")
          .setDescription(`\`\`\`${msg}\`\`\``),
      ],
    });
  }
}
