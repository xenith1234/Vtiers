import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { fetchProfile, type PlayerProfile } from "../lib/api.js";
import { CYAN } from "./panel.js";

const TIER_COLORS: Record<string, number> = {
  HT1: 0xFFD700, HT2: 0xFFA500, HT3: 0x00D2FF, HT4: 0x00BFFF, HT5: 0x00FFEE,
  LT1: 0x9B59B6, LT2: 0x7D3C98, LT3: 0x3498DB, LT4: 0x888888, LT5: 0x666666,
  UR: 0x444444,
};

const GAMEMODE_EMOJIS: Record<string, string> = {
  sword:   "<:sword:1520342400999100517>",
  axe:     "<:Axe:1520342453671170159>",
  nethop:  "<:nethop:1520343325062860810>",
  nethpot: "<:nethop:1520343325062860810>",
  pot:     "<:pot:1520343997644537967>",
  mace:    "<:mace:1520342845440004178>",
  crystal: "<:crystal:1520343811820359821>",
  uhc:     "<:UHC:1520343474287808644>",
  smp:     "<:SMP:1520343559771918376>",
  spear:   "<:spear:1520344085003632660>",
};

function getGamemodeEmoji(name: string): string {
  const n = name.toLowerCase();
  for (const [key, emoji] of Object.entries(GAMEMODE_EMOJIS)) {
    if (n.includes(key)) return emoji;
  }
  return "🎮";
}

function buildProfileEmbed(profile: PlayerProfile): EmbedBuilder {
  const color = TIER_COLORS[profile.overallTier] ?? CYAN;

  // Build gamemode grid (3 per row max)
  let tiersGrid = "";
  if (profile.rankings.length > 0) {
    const sorted = [...profile.rankings].sort((a, b) => {
      const ORDER: Record<string, number> = { HT1:11,HT2:10,HT3:9,HT4:8,HT5:7,LT1:6,LT2:5,LT3:4,LT4:3,LT5:2,UR:1 };
      return (ORDER[b.tier] ?? 0) - (ORDER[a.tier] ?? 0);
    });
    tiersGrid = sorted.map(r =>
      `${getGamemodeEmoji(r.gamemodeName)} **${r.gamemodeName}** — \`${r.tier}\``
    ).join("\n");
  } else {
    tiersGrid = "*No gamemode rankings yet.*";
  }

  const badgeStr = profile.badges.length > 0
    ? profile.badges.map(b => `${b.icon ?? ""} **${b.name}**`).join("  ")
    : "*No badges*";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${profile.minecraftUsername}'s Profile`)
    .setThumbnail(profile.avatarUrl)
    .addFields(
      { name: "🏅  Overall Tier",   value: `**${profile.overallTier}**`,                           inline: true },
      { name: "⭐  Points",         value: profile.points.toLocaleString(),                         inline: true },
      { name: "🌐  Region",         value: profile.country ?? "*Unknown*",                          inline: true },
      { name: "🎖️  Badges",         value: badgeStr,                                               inline: false },
      { name: `🎮  Gamemode Tiers (${profile.rankings.length})`, value: tiersGrid || "*None*",     inline: false },
    )
    .setFooter({ text: "VERSUS TIERS  •  Compete. Rank. Dominate." })
    .setTimestamp();

  if (profile.discord) {
    embed.setDescription(`Discord: **${profile.discord}**`);
  }

  return embed;
}

export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("View a player's VERSUS TIERS profile and tier rankings")
  .addStringOption(opt =>
    opt.setName("username")
      .setDescription("Minecraft username to look up")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const username = interaction.options.getString("username", true);
  await interaction.deferReply();

  try {
    const profile = await fetchProfile(username);
    if (!profile) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF4444)
            .setTitle("❌  Player Not Found")
            .setDescription(`No ranked player found for \`${username}\`.\nMake sure the username is spelled correctly.`),
        ],
      });
      return;
    }

    const embed = buildProfileEmbed(profile);
    await interaction.editReply({ embeds: [embed] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle("❌  Error")
          .setDescription(`\`\`\`${message}\`\`\``),
      ],
    });
  }
}
