import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);
const DATA_DIR = join(__dir, "../../data");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function readJson<T>(file: string): T {
  const p = join(DATA_DIR, file);
  if (!existsSync(p)) return {} as T;
  return JSON.parse(readFileSync(p, "utf-8")) as T;
}

function writeJson(file: string, data: unknown) {
  writeFileSync(join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ── Verified profiles ──────────────────────────────────────────────────────────
export interface VerifiedProfile {
  minecraftUsername: string;
  region: string;
  accountType: string;
  verifiedAt: string;
}

export function getVerified(userId: string): VerifiedProfile | null {
  const data = readJson<Record<string, VerifiedProfile>>("verified.json");
  return data[userId] ?? null;
}

export function setVerified(userId: string, profile: VerifiedProfile) {
  const data = readJson<Record<string, VerifiedProfile>>("verified.json");
  data[userId] = profile;
  writeJson("verified.json", data);
}

// ── Waitlist ───────────────────────────────────────────────────────────────────
export interface WaitlistEntry {
  userId: string;
  minecraftUsername: string;
  gamemode: string;
  addedAt: string;
  lastTestedAt?: string;
}

export function getWaitlist(): Record<string, WaitlistEntry[]> {
  return readJson<Record<string, WaitlistEntry[]>>("waitlist.json");
}

export function addToWaitlist(entry: WaitlistEntry) {
  const data = getWaitlist();
  if (!data[entry.gamemode]) data[entry.gamemode] = [];
  // Remove existing entry for this user+gamemode
  data[entry.gamemode] = data[entry.gamemode].filter(e => e.userId !== entry.userId);
  data[entry.gamemode].push(entry);
  writeJson("waitlist.json", data);
}

export function removeFromWaitlist(userId: string, gamemode: string) {
  const data = getWaitlist();
  if (data[gamemode]) {
    data[gamemode] = data[gamemode].filter(e => e.userId !== userId);
  }
  writeJson("waitlist.json", data);
}

export function getCooldownEntry(userId: string, gamemode: string): WaitlistEntry | null {
  const data = getWaitlist();
  const list = data[gamemode] ?? [];
  return list.find(e => e.userId === userId) ?? null;
}

export function isOnCooldown(userId: string, gamemode: string): boolean {
  const entry = getCooldownEntry(userId, gamemode);
  if (!entry?.lastTestedAt) return false;
  const elapsed = Date.now() - new Date(entry.lastTestedAt).getTime();
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  return elapsed < FIVE_DAYS_MS;
}

export function getCooldownRemaining(userId: string, gamemode: string): string {
  const entry = getCooldownEntry(userId, gamemode);
  if (!entry?.lastTestedAt) return "0";
  const elapsed = Date.now() - new Date(entry.lastTestedAt).getTime();
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  const remaining = FIVE_DAYS_MS - elapsed;
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return `${days}d ${hours}h`;
}
