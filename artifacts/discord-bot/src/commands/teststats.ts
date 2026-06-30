import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getTestLog } from "../lib/storage.js";
import { memberHasTesterRole } from "../lib/roles.js";
import { CYAN } from "./panel.js";

const TIER_ORDER = ["HT1","HT2","HT3","HT4","HT5","LT1","LT2","LT3","LT4","LT5","UR"];

export const data = new SlashCommandBuilder()
  .setName("teststats")
  .setDescription("View test submission stats for yourself or another tester")
  .addUserOption(opt =>
    opt.setName("user")
      .setDescription("Tester to look up (defaults to you)")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const target   = interaction.options.getUser("user") ?? interaction.user;
  const isSelf   = target.id === interaction.user.id;

  // Only testers can look up other testers
  if (!isSelf && !memberHasTesterRole(interaction.member as any)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Access Denied")
          .setDescription("Only testers can view other testers' stats."),
      ],
    });
    return;
  }

  await interaction.deferReply();

  const log = getTestLog().filter(e => e.testerDiscordId === target.id);

  if (log.length === 0) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(CYAN)
          .setTitle(`📊  Test Stats — ${target.username}`)
          .setDescription("*No test submissions recorded yet.*\n\nStats are tracked from the moment the bot started logging — older submissions aren't included.")
          .setThumbnail(target.displayAvatarURL()),
      ],
    });
    return;
  }

  // ── Gamemode breakdown ──────────────────────────────────────────────────────
  const byGamemode: Record<string, number> = {};
  for (const e of log) {
    byGamemode[e.gamemode] = (byGamemode[e.gamemode] ?? 0) + 1;
  }
  const sortedGamemodes = Object.entries(byGamemode)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // ── Tier breakdown ──────────────────────────────────────────────────────────
  const byTier: Record<string, number> = {};
  for (const e of log) {
    byTier[e.rankEarned] = (byTier[e.rankEarned] ?? 0) + 1;
  }
  const sortedTiers = Object.entries(byTier)
    .sort((a, b) => TIER_ORDER.indexOf(a[0]) - TIER_ORDER.indexOf(b[0]));

  // ── Time windows ────────────────────────────────────────────────────────────
  const now = Date.now();
  const weekAgo  = now - 7  * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recent7  = log.filter(e => new Date(e.submittedAt).getTime() > weekAgo).length;
  const recent30 = log.filter(e => new Date(e.submittedAt).getTime() > monthAgo).length;

  const mostActiveGamemode = sortedGamemodes[0]?.[0] ?? "—";
  const mostGivenTier      = sortedTiers[0]?.[0]     ?? "—";

  const gamemodeLines = sortedGamemodes
    .map(([gm, count]) => `\`${gm}\` — **${count}**`)
    .join("\n") || "*none*";

  const tierLine = sortedTiers
    .map(([tier, count]) => `\`${tier}\`×${count}`)
    .join("  ") || "*none*";

  const embed = new EmbedBuilder()
    .setColor(CYAN)
    .setTitle(`📊  Test Stats — ${target.username}`)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      { name: "🧪  Total Tests",      value: `**${log.length}**`,       inline: true },
      { name: "📅  Last 7 Days",      value: `**${recent7}**`,          inline: true },
      { name: "📆  Last 30 Days",     value: `**${recent30}**`,         inline: true },
      { name: "🎮  Top Gamemode",     value: `**${mostActiveGamemode}**`, inline: true },
      { name: "🏅  Most Given Tier",  value: `**${mostGivenTier}**`,    inline: true },
      { name: "\u200b",               value: "\u200b",                   inline: true },
      { name: "📊  Tier Breakdown",   value: tierLine },
      { name: "🎮  By Gamemode",      value: gamemodeLines },
    )
    .setFooter({ text: "VERSUS TIERS  •  Stats since bot logging began" })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
