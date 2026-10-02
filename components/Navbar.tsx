'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: '📱 Customer Menu' },
    { href: '/pos', label: '💵 Cashier Terminal', badge: 'Live' },
    { href: '/orders', label: '📋 Orders Tracker', badge: 'Realtime' },
    { href: '/admin', label: '🛡️ Admin Portal', badge: 'kyleseatery' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
            ₱
          </div>
          <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
            Kylsb POS
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
