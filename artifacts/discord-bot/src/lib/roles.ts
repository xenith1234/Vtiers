/**
 * Tester role IDs for VERSUS TIERS.
 *
 * ALL_TESTER_ROLE_IDS — any of these lets a user run /submittest.
 *
 * TESTER_ROLE_BY_GAMEMODE — which role gets pinged when a waitlist channel
 * is created for that gamemode.
 *
 * Role names confirmed from server (alphabetical order from screenshot):
 * AXE-TESTER, CRYSTAL-TESTER, MACE-TESTER, NPOT-TESTER,
 * POT-TESTER, SMP-TESTER, SWORD-TESTER, UHC-TESTER
 *
 * User-provided sequence (alphabetical): AXE→CRYSTAL→MACE→NPOT→POT→SMP→SWORD→UHC
 */

export const ROLE_AXE_TESTER     = "1520353719470784633";
export const ROLE_CRYSTAL_TESTER = "1520353631340073084";
export const ROLE_MACE_TESTER    = "1520353424439509072";
export const ROLE_NPOT_TESTER    = "1520385766914785350"; // NETHOP gamemode
export const ROLE_POT_TESTER     = "1520385947970043934";
export const ROLE_SMP_TESTER     = "1520385862989381712";
export const ROLE_SWORD_TESTER   = "1520353544245612674";
export const ROLE_UHC_TESTER     = "1520391204079145002";

export const ALL_TESTER_ROLE_IDS: string[] = [
  ROLE_AXE_TESTER,
  ROLE_CRYSTAL_TESTER,
  ROLE_MACE_TESTER,
  ROLE_NPOT_TESTER,
  ROLE_POT_TESTER,
  ROLE_SMP_TESTER,
  ROLE_SWORD_TESTER,
  ROLE_UHC_TESTER,
];

/** Per-gamemode tester role to ping in the waitlist channel. */
export const TESTER_ROLE_BY_GAMEMODE: Record<string, string> = {
  sword:   ROLE_SWORD_TESTER,
  axe:     ROLE_AXE_TESTER,
  nethop:  ROLE_NPOT_TESTER,
  uhc:     ROLE_UHC_TESTER,
  smp:     ROLE_SMP_TESTER,
  pot:     ROLE_POT_TESTER,
  mace:    ROLE_MACE_TESTER,
  crystal: ROLE_CRYSTAL_TESTER,
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
