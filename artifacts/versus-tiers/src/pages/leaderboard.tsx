import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Trophy } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CloudBackground } from "@/components/clouds";
import { PlayerCard } from "@/components/player-card";
import { TierBadge } from "@/components/tier-badge";
import { MinecraftIcon } from "@/components/ui/minecraft-icon";
import { useListGamemodes, useListRankings, getListRankingsQueryKey } from "@workspace/api-client-react";

const TIERS = ["", "HT1", "HT2", "HT3", "HT4", "HT5", "LT1", "LT2", "LT3", "LT4", "LT5", "UR"];
const SORT_OPTIONS = [
  { value: "points", label: "Points" },
  { value: "winRate", label: "Win Rate" },
  { value: "kills", label: "Kills" },
  { value: "matches", label: "Matches" },
  { value: "recent", label: "Recent" },
];

export default function LeaderboardPage() {
  const [search] = useLocation();
  const urlParams = new URLSearchParams(search.split("?")[1] || "");
  const [selectedGamemodeId, setSelectedGamemodeId] = useState<number | undefined>(
    urlParams.get("gamemode") ? parseInt(urlParams.get("gamemode")!) : undefined
  );
  const [selectedTier, setSelectedTier] = useState("");
  const [sortBy, setSortBy] = useState("points");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data: gamemodes } = useListGamemodes();
  const { data: rankingsData, isLoading } = useListRankings(
    {
      params: {
        gamemodeId: selectedGamemodeId,
        tier: selectedTier || undefined,
        sortBy: sortBy as any,
        page,
        limit: LIMIT,
      }
    },
    {
      query: { queryKey: getListRankingsQueryKey({ gamemodeId: selectedGamemodeId, tier: selectedTier || undefined, sortBy: sortBy as any, page, limit: LIMIT }) }
    }
  );

  const totalPages = Math.ceil((rankingsData?.total || 0) / LIMIT);

  return (
    <div className="min-h-screen bg-black text-white relative">
      <CloudBackground />
      <Navbar />

      <main className="relative z-10 pt-24 pb-20 max-w-6xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black text-white mb-2">Leaderboards</h1>
          <p className="text-gray-500 mb-8">Rankings across all Minecraft PvP gamemodes</p>

          {/* Gamemode Tabs */}
          {gamemodes && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              <button
                onClick={() => { setSelectedGamemodeId(undefined); setPage(1); }}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                  !selectedGamemodeId
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white bg-white/2"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <Trophy size={16} className="text-yellow-400" />
                </div>
                OVERALL
              </button>
              {gamemodes.map(gm => (
                <button
                  key={gm.id}
                  onClick={() => { setSelectedGamemodeId(gm.id); setPage(1); }}
                  className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                    selectedGamemodeId === gm.id
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white bg-white/2"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedGamemodeId === gm.id ? "bg-cyan-500/20 border border-cyan-500/20" : "bg-white/5 border border-white/5"
                  }`}>
                    <MinecraftIcon name={gm.name} size={20} />
                  </div>
                  <span className="uppercase tracking-wide">{gm.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <SlidersHorizontal size={14} />
              <span>Filters:</span>
            </div>
            <select
              value={selectedTier}
              onChange={e => { setSelectedTier(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-white/10 bg-black/60 text-sm text-gray-300 focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="">All Tiers</option>
              {TIERS.filter(t => t).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-white/10 bg-black/60 text-sm text-gray-300 focus:border-cyan-500/50 focus:outline-none"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {rankingsData && (
              <span className="text-xs text-gray-600 ml-auto">
                Showing {rankingsData.rankings.length} of {rankingsData.total} players
              </span>
            )}
          </div>

          {/* Rankings List */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-white/2 border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : rankingsData?.rankings.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              <Trophy size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold">No rankings found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedGamemodeId}-${selectedTier}-${sortBy}-${page}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {rankingsData?.rankings.map((ranking, i) => (
                  <PlayerCard key={ranking.id} ranking={ranking} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
