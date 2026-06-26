import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CloudBackground } from "@/components/clouds";
import { TierBadge } from "@/components/tier-badge";
import { useSearch, getSearchQueryKey } from "@workspace/api-client-react";

const TIERS = ["", "HT5", "HT4", "HT3", "HT2", "HT1", "LT5", "LT4", "LT3", "LT2", "LT1", "UR"];

function getFlag(code?: string | null) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading } = useSearch(
    { params: { q: debouncedQ || undefined, tier: tier || undefined } },
    { query: { queryKey: getSearchQueryKey({ q: debouncedQ || undefined, tier: tier || undefined }), enabled: true } }
  );

  return (
    <div className="min-h-screen bg-black text-white relative">
      <CloudBackground />
      <Navbar />

      <main className="relative z-10 pt-24 pb-20 max-w-4xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black text-white mb-2">Search Players</h1>
          <p className="text-gray-500 mb-8">Find any ranked Minecraft PvP player</p>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by username, Discord..."
              className="w-full pl-11 pr-10 py-4 bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all text-lg"
              autoFocus
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-8 flex-wrap">
            <select
              value={tier}
              onChange={e => setTier(e.target.value)}
              className="px-3 py-2 rounded-lg border border-white/10 bg-black/60 text-sm text-gray-300 focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="">All Tiers</option>
              {TIERS.filter(t => t).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Results */}
          {isLoading && debouncedQ && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-white/2 border border-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {data && (
            <div>
              <div className="text-sm text-gray-600 mb-3">{data.total} results</div>
              <AnimatePresence>
                <div className="space-y-2">
                  {data.players.map((player, i) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link href={`/players/${player.id}`}>
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-black/40 hover:border-cyan-500/20 hover:bg-black/60 transition-all cursor-pointer group">
                          <img
                            src={`https://mc-heads.net/avatar/${player.minecraftUsername}/48`}
                            alt={player.minecraftUsername}
                            className="w-12 h-12 rounded-lg border border-white/10"
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/48"; }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">{player.minecraftUsername}</span>
                              {player.countryCode && <span>{getFlag(player.countryCode)}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {player.overallTier && <TierBadge tier={player.overallTier} size="sm" />}
                              {player.discord && <span className="text-xs text-gray-600">@{player.discord}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-cyan-400 font-mono">{player.points.toLocaleString()}</div>
                            <div className="text-xs text-gray-600">points</div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>

              {data.total === 0 && !isLoading && (
                <div className="text-center py-16 text-gray-600">
                  <Search size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-semibold">No players found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          )}

          {!debouncedQ && !tier && (
            <div className="text-center py-16 text-gray-700">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg">Start typing to search players</p>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
