import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Post a styled announcement embed to any channel (admin only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(opt =>
    opt.setName("channel")
      .setDescription("Channel to post the announcement in")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("message")
      .setDescription("Announcement body text")
      .setRequired(true)
      .setMaxLength(2000)
  )
  .addStringOption(opt =>
    opt.setName("title")
      .setDescription("Embed title (optional)")
      .setRequired(false)
      .setMaxLength(256)
  )
  .addStringOption(opt =>
    opt.setName("color")
      .setDescription("Embed accent color")
      .setRequired(false)
      .addChoices(
        { name: "🔵 Cyan (default)", value: "cyan"   },
        { name: "🟡 Gold",           value: "gold"   },
        { name: "🔴 Red",            value: "red"    },
        { name: "🟢 Green",          value: "green"  },
        { name: "🟣 Purple",         value: "purple" },
        { name: "⚪ White",          value: "white"  },
        { name: "🟠 Orange",         value: "orange" },
      )
  )
  .addStringOption(opt =>
    opt.setName("image")
      .setDescription("Image URL to attach at the bottom of the embed (optional)")
      .setRequired(false)
  )
  .addBooleanOption(opt =>
    opt.setName("ping_everyone")
      .setDescription("Ping @everyone with the announcement (default: false)")
      .setRequired(false)
  );

const COLOR_MAP: Record<string, number> = {
  cyan:   0x00E5FF,
  gold:   0xFFD700,
  red:    0xFF4444,
  green:  0x00FF99,
  purple: 0x9B59B6,
  white:  0xFFFFFF,
  orange: 0xFF8C00,
};

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel     = interaction.options.getChannel("channel",      true) as TextChannel;
  const message     = interaction.options.getString("message",       true);
  const title       = interaction.options.getString("title")        ?? undefined;
  const colorKey    = interaction.options.getString("color")        ?? "cyan";
  const image       = interaction.options.getString("image")        ?? undefined;
  const pingAll     = interaction.options.getBoolean("ping_everyone") ?? false;

  if (channel.type !== ChannelType.GuildText) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Please select a text channel." });
    return;
  }

  // Validate image URL if provided
  if (image && !image.startsWith("http")) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Image must be a valid `https://` URL." });
    return;
  }

  const color = COLOR_MAP[colorKey] ?? 0x00E5FF;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(message)
    .setFooter({ text: `VERSUS TIERS  •  Announcement by ${interaction.user.username}` })
    .setTimestamp();

  if (title) embed.setTitle(title);
  if (image) embed.setImage(image);

  try {
    const content = pingAll ? "@everyone" : undefined;
    await channel.send({ content, embeds: [embed] });

    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0x00FF99)
          .setTitle("✅  Announcement Sent")
          .setDescription(`Successfully posted in <#${channel.id}>${pingAll ? " with @everyone ping" : ""}.`),
      ],
    });
  } catch {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Failed to Send")
          .setDescription("Make sure the bot has **Send Messages** permission in that channel."),
      ],
    });
  }
}
