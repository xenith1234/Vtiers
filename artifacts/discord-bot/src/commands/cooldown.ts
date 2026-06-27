import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getWaitlist, isOnCooldown, getCooldownRemaining, getVerified } from "../lib/storage.js";
import { CYAN, GAMEMODES } from "./panel.js";

export const data = new SlashCommandBuilder()
  .setName("cooldown")
  .setDescription("Check your waitlist cooldown status across all gamemodes")
  .addUserOption(opt =>
    opt.setName("user")
      .setDescription("Discord user to check (leave blank for yourself)")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("user") ?? interaction.user;
  const userId = target.id;
  const isSelf = target.id === interaction.user.id;

  const waitlist = getWaitlist();
  const verified = getVerified(userId);

  const lines: string[] = [];

  for (const gm of GAMEMODES) {
    const entries = waitlist[gm.id] ?? [];
    const entry = entries.find(e => e.userId === userId);

    if (!entry) {
      lines.push(`${gm.emoji} **${gm.label}** — No entry`);
    } else if (isOnCooldown(userId, gm.id)) {
      const rem = getCooldownRemaining(userId, gm.id);
      lines.push(`${gm.emoji} **${gm.label}** — 🔒 Cooldown: **${rem}** remaining`);
    } else if (entry.lastTestedAt) {
      lines.push(`${gm.emoji} **${gm.label}** — ✅ Cooldown cleared`);
    } else {
      lines.push(`${gm.emoji} **${gm.label}** — ⏳ On waitlist (not yet tested)`);
    }
  }

  const name = verified?.minecraftUsername
    ? `${verified.minecraftUsername} (${target.username})`
    : target.username;

  const embed = new EmbedBuilder()
    .setColor(CYAN)
    .setTitle(`⏰  Cooldown Status — ${name}`)
    .setDescription(lines.join("\n"))
    .setThumbnail(target.displayAvatarURL())
    .setFooter({ text: "5-day cooldown applies after each test  •  VERSUS TIERS" })
    .setTimestamp();

  await interaction.reply({
    flags: isSelf ? MessageFlags.Ephemeral : undefined,
    embeds: [embed],
  });
}
