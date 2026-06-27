interface MinecraftIconProps {
  name: string;
  size?: number;
  className?: string;
}

// Each icon is an SVG path-based design matching Minecraft item aesthetics
// viewBox is 0 0 20 20

const ICON_SVGS: Record<string, (size: number) => JSX.Element> = {
  // Iron Sword — diagonal blade, brown handle
  sword: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      <rect x="12" y="1" width="3" height="3" fill="#c8c8c8" />
      <rect x="9"  y="4" width="3" height="3" fill="#d4d4d4" />
      <rect x="6"  y="7" width="3" height="3" fill="#c0c0c0" />
      <rect x="3"  y="10" width="3" height="3" fill="#c8c8c8" />
      {/* guard */}
      <rect x="5"  y="8"  width="2" height="2" fill="#888" />
      <rect x="8"  y="5"  width="2" height="2" fill="#999" />
      {/* handle */}
      <rect x="1"  y="13" width="2" height="2" fill="#8B5E3C" />
      <rect x="2"  y="15" width="2" height="2" fill="#7a5230" />
      <rect x="3"  y="17" width="2" height="2" fill="#6B4423" />
    </svg>
  ),
  // Iron Axe — blade + handle
  axe: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      <rect x="10" y="1" width="7" height="5" fill="#c0c0c0" />
      <rect x="8"  y="3" width="3" height="3" fill="#b0b0b0" />
      <rect x="10" y="6" width="4" height="2" fill="#aaa" />
      <rect x="11" y="1" width="2" height="2" fill="#ddd" />
      {/* handle */}
      <rect x="8"  y="7"  width="2" height="3" fill="#8B5E3C" />
      <rect x="7"  y="10" width="2" height="3" fill="#7a5230" />
      <rect x="5"  y="13" width="2" height="3" fill="#8B5E3C" />
      <rect x="4"  y="16" width="2" height="3" fill="#6B4423" />
    </svg>
  ),
  // Bow
  bow: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      <rect x="13" y="2"  width="2" height="2" fill="#8B5E3C" />
      <rect x="13" y="4"  width="2" height="2" fill="#7a5230" />
      <rect x="13" y="6"  width="2" height="3" fill="#8B5E3C" />
      <rect x="13" y="9"  width="2" height="3" fill="#7a5230" />
      <rect x="13" y="12" width="2" height="2" fill="#8B5E3C" />
      <rect x="13" y="14" width="2" height="2" fill="#7a5230" />
      {/* string */}
      <rect x="14" y="3"  width="1" height="1" fill="#ccc" />
      <rect x="15" y="5"  width="1" height="1" fill="#ccc" />
      <rect x="16" y="7"  width="1" height="3" fill="#ccc" />
      <rect x="15" y="11" width="1" height="1" fill="#ccc" />
      <rect x="14" y="13" width="1" height="1" fill="#ccc" />
      {/* arrow */}
      <rect x="3"  y="9"  width="10" height="2" fill="#c8a96e" />
      <rect x="2"  y="8"  width="2"  height="4" fill="#e55" />
      <rect x="13" y="9"  width="3"  height="2" fill="#ddd" />
    </svg>
  ),
  // Splash Potion — purple
  potion: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      {/* neck */}
      <rect x="7" y="1" width="6" height="2" fill="#8B5E3C" />
      <rect x="6" y="3" width="8" height="2" fill="#7a5230" />
      {/* body */}
      <rect x="4" y="5"  width="12" height="10" rx="4" fill="#7B2FE8" />
      <rect x="5" y="6"  width="10" height="8"  rx="3" fill="#9B3FFF" />
      <rect x="6" y="7"  width="4"  height="3"  fill="#CF8EFF" opacity="0.6" />
      {/* shine */}
      <rect x="6" y="7" width="2" height="2" fill="#fff" opacity="0.3" />
      {/* bottom */}
      <rect x="5" y="15" width="10" height="3" rx="2" fill="#7B2FE8" />
    </svg>
  ),
  // End Crystal — pink/magenta
  crystal: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      {/* top spike */}
      <rect x="9"  y="1" width="2" height="3" fill="#F0ABFC" />
      {/* upper body */}
      <rect x="7"  y="4" width="6" height="4" fill="#E879F9" />
      <rect x="5"  y="5" width="10" height="3" fill="#D946EF" />
      <rect x="8"  y="4" width="4"  height="2" fill="#F5D0FE" />
      {/* middle */}
      <rect x="4"  y="8"  width="12" height="4" fill="#C026D3" />
      <rect x="5"  y="8"  width="10" height="3" fill="#D946EF" />
      <rect x="7"  y="9"  width="6"  height="2" fill="#E879F9" />
      {/* lower */}
      <rect x="5"  y="12" width="10" height="3" fill="#A21CAF" />
      <rect x="6"  y="12" width="8"  height="2" fill="#C026D3" />
      {/* base */}
      <rect x="7"  y="15" width="6" height="3" fill="#86198F" />
      {/* glow */}
      <rect x="7"  y="6" width="2" height="2" fill="#fff" opacity="0.4" />
    </svg>
  ),
  // Shield — iron with cross emblem
  shield: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      <rect x="3"  y="2"  width="14" height="11" rx="2" fill="#2266CC" />
      <rect x="4"  y="3"  width="12" height="9"  rx="1" fill="#3377EE" />
      {/* cross */}
      <rect x="9"  y="4"  width="2" height="7" fill="#fff" />
      <rect x="6"  y="7"  width="8" height="2" fill="#fff" />
      {/* bottom point */}
      <rect x="5"  y="13" width="10" height="3" fill="#2266CC" />
      <rect x="7"  y="16" width="6"  height="2" fill="#1155BB" />
      <rect x="9"  y="18" width="2"  height="2" fill="#1155BB" />
    </svg>
  ),
  // Trident
  trident: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      {/* three prongs */}
      <rect x="4"  y="1" width="2" height="5" fill="#5EE7FF" />
      <rect x="9"  y="1" width="2" height="7" fill="#9FF5FF" />
      <rect x="14" y="1" width="2" height="5" fill="#5EE7FF" />
      {/* connecting bar */}
      <rect x="4"  y="5" width="12" height="2" fill="#5EE7FF" />
      {/* shaft */}
      <rect x="9" y="7"  width="2" height="12" fill="#9a9a9a" />
      <rect x="9" y="7"  width="1" height="12" fill="#b0b0b0" />
    </svg>
  ),
  // Trophy (Overall)
  overall: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      <rect x="4"  y="2"  width="12" height="8" rx="2" fill="#FFD700" />
      <rect x="5"  y="3"  width="10" height="6" rx="1" fill="#FFE55C" />
      {/* handles */}
      <rect x="1"  y="3"  width="3"  height="5" rx="1" fill="#D4A017" />
      <rect x="16" y="3"  width="3"  height="5" rx="1" fill="#D4A017" />
      {/* stem */}
      <rect x="8"  y="10" width="4" height="4" fill="#B8860B" />
      {/* base */}
      <rect x="5"  y="14" width="10" height="3" rx="1" fill="#D4A017" />
      <rect x="4"  y="17" width="12" height="2" fill="#B8860B" />
      {/* shine */}
      <rect x="6" y="4" width="3" height="2" fill="#fff" opacity="0.4" />
    </svg>
  ),
  // Diamond sword (for nethpot/nether)
  nethpot: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      <rect x="12" y="1" width="3" height="3" fill="#55FFFF" />
      <rect x="9"  y="4" width="3" height="3" fill="#66FFFF" />
      <rect x="6"  y="7" width="3" height="3" fill="#55FFFF" />
      <rect x="3"  y="10" width="3" height="3" fill="#44EEFF" />
      {/* guard */}
      <rect x="5"  y="8"  width="2" height="2" fill="#44AACC" />
      <rect x="8"  y="5"  width="2" height="2" fill="#55BBDD" />
      {/* handle - dark */}
      <rect x="1"  y="13" width="2" height="2" fill="#333" />
      <rect x="2"  y="15" width="2" height="2" fill="#222" />
      <rect x="3"  y="17" width="2" height="2" fill="#111" />
    </svg>
  ),
  // Netherite Sword
  nethsword: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      <rect x="12" y="1" width="3" height="3" fill="#6B5B73" />
      <rect x="9"  y="4" width="3" height="3" fill="#7D6B85" />
      <rect x="6"  y="7" width="3" height="3" fill="#6B5B73" />
      <rect x="3"  y="10" width="3" height="3" fill="#5C4D64" />
      <rect x="5"  y="8"  width="2" height="2" fill="#443344" />
      <rect x="8"  y="5"  width="2" height="2" fill="#554455" />
      <rect x="1"  y="13" width="2" height="2" fill="#8B5E3C" />
      <rect x="2"  y="15" width="2" height="2" fill="#7a5230" />
      <rect x="3"  y="17" width="2" height="2" fill="#6B4423" />
    </svg>
  ),
  // Mace — heavy club
  mace: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      {/* head */}
      <rect x="5"  y="1" width="10" height="9" rx="2" fill="#888" />
      <rect x="6"  y="2" width="8"  height="7" rx="1" fill="#aaa" />
      {/* spikes */}
      <rect x="4"  y="3" width="2" height="2" fill="#999" />
      <rect x="14" y="3" width="2" height="2" fill="#999" />
      <rect x="4"  y="7" width="2" height="2" fill="#999" />
      <rect x="14" y="7" width="2" height="2" fill="#999" />
      <rect x="8"  y="0" width="4" height="2" fill="#999" />
      {/* handle */}
      <rect x="9" y="10" width="2" height="9" fill="#8B5E3C" />
      <rect x="9" y="10" width="1" height="9" fill="#a06840" />
      {/* pommel */}
      <rect x="8" y="18" width="4" height="2" fill="#666" />
    </svg>
  ),
  // Heart (SMP / Life)
  heart: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      <rect x="2"  y="4"  width="4" height="4" fill="#EF4444" />
      <rect x="6"  y="2"  width="4" height="4" fill="#EF4444" />
      <rect x="10" y="2"  width="4" height="4" fill="#EF4444" />
      <rect x="14" y="4"  width="4" height="4" fill="#EF4444" />
      <rect x="2"  y="8"  width="16" height="4" fill="#EF4444" />
      <rect x="4"  y="12" width="12" height="4" fill="#EF4444" />
      <rect x="6"  y="16" width="8"  height="2" fill="#DC2626" />
      <rect x="8"  y="18" width="4"  height="2" fill="#B91C1C" />
      {/* shine */}
      <rect x="4" y="5" width="3" height="2" fill="#FCA5A5" />
      <rect x="10" y="3" width="2" height="2" fill="#FCA5A5" />
    </svg>
  ),
  // SMP / Pickaxe
  smp: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      {/* pick head */}
      <rect x="3"  y="3"  width="12" height="5" rx="1" fill="#5EE7FF" />
      <rect x="4"  y="4"  width="10" height="3" fill="#9FF5FF" />
      <rect x="13" y="2"  width="4"  height="3" fill="#5EE7FF" />
      {/* handle */}
      <rect x="6"  y="8"  width="2" height="3" fill="#8B5E3C" />
      <rect x="5"  y="11" width="2" height="3" fill="#7a5230" />
      <rect x="4"  y="14" width="2" height="3" fill="#8B5E3C" />
      <rect x="3"  y="17" width="2" height="2" fill="#6B4423" />
    </svg>
  ),
  // Bedfight — bed icon
  bedfight: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      {/* pillow */}
      <rect x="2"  y="5"  width="7"  height="6" rx="1" fill="#eee" />
      <rect x="3"  y="6"  width="5"  height="4" fill="#fff" />
      {/* blanket */}
      <rect x="9"  y="5"  width="9"  height="6" rx="1" fill="#3377EE" />
      <rect x="10" y="6"  width="7"  height="4" fill="#4488FF" />
      {/* bed frame */}
      <rect x="1"  y="11" width="18" height="4" rx="1" fill="#8B5E3C" />
      <rect x="1"  y="4"  width="3"  height="7" rx="1" fill="#7a5230" />
      <rect x="16" y="4"  width="3"  height="7" rx="1" fill="#7a5230" />
      {/* feet */}
      <rect x="1"  y="15" width="3" height="3" fill="#6B4423" />
      <rect x="16" y="15" width="3" height="3" fill="#6B4423" />
    </svg>
  ),
  // UHC — golden apple
  uhc: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      {/* stem/leaf */}
      <rect x="9"  y="1" width="2" height="3" fill="#228B22" />
      <rect x="11" y="2" width="3" height="2" fill="#32CD32" />
      {/* apple body */}
      <rect x="3"  y="4"  width="14" height="12" rx="4" fill="#EF4444" />
      <rect x="4"  y="5"  width="12" height="10" rx="3" fill="#F87171" />
      {/* golden shimmer */}
      <rect x="3"  y="4"  width="14" height="3" rx="2" fill="#FFD700" opacity="0.5" />
      <rect x="4"  y="5"  width="5"  height="3" fill="#fff" opacity="0.3" />
      {/* bottom */}
      <rect x="5"  y="16" width="10" height="2" rx="1" fill="#DC2626" />
    </svg>
  ),
  // Default — diamond
  default: (s) => (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      <rect x="7"  y="2"  width="6" height="2" fill="#5EE7FF" />
      <rect x="4"  y="4"  width="12" height="4" fill="#5EE7FF" />
      <rect x="3"  y="4"  width="2"  height="2" fill="#9FF5FF" />
      <rect x="5"  y="4"  width="10" height="4" fill="#9FF5FF" />
      <rect x="5"  y="8"  width="10" height="5" fill="#5EE7FF" />
      <rect x="6"  y="13" width="8"  height="3" fill="#5EE7FF" />
      <rect x="8"  y="16" width="4"  height="3" fill="#44D4FF" />
      <rect x="9"  y="19" width="2"  height="1" fill="#33C3FF" />
      <rect x="6"  y="5"  width="3"  height="2" fill="#fff" opacity="0.4" />
    </svg>
  ),
};

