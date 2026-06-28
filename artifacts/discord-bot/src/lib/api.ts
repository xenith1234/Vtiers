const API_BASE = process.env.API_BASE_URL ?? "http://localhost:80/api";
const BOT_SECRET = process.env.BOT_API_SECRET ?? "";

export interface PlayerProfile {
  id: number;
  minecraftUsername: string;
  overallTier: string;
  points: number;
  discord?: string | null;
  country?: string | null;
  countryCode?: string | null;
  avatarUrl: string;
  badges: { id: number; name: string; icon: string; color: string }[];
  rankings: {
    gamemodeId: number;
    gamemodeName: string;
    tier: string;
    points: number;
    matches: number;
    kills: number;
    deaths: number;
    kdr: number;
    winRate: number;
  }[];
}

export async function fetchProfile(username: string): Promise<PlayerProfile | null> {
  const res = await fetch(`${API_BASE}/profile/${encodeURIComponent(username)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as PlayerProfile;
}

export interface GamemodeInfo {
  id: number;
  name: string;
  icon: string | null;
  description: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  tier?: string;
  points: number;
  kills?: number;
  deaths?: number;
  matches?: number;
  winRate?: number;
  gamemode?: string;
  overallTier?: string;
}

export async function fetchGamemodes(): Promise<GamemodeInfo[]> {
  const res = await fetch(`${API_BASE}/gamemodes`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as GamemodeInfo[];
}

export async function fetchLeaderboard(gamemodeId?: number, limit = 10): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (gamemodeId !== undefined) params.set("gamemode", String(gamemodeId));
  const res = await fetch(`${API_BASE}/bot/leaderboard?${params}`, {
    headers: { "x-bot-secret": BOT_SECRET },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as LeaderboardEntry[];
}

export async function submitTest(data: {
  username: string;
  testerName: string;
  gamemode: string;
  rankBefore?: string;
  rankEarned: string;
}): Promise<{ success: boolean; player: { minecraftUsername: string; overallTier: string }; ranking: { gamemode: string; rankBefore: string | null; rankEarned: string } }> {
  const res = await fetch(`${API_BASE}/submit-test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bot-secret": BOT_SECRET,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((err as { error: string }).error || `API error ${res.status}`);
  }
  return (await res.json()) as Awaited<ReturnType<typeof submitTest>>;
}
