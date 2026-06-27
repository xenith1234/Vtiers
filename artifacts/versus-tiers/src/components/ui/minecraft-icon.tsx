// PNG assets from attached_assets — imported via @assets alias
import swordPng     from "@assets/1449489848993054931_1782548948801.png";
import axePng       from "@assets/1367120254504800289_1782548948288.png";
import macePng      from "@assets/1427321953588478165_1782548948357.png";
import nethopPng    from "@assets/968366952689041449_1782548948429.png";
import smpPng       from "@assets/1474410723751760043_1782548948491.png";
import heartPng     from "@assets/1391587541764804659_1782548948556.png";
import crystalOrbPng from "@assets/1408134915664384080_1782548948624.png";
import crystalHexPng from "@assets/1292364143357067274_1782548948684.png";
import potionPng    from "@assets/1309420859332624404_1782548948741.png";

interface MinecraftIconProps {
  name: string;
  size?: number;
  className?: string;
}

function getGamemodePng(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("overall") || n.includes("all")) return crystalOrbPng;
  if (n.includes("sword") || n.includes("spear")) return swordPng;
  if (n.includes("axe")) return axePng;
  if (n.includes("mace")) return macePng;
  if (n.includes("neth") || n.includes("nethop") || n.includes("nethpot")) return nethopPng;
  if (n.includes("smp") || n.includes("vanilla") || n.includes("debuff")) return smpPng;
  if (n.includes("heart") || n.includes("life")) return heartPng;
  if (n.includes("cryst") || n.includes("anchor") || n.includes("end")) return crystalHexPng;
  if (n.includes("pot") || n.includes("alch") || n.includes("splash") || n.includes("uhc") || n.includes("gap")) return potionPng;
  if (n.includes("bow") || n.includes("arch") || n.includes("trid")) return crystalOrbPng;
  if (n.includes("shield") || n.includes("shielding")) return smpPng;
  if (n.includes("bed") || n.includes("brig")) return crystalHexPng;
  return swordPng;
}

export function getGamemodeIconName(name: string): string {
  return name.toLowerCase();
}

export function MinecraftIcon({ name, size = 24, className = "" }: MinecraftIconProps) {
  const src = getGamemodePng(name);
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: "pixelated", objectFit: "contain" }}
    />
  );
}
