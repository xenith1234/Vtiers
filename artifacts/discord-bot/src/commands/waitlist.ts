import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getWaitlist, removeFromWaitlist } from "../lib/storage.js";
import { memberHasTesterRole } from "../lib/roles.js";
import { CYAN, GAMEMODES } from "./panel.js";

export const data = new SlashCommandBuilder()
  .setName("waitlist")
  .setDescription("View or manage the testing waitlist (testers only)")
  .addStringOption(opt =>
    opt.setName("gamemode")
      .setDescription("Filter by gamemode (leave blank for all)")
      .setRequired(false)
      .addChoices(...GAMEMODES.map(g => ({ name: g.label, value: g.id })))
  )
  .addUserOption(opt =>
    opt.setName("remove")
      .setDescription("Remove a user from the waitlist (testers only)")
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName("remove_gamemode")
      .setDescription("Gamemode to remove the user from")
      .setRequired(false)
      .addChoices(...GAMEMODES.map(g => ({ name: g.label, value: g.id })))
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!memberHasTesterRole(interaction.member as any)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Access Denied")
          .setDescription("Only **testers** can view or manage the waitlist."),
      ],
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const gamemodeFilter = interaction.options.getString("gamemode");
  const removeUser     = interaction.options.getUser("remove");
  const removeGm       = interaction.options.getString("remove_gamemode");

  // ── Remove a user from the waitlist ────────────────────────────────────────
  if (removeUser) {
    const gmId = removeGm ?? gamemodeFilter;
    if (!gmId) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF9900)
            .setTitle("⚠️  Specify a Gamemode")
            .setDescription("Use `remove_gamemode` (or `gamemode`) to indicate which waitlist to remove them from."),
        ],
      });
      return;
    }
    removeFromWaitlist(removeUser.id, gmId);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00FF99)
          .setTitle("✅  Removed")
          .setDescription(`**${removeUser.username}** has been removed from the **${gmId.toUpperCase()}** waitlist.`),
      ],
    });
    return;
  }

  // ── Display waitlist ────────────────────────────────────────────────────────
  const allWaitlists = getWaitlist();
  const gmKeys = gamemodeFilter
    ? [gamemodeFilter]
    : GAMEMODES.map(g => g.id);

  const fields: { name: string; value: string; inline: boolean }[] = [];

  for (const gmId of gmKeys) {
    const gm = GAMEMODES.find(g => g.id === gmId);
    const label = gm?.label ?? gmId.toUpperCase();
    const emoji = gm?.emoji ?? "🎮";

    const entries = (allWaitlists[gmId] ?? []).filter(e => !e.lastTestedAt || !isCooldownActive(e));
    if (entries.length === 0) {
      fields.push({ name: `${emoji} ${label}`, value: "*Empty*", inline: true });
    } else {
      const lines = entries.map((e, i) =>
        `**${i + 1}.** \`${e.minecraftUsername}\` — <@${e.userId}>\n    *Joined <t:${Math.floor(new Date(e.addedAt).getTime() / 1000)}:R>*`
      );
      fields.push({ name: `${emoji} ${label} (${entries.length})`, value: lines.join("\n"), inline: false });
    }
  }

  // Count only entries actually shown (on waitlist but cooldown not active)
  const total = gmKeys.reduce((sum, id) => {
    const entries = allWaitlists[id] ?? [];
    return sum + entries.filter(e => !e.lastTestedAt || !isCooldownActive(e)).length;
  }, 0);

  const embed = new EmbedBuilder()
    .setColor(CYAN)
    .setTitle(gamemodeFilter
      ? `📋  ${gamemodeFilter.toUpperCase()} Waitlist`
      : "📋  All Waitlists")
    .setDescription(`**${total}** player${total !== 1 ? "s" : ""} awaiting a test.`)
    .addFields(fields)
    .setFooter({ text: "VERSUS TIERS  •  Testers only" })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

function isCooldownActive(entry: { lastTestedAt?: string }): boolean {
  if (!entry.lastTestedAt) return false;
  const elapsed = Date.now() - new Date(entry.lastTestedAt).getTime();
  return elapsed < 5 * 24 * 60 * 60 * 1000;
}
