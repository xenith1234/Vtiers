import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ChannelType,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type Guild,
  type TextChannel,
  type SlashCommandStringOption,
} from "discord.js";
import { addAppeal, getAppeal, updateAppeal } from "../lib/storage.js";
import { memberHasTesterRole } from "../lib/roles.js";
import { CYAN } from "./panel.js";

const TIERS = ["HT1","HT2","HT3","HT4","HT5","LT1","LT2","LT3","LT4","LT5","UR"];
const APPEAL_CHANNEL_NAME = "appeal-reviews";

export function buildData(gamemodeChoices: { name: string; value: string }[]) {
  return new SlashCommandBuilder()
    .setName("appeal")
    .setDescription("Submit a re-test appeal with evidence")
    .addStringOption(opt =>
      opt.setName("reason")
        .setDescription("Why do you deserve a re-test?")
        .setRequired(true)
        .setMaxLength(500)
    )
    .addStringOption(opt =>
      opt.setName("evidence")
        .setDescription("Link to your evidence (video, medal clip, etc.)")
        .setRequired(true)
    )
    .addStringOption((opt: SlashCommandStringOption) => {
      opt.setName("gamemode")
        .setDescription("Which gamemode are you appealing?")
        .setRequired(true);
      if (gamemodeChoices.length > 0) opt.addChoices(...gamemodeChoices.slice(0, 25));
      return opt;
    })
    .addStringOption(opt =>
      opt.setName("current_tier")
        .setDescription("Your current tier in this gamemode")
        .setRequired(false)
        .addChoices(...TIERS.map(t => ({ name: t, value: t })))
    )
    .addStringOption(opt =>
      opt.setName("desired_tier")
        .setDescription("Tier you believe you deserve")
        .setRequired(false)
        .addChoices(...TIERS.map(t => ({ name: t, value: t })))
    );
}

export const data = buildData([]);

async function findAppealChannel(guild: Guild): Promise<TextChannel | null> {
  const channels = await guild.channels.fetch();
  const ch = channels.find(c => c?.type === ChannelType.GuildText && c.name === APPEAL_CHANNEL_NAME);
  return (ch as TextChannel) ?? null;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const reason      = interaction.options.getString("reason",       true);
  const evidence    = interaction.options.getString("evidence",     true);
  const gamemode    = interaction.options.getString("gamemode",     true);
  const currentTier = interaction.options.getString("current_tier") ?? undefined;
  const desiredTier = interaction.options.getString("desired_tier") ?? undefined;

  if (!evidence.startsWith("http://") && !evidence.startsWith("https://")) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Invalid Evidence Link")
          .setDescription("Please provide a valid `https://` URL (e.g. a medal.tv clip or YouTube video)."),
      ],
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const appeal = addAppeal({
    userId:            interaction.user.id,
    minecraftUsername: interaction.user.username,
    gamemode,
    reason,
    evidence,
    previousTier: currentTier,
    desiredTier,
  });

  const reviewEmbed = new EmbedBuilder()
    .setColor(0xFFAA00)
    .setTitle("📋  New Re-Test Appeal")
    .addFields(
      { name: "👤  Player",       value: `<@${interaction.user.id}> (\`${interaction.user.username}\`)`, inline: true },
      { name: "🎮  Gamemode",     value: gamemode,                                                        inline: true },
      { name: "\u200b",           value: "\u200b",                                                        inline: true },
      { name: "📊  Current Tier", value: currentTier ? `**${currentTier}**` : "*Not specified*",          inline: true },
      { name: "🎯  Desired Tier", value: desiredTier ? `**${desiredTier}**` : "*Not specified*",          inline: true },
      { name: "\u200b",           value: "\u200b",                                                        inline: true },
      { name: "📝  Reason",       value: reason },
      { name: "🔗  Evidence",     value: evidence },
    )
    .setFooter({ text: `Appeal ID: ${appeal.id}  •  VERSUS TIERS` })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`appeal_approve:${appeal.id}`)
      .setLabel("Approve")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`appeal_deny:${appeal.id}`)
      .setLabel("Deny")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger),
  );

  let postedToChannel = false;
  if (interaction.guild) {
    const appealChannel = await findAppealChannel(interaction.guild);
    if (appealChannel) {
      const msg = await appealChannel.send({ embeds: [reviewEmbed], components: [row] });
      updateAppeal(appeal.id, { messageId: msg.id, channelId: appealChannel.id });
      postedToChannel = true;
    }
  }

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x00FF99)
        .setTitle("✅  Appeal Submitted")
        .setDescription(
          `Your re-test appeal for **${gamemode}** has been received.\n\n` +
          (postedToChannel
            ? "Staff have been notified and you'll receive a **DM** when it's reviewed."
            : "⚠️ The `#appeal-reviews` channel wasn't found — ask an admin to create it so staff are notified.") +
          `\n\n**Appeal ID:** \`${appeal.id}\``
        )
        .setFooter({ text: "Appeals are typically reviewed within 48 hours." }),
    ],
  });
}

