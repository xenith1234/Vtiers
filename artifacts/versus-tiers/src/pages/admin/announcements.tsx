import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus, Trash2, ToggleLeft, ToggleRight, X, Save } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/lib/auth-context";
import { useListAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function AnnouncementModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const createMutation = useCreateAnnouncement();
  const [text, setText] = useState("");
  const [active, setActive] = useState(true);

  const handleSave = async () => {
    if (!text) return;
    await createMutation.mutateAsync({ data: { text, active } });
    qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-black/90 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">New Announcement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Announcement Text</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              placeholder="Season 2 has started! New gamemodes are now available."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-300">Active (show to users)</span>
          </label>
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

export default function AdminAnnouncementsPage() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  if (!user) { navigate("/auth/login"); return null; }
  if (!isAdmin) { navigate("/"); return null; }

  const { data: announcements, isLoading } = useListAnnouncements(undefined, { query: { queryKey: getListAnnouncementsQueryKey() } });
  const deleteMutation = useDeleteAnnouncement();
  const updateMutation = useUpdateAnnouncement();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    await deleteMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
  };

  const handleToggle = async (id: number, active: boolean) => {
    await updateMutation.mutateAsync({ id, data: { active: !active } });
    qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
  };

  return (
    <AdminLayout title="Announcements">
      {showModal && <AnnouncementModal onClose={() => setShowModal(false)} />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 text-sm">{announcements?.length || 0} announcements</p>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all text-sm">
            <Plus size={16} /> New Announcement
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/2 border border-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {announcements?.map((ann, i) => (
              <motion.div key={ann.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${ann.active ? "border-cyan-500/20 bg-black/40" : "border-white/5 bg-black/20 opacity-60"}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200">{ann.text}</div>
                  <div className="text-xs text-gray-600 mt-1">{new Date(ann.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleToggle(ann.id, ann.active)}
                    className={`transition-colors ${ann.active ? "text-green-400 hover:text-gray-400" : "text-gray-600 hover:text-green-400"}`}>
                    {ann.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => handleDelete(ann.id)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </div>
              </motion.div>
            ))}
            {announcements?.length === 0 && (
              <div className="text-center py-12 text-gray-600">
                <div className="text-4xl mb-3">📢</div>
                <p>No announcements yet</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
