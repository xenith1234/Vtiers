import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, UserX, Ban, ShieldOff } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/lib/auth-context";
import { useListUsers, useDeleteUser, useSuspendUser, useBanUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const ROLE_COLORS: Record<string, string> = {
  owner: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  admin: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  moderator: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  member: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  guest: "text-gray-600 bg-gray-800/50 border-gray-700/20",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400 bg-green-500/10 border-green-500/20",
  suspended: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  banned: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function AdminUsersPage() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  if (!user) { navigate("/auth/login"); return null; }
  if (!isAdmin) { navigate("/"); return null; }

  const { data, isLoading } = useListUsers(
    { params: { search: search || undefined, role: roleFilter || undefined, page, limit: 20 } },
    { query: { queryKey: getListUsersQueryKey({ search: search || undefined, role: roleFilter || undefined, page, limit: 20 }) } }
  );
  const deleteMutation = useDeleteUser();
  const suspendMutation = useSuspendUser();
  const banMutation = useBanUser();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await deleteMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
  };

  const handleSuspend = async (id: number) => {
    await suspendMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
  };

  const handleBan = async (id: number) => {
    if (!confirm("Ban this user?")) return;
    await banMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
  };

  return (
    <AdminLayout title="User Management">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search users..."
              className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none"
          >
            <option value="">All Roles</option>
            {["owner","admin","moderator","member","guest"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5 bg-white/2">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-5 bg-white/5 rounded animate-pulse" /></td></tr>
                ))
              ) : data?.users.map(u => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{u.username}</div>
                    <div className="text-xs text-gray-600">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-bold capitalize ${ROLE_COLORS[u.role] || ""}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-bold capitalize ${STATUS_COLORS[u.status || "active"] || ""}`}>{u.status || "active"}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleSuspend(u.id)} title="Suspend" className="p-1.5 rounded text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"><ShieldOff size={14} /></button>
                      <button onClick={() => handleBan(u.id)} title="Ban" className="p-1.5 rounded text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 transition-all"><Ban size={14} /></button>
                      <button onClick={() => handleDelete(u.id)} title="Delete" className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><UserX size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>{data.total} total users</span>
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
