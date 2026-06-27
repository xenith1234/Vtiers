import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type StringSelectMenuInteraction,
  type ModalSubmitInteraction,
  type TextChannel,
} from "discord.js";
import { getVerified, setVerified, addToWaitlist, isOnCooldown, getCooldownRemaining } from "../lib/storage.js";
import { TESTER_ROLE_BY_GAMEMODE, ALL_TESTER_ROLE_IDS } from "../lib/roles.js";

export const CYAN = 0x00D2FF;

const EMOJIS = {
  sword:   "<:sword:1520342400999100517>",
  spear:   "<:spear:1520344085003632660>",
  pot:     "<:pot:1520343997644537967>",
  nethop:  "<:nethop:1520343325062860810>",
  mace:    "<:mace:1520342845440004178>",
  crystal: "<:crystal:1520343811820359821>",
  uhc:     "<:UHC:1520343474287808644>",
  smp:     "<:SMP:1520343559771918376>",
  axe:     "<:Axe:1520342453671170159>",
};

export const GAMEMODES = [
  { id: "sword",   label: "SWORD",   emoji: EMOJIS.sword },
  { id: "axe",     label: "AXE",     emoji: EMOJIS.axe },
  { id: "nethop",  label: "NETHOP",  emoji: EMOJIS.nethop },
  { id: "uhc",     label: "UHC",     emoji: EMOJIS.uhc },
  { id: "smp",     label: "SMP",     emoji: EMOJIS.smp },
  { id: "pot",     label: "POT",     emoji: EMOJIS.pot },
  { id: "mace",    label: "MACE",    emoji: EMOJIS.mace },
  { id: "crystal", label: "CRYSTAL", emoji: EMOJIS.crystal },
];

export const data = new SlashCommandBuilder()
  .setName("panel")
  .setDescription("Post the VERSUS TIERS testing panel (admin only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setColor(CYAN)
    .setTitle("🎮  VERSUS TIERS  |  Testing Panel")
    .setDescription(
      "Welcome to **VERSUS TIERS** — the official Minecraft PvP ranking system.\n\n" +
      "**How to get tested:**\n" +
      "> **Step 1** — Click **Verify Profile** and enter your Minecraft username, region, and account type.\n" +
      "> **Step 2** — Click the gamemode button you want to be tested in to join the waitlist.\n" +
      "> **Step 3** — A private channel will be created for you and a tester will reach out there.\n\n" +
      "⏰  **5-day cooldown** applies per gamemode after each test.\n" +
      "⚠️  Make sure your profile is verified before joining any waitlist."
    )
    .setFooter({ text: "VERSUS TIERS  •  Compete. Rank. Dominate." })
    .setTimestamp();
}

function buildPanelRows() {
  const verifyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("verify_profile")
      .setLabel("Verify Profile")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("✅"),
  );

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("gm_sword").setLabel("SWORD").setStyle(ButtonStyle.Secondary).setEmoji({ id: "1520342400999100517", name: "sword" }),
    new ButtonBuilder().setCustomId("gm_axe").setLabel("AXE").setStyle(ButtonStyle.Secondary).setEmoji({ id: "1520342453671170159", name: "Axe" }),
    new ButtonBuilder().setCustomId("gm_nethop").setLabel("NETHOP").setStyle(ButtonStyle.Secondary).setEmoji({ id: "1520343325062860810", name: "nethop" }),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("gm_uhc").setLabel("UHC").setStyle(ButtonStyle.Secondary).setEmoji({ id: "1520343474287808644", name: "UHC" }),
    new ButtonBuilder().setCustomId("gm_smp").setLabel("SMP").setStyle(ButtonStyle.Secondary).setEmoji({ id: "1520343559771918376", name: "SMP" }),
    new ButtonBuilder().setCustomId("gm_pot").setLabel("POT").setStyle(ButtonStyle.Secondary).setEmoji({ id: "1520343997644537967", name: "pot" }),
    new ButtonBuilder().setCustomId("gm_mace").setLabel("MACE").setStyle(ButtonStyle.Secondary).setEmoji({ id: "1520342845440004178", name: "mace" }),
  );

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("gm_crystal").setLabel("CRYSTAL").setStyle(ButtonStyle.Secondary).setEmoji({ id: "1520343811820359821", name: "crystal" }),
  );

  return [verifyRow, row1, row2, row3];
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = buildPanelEmbed();
  const rows = buildPanelRows();
  await interaction.reply({ content: "✅ Panel posted!", flags: MessageFlags.Ephemeral });
  const ch = interaction.channel;
  if (ch && ch.isTextBased() && !ch.isThread() && "send" in ch) {
    await (ch as { send: (opts: unknown) => Promise<unknown> }).send({ embeds: [embed], components: rows });
  }
}

