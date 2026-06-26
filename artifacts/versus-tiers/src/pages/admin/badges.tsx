import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus, Trash2, X, Save } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/lib/auth-context";
import { useListBadges, useCreateBadge, useDeleteBadge, getListBadgesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const BADGE_ICONS = ["⭐","🔥","💎","🏆","👑","⚡","🎯","🛡️","⚔️","🎪","🌟","💀","🎮","🧪","🌙","☀️","🎖️","🦅","🐉","🔱"];

function BadgeModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const createMutation = useCreateBadge();
  const [form, setForm] = useState({ name: "", icon: "⭐", description: "", color: "#00e5ff" });

  const handleSave = async () => {
    if (!form.name) return;
    await createMutation.mutateAsync({ data: form });
    qc.invalidateQueries({ queryKey: getListBadgesQueryKey() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-black/90 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">Create Badge</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Icon</label>
            <div className="flex flex-wrap gap-2">
              {BADGE_ICONS.map(icon => (
                <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`w-8 h-8 rounded text-lg transition-all ${form.icon === icon ? "bg-cyan-500/20 border border-cyan-500/50" : "border border-white/10 hover:border-white/20"}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="EXPERT"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Top tier player"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Color</label>
            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="w-full h-10 bg-white/5 border border-white/10 rounded-lg cursor-pointer" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all text-sm">Cancel</button>
          <button onClick={handleSave} disabled={createMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-all text-sm">
            <Save size={14} /> Create
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminBadgesPage() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  if (!user) { navigate("/auth/login"); return null; }
  if (!isAdmin) { navigate("/"); return null; }

  const { data: badges, isLoading } = useListBadges(undefined, { query: { queryKey: getListBadgesQueryKey() } });
  const deleteMutation = useDeleteBadge();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this badge?")) return;
    await deleteMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListBadgesQueryKey() });
  };

  return (
    <AdminLayout title="Badge Management">
      {showModal && <BadgeModal onClose={() => setShowModal(false)} />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 text-sm">{badges?.length || 0} badges</p>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all text-sm">
            <Plus size={16} /> Create Badge
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/2 border border-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {badges?.map((badge, i) => (
              <motion.div key={badge.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-white/10 bg-black/40 p-4 relative group">
                <button onClick={() => handleDelete(badge.id)}
                  className="absolute top-2 right-2 p-1 rounded text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 size={12} />
                </button>
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="font-bold text-sm" style={badge.color ? { color: badge.color } : { color: "#fff" }}>{badge.name}</div>
                {badge.description && <div className="text-xs text-gray-600 mt-1 truncate">{badge.description}</div>}
              </motion.div>
            ))}
          </div>
        )}

        {badges?.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <div className="text-5xl mb-4">🏅</div>
            <p>No badges yet. Create your first badge!</p>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
