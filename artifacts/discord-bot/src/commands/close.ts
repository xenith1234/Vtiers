import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  ChannelType,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import { markTested, getWaitlist } from "../lib/storage.js";
import { memberHasTesterRole } from "../lib/roles.js";
import { CYAN, GAMEMODES } from "./panel.js";

export const data = new SlashCommandBuilder()
  .setName("close")
  .setDescription("Mark a waitlist test as done and delete this channel (testers only)");

const TIER_COLORS: Record<string, number> = {
  HT1: 0xFFD700, HT2: 0xFFA500, HT3: 0x00D2FF, HT4: 0x00BFFF, HT5: 0x00FFEE,
  LT1: 0x9B59B6, LT2: 0x7D3C98, LT3: 0x3498DB, LT4: 0x888888, LT5: 0x666666,
  UR: 0x444444,
};

export async function execute(interaction: ChatInputCommandInteraction) {
  // ── Tester-role gate ─────────────────────────────────────────────────────────
  if (!memberHasTesterRole(interaction.member as any)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Access Denied")
          .setDescription("Only **testers** can close waitlist channels."),
      ],
    });
    return;
  }

  // ── Must be run inside a guild text channel ──────────────────────────────────
  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Wrong Channel Type")
          .setDescription("This command can only be used inside a guild text channel."),
      ],
    });
    return;
  }

  const tc = channel as TextChannel;

  // ── Parse waitlist channel from topic ────────────────────────────────────────
  // Topic format: "Waitlist channel for {mcUsername} — {gmLabel} test"
  const topic = tc.topic ?? "";
  const match = topic.match(/^Waitlist channel for (.+) — (.+) test$/);

  if (!match || !tc.name.endsWith("-waitlist")) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF9900)
          .setTitle("⚠️  Not a Waitlist Channel")
          .setDescription("This command must be run inside a **waitlist channel** created by the panel."),
      ],
    });
    return;
  }

  const mcUsername = match[1];
  const gmLabel    = match[2];

  // Find the gamemode ID from the label
  const gm = GAMEMODES.find(g => g.label === gmLabel);
  const gamemodeId = gm?.id;

  // Find the waitlist entry to get the Discord user ID
  const allWaitlists = getWaitlist();
  const entries = gamemodeId ? (allWaitlists[gamemodeId] ?? []) : [];
  const entry = entries.find(e => e.minecraftUsername.toLowerCase() === mcUsername.toLowerCase());

  // Mark the player as tested (starts 5-day cooldown)
  const marked = gamemodeId ? markTested(gamemodeId, mcUsername) : false;

  // ── Acknowledge and schedule deletion ───────────────────────────────────────
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x00FF99)
        .setTitle("✅  Test Session Closed")
        .setDescription(
          `**${mcUsername}** has been tested in **${gmLabel}** by ${interaction.user.toString()}.\n\n` +
          (marked && entry
            ? `<@${entry.userId}> — your 5-day cooldown has started. Good luck with your rank!\n\n`
            : marked
              ? "✅ Cooldown activated.\n\n"
              : "⚠️ Player not found in the waitlist — cooldown was **not** activated. Use `/waitlist` to check.\n\n"
          ) +
          "⏳ This channel will be **deleted in 30 seconds**."
        )
        .setThumbnail(`https://mc-heads.net/avatar/${mcUsername}/64`)
        .setFooter({ text: "VERSUS TIERS  •  Compete. Rank. Dominate." })
        .setTimestamp(),
    ],
  });

  // Delete the channel after 30s
  setTimeout(async () => {
    try {
      await tc.delete(`Test closed by ${interaction.user.username}`);
    } catch {
      // Channel may already be deleted; ignore
    }
  }, 30_000);
}