// ── Button handlers (called from index.ts) ────────────────────────────────────

export async function handleApproveButton(interaction: ButtonInteraction, appealId: string) {
  await _handleDecision(interaction, appealId, "approved");
}

export async function handleDenyButton(interaction: ButtonInteraction, appealId: string) {
  await _handleDecision(interaction, appealId, "denied");
}

async function _handleDecision(
  interaction: ButtonInteraction,
  appealId: string,
  decision: "approved" | "denied"
) {
  // Only testers/staff can action appeals
  if (!memberHasTesterRole(interaction.member as any)) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Only testers can review appeals." });
    return;
  }

  await interaction.deferUpdate();

  const appeal = getAppeal(appealId);
  if (!appeal) {
    await interaction.followUp({ flags: MessageFlags.Ephemeral, content: "❌ Appeal not found in storage." });
    return;
  }
  if (appeal.status !== "pending") {
    await interaction.followUp({ flags: MessageFlags.Ephemeral, content: `⚠️ This appeal is already **${appeal.status}**.` });
    return;
  }

  updateAppeal(appealId, {
    status:     decision,
    reviewedBy: interaction.user.username,
    reviewedAt: new Date().toISOString(),
  });

  const isApproved = decision === "approved";
  const color      = isApproved ? 0x00FF99 : 0xFF4444;
  const emoji      = isApproved ? "✅" : "❌";

  // Update the original review embed — remove buttons, update title/color
  const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
    .setColor(color)
    .setTitle(`${emoji}  Appeal ${isApproved ? "Approved" : "Denied"}`)
    .setFooter({ text: `Reviewed by ${interaction.user.username}  •  Appeal ID: ${appealId}` });

  await interaction.message.edit({ embeds: [updatedEmbed], components: [] });

  // DM the player
  try {
    const player = await interaction.client.users.fetch(appeal.userId);
    await player.send({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setTitle(`${emoji}  Your Appeal Has Been ${isApproved ? "Approved" : "Denied"}`)
          .setDescription(
            isApproved
              ? `🎉 Your re-test appeal for **${appeal.gamemode}** has been **approved**!\n\nA tester will reach out to schedule your re-test. Stay active on the VERSUS TIERS Discord.`
              : `Your re-test appeal for **${appeal.gamemode}** has been **denied**.\n\nKeep grinding and feel free to appeal again in the future.`
          )
          .setFooter({ text: `Reviewed by ${interaction.user.username}  •  VERSUS TIERS` })
          .setTimestamp(),
      ],
    });
  } catch { /* Player has DMs closed */ }

  await interaction.followUp({
    flags: MessageFlags.Ephemeral,
    content: `${emoji} Appeal **${decision}** — player has been notified via DM.`,
  });
}
