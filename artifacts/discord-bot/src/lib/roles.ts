/**
 * Tester role IDs for VERSUS TIERS.
 *
 * ALL_TESTER_ROLE_IDS — any of these lets a user run /submittest.
 *
 * TESTER_ROLE_BY_GAMEMODE — which role gets pinged when a waitlist channel
 * is created for that gamemode. 8 gamemodes, 7 explicit roles below.
 * Adjust the mapping here if the order doesn't match your server roles.
 */

export const ALL_TESTER_ROLE_IDS: string[] = [
  "1520353719470784633", // Tester role 1
  "1520353631340073084", // Tester role 2
  "1520353424439509072", // Tester role 3
  "1520385766914785350", // Tester role 4
  "1520385947970043934", // Tester role 5
  "1520385862989381712", // Tester role 6
  "1520353544245612674", // Tester role 7
];

/** Per-gamemode tester role to ping in the waitlist channel. */
export const TESTER_ROLE_BY_GAMEMODE: Record<string, string | null> = {
  sword:   "1520353719470784633",
  axe:     "1520353631340073084",
  nethop:  "1520353424439509072",
  uhc:     "1520385766914785350",
  smp:     "1520385947970043934",
  pot:     "1520385862989381712",
  mace:    "1520353544245612674",
  crystal: null, // no dedicated role → pings all tester roles
};

/** Returns true if the member (from an interaction) holds at least one tester role. */
export function memberHasTesterRole(member: { roles: unknown } | null | undefined): boolean {
  if (!member) return false;
  const roles = member.roles;

  // APIInteractionGuildMember: roles is string[]
  if (Array.isArray(roles)) {
    return ALL_TESTER_ROLE_IDS.some(id => (roles as string[]).includes(id));
  }

  // GuildMember: roles is GuildMemberRoleManager with .cache Map
  if (roles && typeof roles === "object" && "cache" in roles) {
    const cache = (roles as { cache: { has(id: string): boolean } }).cache;
    return ALL_TESTER_ROLE_IDS.some(id => cache.has(id));
  }

  return false;
}
