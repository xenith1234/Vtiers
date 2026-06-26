import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-cyan-500 rounded-sm flex items-center justify-center rotate-12">
                <span className="text-black font-black text-xs -rotate-12">VT</span>
              </div>
              <span className="font-black text-lg text-white">VERSUS <span className="text-cyan-400">TIERS</span></span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              The definitive Minecraft PvP tier ranking platform. Where the best players prove themselves.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Navigation</h3>
            <div className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/leaderboard", label: "Leaderboards" },
                { href: "/search", label: "Search Players" },
              ].map(link => (
                <Link key={link.href} href={link.href} className="block text-sm text-gray-500 hover:text-cyan-400 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Community</h3>
            <div className="space-y-2">
              <a href="https://discord.gg/versustiers" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-500 hover:text-indigo-400 transition-colors">Discord Server</a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/5 text-center text-xs text-gray-600">
          © 2024 VERSUS TIERS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
