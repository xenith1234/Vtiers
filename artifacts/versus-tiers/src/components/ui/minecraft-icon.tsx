// PNG assets from attached_assets — imported via @assets alias
import swordPng      from "@assets/1520342400999100517_1782629335493.png"; // updated sword icon
import axePng        from "@assets/1367120254504800289_1782548948288.png";
import macePng       from "@assets/1427321953588478165_1782548948357.png";
import nethopPng     from "@assets/968366952689041449_1782548948429.png";
import smpPng        from "@assets/1474410723751760043_1782548948491.png";
import heartPng      from "@assets/1391587541764804659_1782548948556.png";
import crystalOrbPng  from "@assets/1408134915664384080_1782548948624.png";
import crystalHexPng  from "@assets/1292364143357067274_1782548948684.png";
import potionPng     from "@assets/1309420859332624404_1782548948741.png";

interface MinecraftIconProps {
  /** Gamemode name — used for built-in PNG fallback matching */
  name: string;
  /** Optional icon value from DB. If it's a data URL, http URL, or blob URL, it is
   *  rendered directly as <img src>. If it's an emoji it is rendered as text.
   *  If absent or falsy, name-based PNG matching is used. */
  icon?: string | null;
  size?: number;
  className?: string;
}

function isImageUrl(icon: string): boolean {
  return (
    icon.startsWith("data:") ||
    icon.startsWith("http") ||
    icon.startsWith("/") ||
    icon.startsWith("blob:")
  );
}

function getGamemodePng(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("overall") || n.includes("all"))                               return crystalOrbPng;
  if (n.includes("sword"))                                                        return swordPng;
  if (n.includes("axe"))                                                          return axePng;
  if (n.includes("mace"))                                                         return macePng;
  if (n.includes("neth") || n.includes("nethop") || n.includes("nethpot"))      return nethopPng;
  if (n.includes("smp") || n.includes("vanilla") || n.includes("debuff"))       return smpPng;
  if (n.includes("heart") || n.includes("life"))                                 return heartPng;
  if (n.includes("cryst") || n.includes("anchor") || n.includes("end"))         return crystalHexPng;
  if (n.includes("pot") || n.includes("alch") || n.includes("uhc") || n.includes("gap")) return potionPng;
  if (n.includes("bow") || n.includes("arch"))                                   return crystalOrbPng;
  if (n.includes("shield"))                                                       return smpPng;
  if (n.includes("bed") || n.includes("brig"))                                   return crystalHexPng;
  if (n.includes("spear"))                                                        return swordPng;
  return swordPng;
}

export function MinecraftIcon({ name, icon, size = 24, className = "" }: MinecraftIconProps) {
  // 1. If DB has an image URL / data URL → use it directly
  if (icon && isImageUrl(icon)) {
    return (
      <img
        src={icon}
        alt={name}
        width={size}
        height={size}
        className={className}
        style={{ imageRendering: "pixelated", objectFit: "contain" }}
      />
    );
  }

  // 2. If DB has an emoji → render as text
  if (icon && icon.trim().length > 0) {
    return (
      <span
        className={className}
        style={{ fontSize: size * 0.75, lineHeight: 1, display: "inline-flex", alignItems: "center" }}
      >
        {icon}
      </span>
    );
  }

  // 3. Fallback: name-based built-in PNG
  return (
    <img
      src={getGamemodePng(name)}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: "pixelated", objectFit: "contain" }}
    />
  );
}