export function getGamemodeIconName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("overall") || n.includes("all")) return "overall";
  if (n.includes("neth") && (n.includes("pot") || n.includes("pvp"))) return "nethpot";
  if (n.includes("neth") && n.includes("sword")) return "nethsword";
  if (n.includes("neth")) return "nethpot";
  if (n.includes("mace")) return "mace";
  if (n.includes("sword") || n.includes("dia sword")) return "sword";
  if (n.includes("axe")) return "axe";
  if (n.includes("bow") || n.includes("arch")) return "bow";
  if (n.includes("pot") || n.includes("alch") || n.includes("splash")) return "potion";
  if (n.includes("cryst") || n.includes("anchor") || n.includes("end")) return "crystal";
  if (n.includes("shield") || n.includes("shielding")) return "shield";
  if (n.includes("trid")) return "trident";
  if (n.includes("bed") || n.includes("brig")) return "bedfight";
  if (n.includes("uhc") || n.includes("gap") || n.includes("golden")) return "uhc";
  if (n.includes("heart") || n.includes("life")) return "heart";
  if (n.includes("smp") || n.includes("pick") || n.includes("mine")) return "smp";
  return "default";
}

export function MinecraftIcon({ name, size = 24, className = "" }: MinecraftIconProps) {
  const iconName = getGamemodeIconName(name);
  const renderFn = ICON_SVGS[iconName] ?? ICON_SVGS.default;
  return <span className={className}>{renderFn(size)}</span>;
}