// ── Verify button → open modal ────────────────────────────────────────────────
export async function handleVerifyButton(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("verify_username_modal")
    .setTitle("Verify Your Minecraft Profile");

  const usernameInput = new TextInputBuilder()
    .setCustomId("minecraft_username")
    .setLabel("Minecraft Username")
    .setPlaceholder("e.g. Notch")
    .setStyle(TextInputStyle.Short)
    .setMinLength(2)
    .setMaxLength(24)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput));
  await interaction.showModal(modal);
}

// ── Modal submit → region select ──────────────────────────────────────────────
export async function handleVerifyModal(interaction: ModalSubmitInteraction) {
  const username = interaction.fields.getTextInputValue("minecraft_username").trim();

  const regionSelect = new StringSelectMenuBuilder()
    .setCustomId(`verify_region:${username}`)
    .setPlaceholder("Select your region…")
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel("🌎  North America (NA)").setValue("NA"),
      new StringSelectMenuOptionBuilder().setLabel("🌍  Europe (EU)").setValue("EU"),
      new StringSelectMenuOptionBuilder().setLabel("🌏  Asia (AS)").setValue("AS"),
      new StringSelectMenuOptionBuilder().setLabel("🌎  South America (SA)").setValue("SA"),
      new StringSelectMenuOptionBuilder().setLabel("🌏  Oceania (OCE)").setValue("OCE"),
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(regionSelect);

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    embeds: [
      new EmbedBuilder()
        .setColor(CYAN)
        .setTitle("Step 1 of 2 — Select Your Region")
        .setDescription(`**Username:** \`${username}\`\n\nWhich region are you in?`),
    ],
    components: [row],
  });
}

// ── Region select → account type select ───────────────────────────────────────
export async function handleRegionSelect(interaction: StringSelectMenuInteraction) {
  const [, username] = interaction.customId.split(":");
  const region = interaction.values[0];

  const accountSelect = new StringSelectMenuBuilder()
    .setCustomId(`verify_account:${username}:${region}`)
    .setPlaceholder("Select your account type…")
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel("☕  Java Edition").setValue("Java"),
      new StringSelectMenuOptionBuilder().setLabel("🪨  Bedrock Edition").setValue("Bedrock"),
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(accountSelect);

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(CYAN)
        .setTitle("Step 2 of 2 — Select Account Type")
        .setDescription(`**Username:** \`${username}\`\n**Region:** ${region}\n\nJava or Bedrock?`),
    ],
    components: [row],
  });
}

// ── Account type select → profile confirmed ───────────────────────────────────
export async function handleAccountSelect(interaction: StringSelectMenuInteraction) {
  const [, username, region] = interaction.customId.split(":");
  const accountType = interaction.values[0];
  const userId = interaction.user.id;

  setVerified(userId, {
    minecraftUsername: username,
    region,
    accountType,
    verifiedAt: new Date().toISOString(),
  });

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(0x00FF99)
        .setTitle("✅  Profile Verified!")
        .setDescription(
          `Your profile has been verified and saved.\n\n` +
          `👤 **Username:** \`${username}\`\n` +
          `🌐 **Region:** ${region}\n` +
          `🎮 **Account:** ${accountType} Edition\n\n` +
          `You can now click a **gamemode button** in the panel to join a testing waitlist.`
        )
        .setThumbnail(`https://mc-heads.net/avatar/${username}/64`)
        .setFooter({ text: "VERSUS TIERS  •  Compete. Rank. Dominate." }),
    ],
    components: [],
  });
}

