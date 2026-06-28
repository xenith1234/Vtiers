import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandStringOption,
} from "discord.js";
import { fetchLeaderboard, fetchGamemodes } from "../lib/api.js";
import { CYAN } from "./panel.js";

const TIER_COLORS: Record<string, number> = {
  HT1: 0xFFD700, HT2: 0xFFA500, HT3: 0x00D2FF, HT4: 0x00BFFF, HT5: 0x00FFEE,
  LT1: 0x9B59B6, LT2: 0x7D3C98, LT3: 0x3498DB, LT4: 0x888888, LT5: 0x666666,
  UR: 0x444444,
};

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

/** Build command definition with dynamic gamemode choices from the live API. */
export function buildData(gamemodeChoices: { name: string; value: string }[]) {
  return new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the top ranked players overall or for a specific gamemode")
    .addStringOption((opt: SlashCommandStringOption) => {
      opt
        .setName("gamemode")
        .setDescription("Filter by gamemode (leave blank for overall)")
        .setRequired(false);
      if (gamemodeChoices.length > 0) {
        opt.addChoices(...gamemodeChoices.slice(0, 25));
      }
      return opt;
    });
}

export const data = buildData([]);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const gamemodeIdStr = interaction.options.getString("gamemode");
  const gamemodeId    = gamemodeIdStr ? parseInt(gamemodeIdStr) : undefined;

  try {
    // If a specific gamemode was chosen, get its name for the embed title
    let gamemodeName = "Overall";
    if (gamemodeId !== undefined) {
      try {
        const gms = await fetchGamemodes();
        gamemodeName = gms.find(g => g.id === gamemodeId)?.name ?? "Unknown";
      } catch { /* use fallback title */ }
    }

    const entries = await fetchLeaderboard(gamemodeId, 10);

    if (entries.length === 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(CYAN)
            .setTitle(`📊  ${gamemodeName} Leaderboard`)
            .setDescription("*No ranked players yet.*"),
        ],
      });
      return;
    }

    // Pick embed colour from the #1 player's tier
    const topTier = entries[0].tier ?? entries[0].overallTier ?? "UR";
    const color   = TIER_COLORS[topTier] ?? CYAN;

    const lines = entries.map((e, i) => {
      const medal  = RANK_MEDALS[i] ?? `**#${e.rank}**`;
      const tier   = e.tier ?? e.overallTier ?? "UR";
      const pts    = e.points.toLocaleString();
      const record = e.matches
        ? ` • ${e.matches} matches`
        : "";
      return `${medal} \`${e.username}\` — **${tier}** • ${pts} pts${record}`;
    });

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`📊  ${gamemodeName} Leaderboard`)
      .setDescription(lines.join("\n"))
      .setFooter({ text: `Top ${entries.length} players  •  VERSUS TIERS` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Failed to Load Leaderboard")
          .setDescription(`\`\`\`${msg}\`\`\``),
      ],
    });
  }
}
