'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Topbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [search, setSearch] = useState('');

  // Kitchen is a full-screen display board — no topbar needed
  if (!user || pathname === '/kitchen') return null;

  const initials = user.name
    .split(' ')
    .map((n: string) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <header className="topbar">
      {/* Brand logo and name */}
      <div className="topbar-brand">
        <i className="ti ti-flame topbar-brand-icon"></i>
        <span className="topbar-brand-name">Sizzling Grill</span>
      </div>

      {/* Search */}
      <div className="topbar-search">
        <i className="ti ti-search topbar-search-icon"></i>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="topbar-search-input"
        />
      </div>

      {/* Right side */}
      <div className="topbar-right">
        <button className="topbar-icon-btn" aria-label="Notifications">
          <i className="ti ti-bell"></i>
        </button>
        <div className="topbar-user">
          <div className="topbar-avatar">{initials}</div>
          <span className="topbar-username">{user.name}</span>
          <i className="ti ti-chevron-down topbar-chevron"></i>
        </div>
      </div>
    </header>
  );
}
