import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type SlashCommandStringOption,
} from "discord.js";
import { submitTest } from "../lib/api.js";
import { CYAN } from "./panel.js";
import { memberHasTesterRole } from "../lib/roles.js";

const TIERS = ["HT1","HT2","HT3","HT4","HT5","LT1","LT2","LT3","LT4","LT5","UR"];

const TIER_COLORS: Record<string, number> = {
  HT1: 0xFFD700, HT2: 0xFFA500, HT3: 0x00D2FF, HT4: 0x00BFFF, HT5: 0x00FFEE,
  LT1: 0x9B59B6, LT2: 0x7D3C98, LT3: 0x3498DB, LT4: 0x888888, LT5: 0x666666,
  UR: 0x444444,
};

/**
 * Build the slash command definition with dynamic gamemode choices.
 * Called from deploy-commands.ts with choices fetched from the live API,
 * so the dropdown always reflects whatever gamemodes exist in the admin panel.
 */
export function buildData(gamemodeChoices: { name: string; value: string }[]) {
  return new SlashCommandBuilder()
    .setName("submittest")
    .setDescription("Submit a tier test result and update the leaderboard")
    .addStringOption(opt =>
      opt.setName("username")
        .setDescription("Player's Minecraft username")
        .setRequired(true)
    )
    .addStringOption((opt: SlashCommandStringOption) => {
      opt
        .setName("gamemode")
        .setDescription("Gamemode that was tested")
        .setRequired(true);
      if (gamemodeChoices.length > 0) {
        // Discord allows max 25 choices per option
        opt.addChoices(...gamemodeChoices.slice(0, 25));
      }
      return opt;
    })
    .addStringOption(opt =>
      opt.setName("rank_earned")
        .setDescription("Tier earned in the test")
        .setRequired(true)
        .addChoices(...TIERS.map(t => ({ name: t, value: t })))
    )
    .addStringOption(opt =>
      opt.setName("rank_before")
        .setDescription("Player's tier before the test (optional)")
        .setRequired(false)
        .addChoices(...TIERS.map(t => ({ name: t, value: t })), { name: "Unranked", value: "UR" })
    )
    .addStringOption(opt =>
      opt.setName("tester_name")
        .setDescription("Tester's name (defaults to your Discord name)")
        .setRequired(false)
    );
}

// Static fallback used only if deploy-commands didn't set choices (shouldn't happen)
export const data = buildData([]);

export async function execute(interaction: ChatInputCommandInteraction) {
  // ── Tester-role gate ─────────────────────────────────────────────────────────
  if (!memberHasTesterRole(interaction.member as any)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Access Denied")
          .setDescription(
            "Only **testers** can submit test results.\n\n" +
            "If you believe this is a mistake, contact a server admin."
          ),
      ],
    });
    return;
  }

  await interaction.deferReply();

  const username    = interaction.options.getString("username", true);
  const gamemode    = interaction.options.getString("gamemode", true);
  const rankEarned  = interaction.options.getString("rank_earned", true);
  const rankBefore  = interaction.options.getString("rank_before") ?? undefined;
  const testerName  = interaction.options.getString("tester_name") ?? interaction.user.username;

  try {
    const result = await submitTest({ username, testerName, gamemode, rankBefore, rankEarned });

    const tierColor = TIER_COLORS[rankEarned] ?? CYAN;
    const isPromotion = rankBefore && rankBefore !== rankEarned;
    const arrow = isPromotion ? `~~${rankBefore}~~ → **${rankEarned}**` : `**${rankEarned}**`;

    const embed = new EmbedBuilder()
      .setColor(tierColor)
      .setTitle("📋  Test Result Submitted")
      .setThumbnail(`https://mc-heads.net/avatar/${result.player.minecraftUsername}/64`)
      .addFields(
        { name: "👤  Player",     value: `\`${result.player.minecraftUsername}\``,  inline: true },
        { name: "🎯  Gamemode",   value: gamemode,                                   inline: true },
        { name: "🏅  Tester",     value: `\`${testerName}\``,                        inline: true },
        { name: "📊  Rank",       value: arrow,                                       inline: true },
        { name: "⭐  Overall",    value: `**${result.player.overallTier}**`,          inline: true },
      )
      .setFooter({ text: `Tested by ${testerName}  •  VERSUS TIERS` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const errEmbed = new EmbedBuilder()
      .setColor(0xFF4444)
      .setTitle("❌  Submission Failed")
      .setDescription(`\`\`\`${message}\`\`\``)
      .setFooter({ text: "Make sure the player exists and the gamemode name is correct." });
    await interaction.editReply({ embeds: [errEmbed] });
  }
}
