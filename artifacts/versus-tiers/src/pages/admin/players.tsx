import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Search, X, Save } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { TierBadge } from "@/components/tier-badge";
import { useAuth } from "@/lib/auth-context";
import { useListPlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer, getListPlayersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Player } from "@workspace/api-client-react/src/generated/api.schemas";

const TIERS = ["HT1","HT2","HT3","HT4","HT5","LT1","LT2","LT3","LT4","LT5","UR"];

function PlayerModal({ player, onClose }: { player?: Player | null; onClose: () => void }) {
  const qc = useQueryClient();
  const createMutation = useCreatePlayer();
  const updateMutation = useUpdatePlayer();
  const [form, setForm] = useState({
    minecraftUsername: player?.minecraftUsername || "",
    discord: player?.discord || "",
    country: player?.country || "",
    countryCode: player?.countryCode || "",
    overallTier: player?.overallTier || "UR",
    points: player?.points?.toString() || "0",
  });

  const handleSave = async () => {
    const data = { ...form, points: parseInt(form.points) || 0 };
    if (player) {
      await updateMutation.mutateAsync({ id: player.id, data });
    } else {
      await createMutation.mutateAsync({ data });
    }
    qc.invalidateQueries({ queryKey: getListPlayersQueryKey() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-black/90 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">{player ? "Edit Player" : "Add Player"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {[
            { key: "minecraftUsername", label: "Minecraft Username", placeholder: "Steve" },
            { key: "discord", label: "Discord", placeholder: "username#0000" },
            { key: "country", label: "Country", placeholder: "United States" },
            { key: "countryCode", label: "Country Code", placeholder: "US" },
            { key: "points", label: "Points", placeholder: "0", type: "number" },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{field.label}</label>
              <input
                type={field.type || "text"}
                value={(form as any)[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Overall Tier</label>
            <select value={form.overallTier} onChange={e => setForm(f => ({ ...f, overallTier: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50">
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all text-sm">Cancel</button>
          <button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-all text-sm"
          >
            <Save size={14} /> Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminPlayersPage() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalPlayer, setModalPlayer] = useState<Player | null | undefined>(undefined);

  if (!user) { navigate("/auth/login"); return null; }
  if (!isAdmin) { navigate("/"); return null; }

  const { data, isLoading } = useListPlayers(
    { params: { search: search || undefined, page, limit: 20 } },
    { query: { queryKey: getListPlayersQueryKey({ search: search || undefined, page, limit: 20 }) } }
  );
  const deleteMutation = useDeletePlayer();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this player?")) return;
    await deleteMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListPlayersQueryKey() });
  };

  return (
    <AdminLayout title="Player Management">
      {modalPlayer !== undefined && (
        <PlayerModal player={modalPlayer} onClose={() => setModalPlayer(undefined)} />
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search players..."
              className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <button
            onClick={() => setModalPlayer(null)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all text-sm"
          >
            <Plus size={16} /> Add Player
          </button>
        </div>

        <div className="rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5 bg-white/2">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Player</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Country</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tier</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Points</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-5 bg-white/5 rounded animate-pulse" /></td></tr>
                ))
              ) : data?.players.map(player => (
                <tr key={player.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={`https://mc-heads.net/avatar/${player.minecraftUsername}/32`} alt="" className="w-8 h-8 rounded border border-white/10"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/32"; }} />
                      <div>
                        <div className="font-semibold text-white">{player.minecraftUsername}</div>
                        {player.discord && <div className="text-xs text-gray-600">@{player.discord}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{player.country || "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{player.overallTier ? <TierBadge tier={player.overallTier} size="sm" /> : "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-cyan-400 hidden md:table-cell">{player.points.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModalPlayer(player)} className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(player.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>{data.total} total players</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-white/10 hover:border-white/20 disabled:opacity-30 transition-all">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total} className="px-3 py-1 rounded border border-white/10 hover:border-white/20 disabled:opacity-30 transition-all">Next</button>
            </div>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