// ── Gamemode button → create private waitlist channel ─────────────────────────
export async function handleGamemodeButton(interaction: ButtonInteraction, gamemode: string) {
  const userId = interaction.user.id;
  const profile = getVerified(userId);

  if (!profile) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Not Verified")
          .setDescription("You must **verify your profile** first before joining a waitlist.\nClick the **Verify Profile** button above."),
      ],
    });
    return;
  }

  if (isOnCooldown(userId, gamemode)) {
    const remaining = getCooldownRemaining(userId, gamemode);
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF9900)
          .setTitle("⏰  Cooldown Active")
          .setDescription(
            `You already have an active **${gamemode.toUpperCase()}** cooldown.\n\n` +
            `⏳ Time remaining: **${remaining}**\n\n` +
            `Cooldowns last **5 days** after each test.`
          ),
      ],
    });
    return;
  }

  addToWaitlist({
    userId,
    minecraftUsername: profile.minecraftUsername,
    gamemode,
    addedAt: new Date().toISOString(),
  });

  const gmLabel = GAMEMODES.find(g => g.id === gamemode)?.label ?? gamemode.toUpperCase();

  // ── Create private waitlist channel ─────────────────────────────────────────
  const guild = interaction.guild;
  if (!guild) {
    // Fallback: no guild context (shouldn't happen in normal use)
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(CYAN)
          .setTitle("✅  Added to Waitlist!")
          .setDescription(
            `You've been added to the **${gmLabel}** waitlist!\n` +
            `⏰ A tester will contact you soon.`
          ),
      ],
    });
    return;
  }

  // Build safe channel name: lowercase, spaces → hyphens, strip special chars
  const safeName = profile.minecraftUsername.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const channelName = `${safeName}-${gamemode}-waitlist`;

  // Figure out which tester role to ping
  const specificRoleId = TESTER_ROLE_BY_GAMEMODE[gamemode];
  const roleMention = specificRoleId
    ? `<@&${specificRoleId}>`
    : ALL_TESTER_ROLE_IDS.map(id => `<@&${id}>`).join(" ");

  try {
    // Build permission overwrites: hidden from everyone, visible to applicant + relevant testers
    const testerRoleIds = specificRoleId ? [specificRoleId] : ALL_TESTER_ROLE_IDS;
    const permissionOverwrites: {
      id: string;
      allow?: bigint[];
      deny?: bigint[];
    }[] = [
      // Hidden from @everyone by default
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      // The applicant can see and chat
      {
        id: userId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      // The tester role(s) for this gamemode can see and respond
      ...testerRoleIds.map(roleId => ({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ],
      })),
    ];

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      topic: `Waitlist channel for ${profile.minecraftUsername} — ${gmLabel} test`,
      permissionOverwrites,
    }) as TextChannel;

    // Post the waitlist entry + ping testers in the new channel
    await channel.send({
      content: roleMention,
      embeds: [
        new EmbedBuilder()
          .setColor(CYAN)
          .setTitle(`🎮  ${gmLabel} Waitlist Request`)
          .setDescription(
            `${interaction.user.toString()} is ready to be tested in **${gmLabel}**!\n\n` +
            `👤 **Minecraft:** \`${profile.minecraftUsername}\`\n` +
            `🌐 **Region:** ${profile.region}\n` +
            `🎮 **Account:** ${profile.accountType} Edition\n\n` +
            `A tester will reach out here soon. Keep an eye on this channel!`
          )
          .setThumbnail(`https://mc-heads.net/avatar/${profile.minecraftUsername}/64`)
          .setFooter({ text: "VERSUS TIERS  •  This channel is only visible to you." })
          .setTimestamp(),
      ],
    });

    // Confirm to the user with a link to their channel
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(CYAN)
          .setTitle("✅  Waitlist Channel Created!")
          .setDescription(
            `You've been added to the **${gmLabel}** waitlist!\n\n` +
            `📢 Your private channel: ${channel.toString()}\n` +
            `⏰ A tester has been notified and will contact you there.\n\n` +
            `👤 Playing as: \`${profile.minecraftUsername}\` (${profile.accountType}, ${profile.region})\n\n` +
            `*5-day cooldown applies after your test.*`
          )
          .setThumbnail(`https://mc-heads.net/avatar/${profile.minecraftUsername}/64`),
      ],
    });
  } catch (err: unknown) {
    console.error("Failed to create waitlist channel:", err);

    // Fallback: still acknowledge the waitlist join even if channel creation failed
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF9900)
          .setTitle("⚠️  Added to Waitlist (Channel Error)")
          .setDescription(
            `You've been added to the **${gmLabel}** waitlist, but the private channel could not be created automatically.\n\n` +
            `Please make sure the bot has the **Manage Channels** permission in this server.\n\n` +
            `👤 Playing as: \`${profile.minecraftUsername}\` (${profile.accountType}, ${profile.region})`
          ),
      ],
    });
  }
}
