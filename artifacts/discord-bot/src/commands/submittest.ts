import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { submitTest } from "../lib/api.js";
import { CYAN } from "./panel.js";

const TIERS = ["HT1","HT2","HT3","HT4","HT5","LT1","LT2","LT3","LT4","LT5","UR"];
const GAMEMODES = ["Sword","Axe","NethOP","Pot","Mace","Crystal","UHC","SMP","Spear"];

const TIER_COLORS: Record<string, number> = {
  HT1: 0xFFD700, HT2: 0xFFA500, HT3: 0x00D2FF, HT4: 0x00BFFF, HT5: 0x00FFEE,
  LT1: 0x9B59B6, LT2: 0x7D3C98, LT3: 0x3498DB, LT4: 0x888888, LT5: 0x666666,
  UR: 0x444444,
};

export const data = new SlashCommandBuilder()
  .setName("submittest")
  .setDescription("Submit a tier test result and update the leaderboard")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addStringOption(opt =>
    opt.setName("username")
      .setDescription("Player's Minecraft username")
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("gamemode")
      .setDescription("Gamemode that was tested")
      .setRequired(true)
      .addChoices(...GAMEMODES.map(g => ({ name: g, value: g })))
  )
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

export async function execute(interaction: ChatInputCommandInteraction) {
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
