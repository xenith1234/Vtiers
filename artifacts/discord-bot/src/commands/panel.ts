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
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type StringSelectMenuInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import { getVerified, setVerified, addToWaitlist, isOnCooldown, getCooldownRemaining } from "../lib/storage.js";

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
      "> **Step 3** — Wait for a tester to ping you. Keep your **DMs open**!\n\n" +
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
  await interaction.reply({ content: "✅ Panel posted!", ephemeral: true });
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
    ephemeral: true,
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

// ── Gamemode button → waitlist ────────────────────────────────────────────────
export async function handleGamemodeButton(interaction: ButtonInteraction, gamemode: string) {
  const userId = interaction.user.id;
  const profile = getVerified(userId);

  if (!profile) {
    await interaction.reply({
      ephemeral: true,
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
      ephemeral: true,
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

  await interaction.reply({
    ephemeral: true,
    embeds: [
      new EmbedBuilder()
        .setColor(CYAN)
        .setTitle("✅  Added to Waitlist!")
        .setDescription(
          `**${interaction.user.toString()}** has been added to the **${gmLabel}** waitlist!\n\n` +
          `⏰ A tester will ping you soon.\n` +
          `📬 Make sure your **DMs are open**.\n\n` +
          `👤 Playing as: \`${profile.minecraftUsername}\` (${profile.accountType}, ${profile.region})`
        )
        .setFooter({ text: "5-day cooldown applies after your test." }),
    ],
  });
}
