import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Hash, Star } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CloudBackground } from "@/components/clouds";
import { TierBadge, TIER_SEQUENCE } from "@/components/tier-badge";
import { useSearch, getSearchQueryKey } from "@workspace/api-client-react";

function getFlag(code?: string | null) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 280);
    return () => clearTimeout(t);
  }, [q]);

  // "/" keyboard shortcut focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isFiltered = !!debouncedQ || !!tier;

  const { data, isLoading } = useSearch(
    { params: { q: debouncedQ || undefined, tier: tier || undefined } },
    { query: { queryKey: getSearchQueryKey({ q: debouncedQ || undefined, tier: tier || undefined }), enabled: true } }
  );

  return (
    <div className="min-h-screen bg-black text-white relative">
      <CloudBackground />
      <Navbar />

      <main className="relative z-10 pt-24 pb-24 max-w-3xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Find a Player</h1>
            <p className="text-gray-600 text-sm">Search across all ranked Minecraft PvP players</p>
          </div>

          {/* Big search bar */}
          <div className="relative mb-5 group">
            <div className="absolute inset-0 rounded-2xl bg-cyan-500/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative flex items-center rounded-2xl border border-white/10 bg-[#08080f]/80 backdrop-blur-sm focus-within:border-cyan-500/40 transition-colors overflow-hidden">
              <Search size={20} className="absolute left-5 text-gray-600 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search by username or Discord…"
                className="w-full pl-14 pr-14 py-5 bg-transparent text-white placeholder-gray-700 focus:outline-none text-lg font-medium"
                autoFocus
              />
              {q ? (
                <button
                  onClick={() => { setQ(""); inputRef.current?.focus(); }}
                  className="absolute right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X size={16} />
                </button>
              ) : (
                <kbd className="absolute right-5 px-2 py-1 rounded-md border border-white/10 text-gray-700 text-xs font-mono hidden sm:block">/</kbd>
              )}
            </div>
          </div>

          {/* Tier filter pills */}
          <div className="flex gap-2 flex-wrap mb-8">
            <button
              onClick={() => setTier("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                !tier
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-white/5 text-gray-600 hover:text-gray-400 hover:border-white/10"
              }`}
            >
              All
            </button>
            {TIER_SEQUENCE.map(t => (
              <button
                key={t}
                onClick={() => setTier(tier === t ? "" : t)}
                className={`transition-all ${tier === t ? "opacity-100 scale-105" : "opacity-60 hover:opacity-90"}`}
              >
                <TierBadge tier={t} size="sm" />
              </button>
            ))}
          </div>

          {/* Result count */}
          {data && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-600 font-mono">
                {isFiltered
                  ? `${data.total} result${data.total !== 1 ? "s" : ""} found`
                  : `${data.total} ranked player${data.total !== 1 ? "s" : ""}`}
              </span>
              {isFiltered && (
                <button
                  onClick={() => { setQ(""); setTier(""); }}
                  className="text-xs text-gray-600 hover:text-cyan-400 transition-colors flex items-center gap-1"
                >
                  <X size={10} /> Clear filters
                </button>
              )}
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[72px] rounded-xl bg-white/2 border border-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {/* Results list */}
          {!isLoading && data && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${debouncedQ}-${tier}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {data.players.map((player: any, i: number) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                  >
                    <Link href={`/players/${player.id}`}>
                      <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/5 bg-[#08080f]/60 hover:border-cyan-500/25 hover:bg-[#0d0d14]/80 transition-all cursor-pointer group">

                        {/* Avatar */}
                        <div className="flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden border border-white/10 bg-black/50">
                          <img
                            src={`https://mc-heads.net/avatar/${player.minecraftUsername}/48`}
                            alt={player.minecraftUsername}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/48"; }}
                          />
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                              {player.minecraftUsername}
                            </span>
                            {player.countryCode && (
                              <span className="text-sm" title={player.country || ""}>{getFlag(player.countryCode)}</span>
                            )}
                            {player.overallTier && <TierBadge tier={player.overallTier} size="sm" />}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {player.discord && (
                              <span className="text-xs text-gray-600">@{player.discord}</span>
                            )}
                            {/* Badges */}
                            {player.badges?.slice(0, 2).map((badge: any) => (
                              <span
                                key={badge.id}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-gray-500 uppercase tracking-wider"
                                style={badge.color ? { borderColor: badge.color + "40", color: badge.color, backgroundColor: badge.color + "10" } : {}}
                              >
                                {badge.icon} {badge.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Right stats */}
                        <div className="flex-shrink-0 text-right flex flex-col gap-1 items-end">
                          <div className="flex items-center gap-1.5">
                            <Star size={10} className="text-cyan-600" />
                            <span className="text-sm font-black text-cyan-400 font-mono">
                              {player.points.toLocaleString()}
                            </span>
                          </div>
                          {player.gamemodeCount > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-700">
                              <Hash size={9} />
                              <span>{player.gamemodeCount} mode{player.gamemodeCount !== 1 ? "s" : ""}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}

                {data.total === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 border border-white/5 rounded-2xl bg-white/[0.01]"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center mx-auto mb-4">
                      <Search size={22} className="text-gray-700" />
                    </div>
                    <p className="text-gray-500 font-semibold">No players found</p>
                    <p className="text-gray-700 text-sm mt-1">
                      {debouncedQ ? `No match for "${debouncedQ}"` : "Try adjusting your filters"}
                    </p>
                    {isFiltered && (
                      <button
                        onClick={() => { setQ(""); setTier(""); }}
                        className="mt-4 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                      >
                        Clear all filters
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
