import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Users, Sword, Trophy, Award, Settings, Megaphone, LogOut, ChevronRight
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/players", label: "Players", icon: Trophy },
  { href: "/admin/gamemodes", label: "Gamemodes", icon: Sword },
  { href: "/admin/rankings", label: "Rankings", icon: Award },
  { href: "/admin/badges", label: "Badges", icon: Award },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/60 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-cyan-500 rounded-sm flex items-center justify-center rotate-12">
              <span className="text-black font-black text-xs -rotate-12">VT</span>
            </div>
            <span className="font-black text-sm text-white">VERSUS <span className="text-cyan-400">TIERS</span></span>
          </Link>
          <div className="mt-3 text-xs text-gray-600 font-semibold uppercase tracking-wider">Admin Panel</div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                {item.label}
                {active && <ChevronRight size={12} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.username}</div>
              <div className="text-xs text-gray-600 capitalize">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="border-b border-white/5 px-8 py-4 bg-black/40 backdrop-blur-sm">
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
