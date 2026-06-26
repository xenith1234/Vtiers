import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Search, CheckCircle, XCircle, Clock, Eye,
  Trash2, RefreshCw, ExternalLink, ChevronLeft, ChevronRight,
  MessageSquare, User, Gamepad2
} from "lucide-react";

interface Application {
  id: number;
  minecraftUsername: string;
  discord: string;
  gamemodes: string;
  evidence: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected" | "in_review";
  reviewedBy: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface ApplicationsResponse {
  applications: Application[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  in_review: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  approved: "text-green-400 bg-green-500/10 border-green-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  in_review: Eye,
  approved: CheckCircle,
  rejected: XCircle,
};

function getToken() {
  return localStorage.getItem("vt_token");
}

async function fetchApplications(page: number, status: string, search: string): Promise<ApplicationsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: "15" });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const res = await fetch(`/api/admin/applications?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to fetch applications");
  return res.json();
}

async function updateApplication(id: number, data: { status?: string; reviewNotes?: string; reviewedBy?: string }) {
  const res = await fetch(`/api/admin/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update application");
  return res.json();
}

async function deleteApplication(id: number) {
  const res = await fetch(`/api/admin/applications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to delete application");
}

export default function AdminApplicationsPage() {
  const [data, setData] = useState<ApplicationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async (p = page, s = statusFilter, q = search) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchApplications(p, s, q);
      setData(res);
    } catch {
      setError("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useState(() => { load(); });

  const handleStatusChange = async (id: number, status: string) => {
    setSaving(true);
    try {
      const updated = await updateApplication(id, { status, reviewNotes, reviewedBy: "admin" });
      setData(prev => prev ? {
        ...prev,
        applications: prev.applications.map(a => a.id === id ? updated : a),
      } : prev);
      if (selected?.id === id) setSelected(updated);
    } catch {
      alert("Failed to update application");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteApplication(id);
      setDeleteId(null);
      setData(prev => prev ? {
        ...prev,
        applications: prev.applications.filter(a => a.id !== id),
        total: prev.total - 1,
      } : prev);
      if (selected?.id === id) setSelected(null);
    } catch {
      alert("Failed to delete application");
    }
  };

  const totalPages = data ? Math.ceil(data.total / 15) : 0;

  return (
    <AdminLayout title="Applications">
      <div className="space-y-6">
        {/* Stats Bar */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["pending", "in_review", "approved", "rejected"] as const).map(s => {
              const count = data.applications.filter(a => a.status === s).length;
              const Icon = STATUS_ICONS[s];
              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(statusFilter === s ? "" : s); setPage(1); load(1, statusFilter === s ? "" : s, search); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                    statusFilter === s ? STATUS_COLORS[s] : "border-white/5 bg-white/2 text-gray-500 hover:border-white/10"
                  }`}
                >
                  <Icon size={14} />
                  <div>
                    <div className="text-xs capitalize font-bold">{s.replace("_", " ")}</div>
                    <div className="text-lg font-black">{s === statusFilter ? data.total : count}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              className="w-full bg-white/3 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
              placeholder="Search by username..."
              value={search}
              onChange={e => { setSearch(e.target.value); }}
              onKeyDown={e => { if (e.key === "Enter") { setPage(1); load(1, statusFilter, search); }}}
            />
          </div>
          <button
            onClick={() => load(page, statusFilter, search)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}

        <div className="flex gap-4">
          {/* List */}
          <div className="flex-1 space-y-2 min-w-0">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-white/2 border border-white/5 animate-pulse" />
              ))
            ) : !data?.applications.length ? (
              <div className="text-center py-20 text-gray-600">
                <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-semibold">No applications found</p>
              </div>
            ) : (
              <AnimatePresence>
                {data.applications.map(app => {
                  const StatusIcon = STATUS_ICONS[app.status];
                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => { setSelected(app); setReviewNotes(app.reviewNotes || ""); }}
                      className={`p-4 rounded-xl border bg-black/40 cursor-pointer transition-all hover:border-cyan-500/20 ${
                        selected?.id === app.id ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={`https://mc-heads.net/avatar/${app.minecraftUsername}/32`}
                          className="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/32"; }}
                          alt=""
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white">{app.minecraftUsername}</span>
                            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-bold ${STATUS_COLORS[app.status]}`}>
                              <StatusIcon size={10} /> {app.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">@{app.discord}</div>
                          <div className="text-xs text-gray-600 mt-1 truncate">{app.gamemodes}</div>
                        </div>
                        <div className="text-xs text-gray-700 flex-shrink-0">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p); }}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
                ><ChevronLeft size={16} /></button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); load(p); }}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
                ><ChevronRight size={16} /></button>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-80 flex-shrink-0 rounded-xl border border-white/10 bg-black/60 backdrop-blur-sm p-5 space-y-4 h-fit sticky top-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Application #{selected.id}</span>
                  <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white text-lg leading-none">×</button>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={`https://mc-heads.net/avatar/${selected.minecraftUsername}/48`}
                    className="w-12 h-12 rounded-lg border border-white/10"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/48"; }}
                    alt=""
                  />
                  <div>
                    <div className="font-bold text-white">{selected.minecraftUsername}</div>
                    <div className="text-sm text-gray-500">@{selected.discord}</div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                      <Gamepad2 size={12} /> Gamemodes
                    </div>
                    <p className="text-gray-300">{selected.gamemodes}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                      <ExternalLink size={12} /> Evidence
                    </div>
                    <p className="text-gray-300 break-all text-xs">{selected.evidence}</p>
                  </div>
                  {selected.notes && (
                    <div className="p-3 rounded-lg bg-white/3 border border-white/5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                        <MessageSquare size={12} /> Notes
                      </div>
                      <p className="text-gray-300">{selected.notes}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={12} /> Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-white/3 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                    placeholder="Add review notes..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStatusChange(selected.id, "in_review")}
                    disabled={saving}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <Eye size={12} /> Review
                  </button>
                  <button
                    onClick={() => handleStatusChange(selected.id, "approved")}
                    disabled={saving}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-green-500/20 bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all disabled:opacity-50"
                  >
                    <CheckCircle size={12} /> Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(selected.id, "rejected")}
                    disabled={saving}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                  <button
                    onClick={() => setDeleteId(selected.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/5 text-gray-500 text-xs font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>

                {selected.reviewedAt && (
                  <div className="text-xs text-gray-600 flex items-center gap-1.5">
                    <User size={10} /> Reviewed by {selected.reviewedBy || "staff"} · {new Date(selected.reviewedAt).toLocaleDateString()}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-black border border-red-500/20 rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-bold text-white mb-2">Delete Application</h3>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:border-white/20 transition-all">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 transition-all">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
