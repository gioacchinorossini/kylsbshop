'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [filterType, setFilterType] = useState('all');
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  useEffect(() => {
    setIsSubmenuOpen(pathname === '/transactions' || pathname === '/stockin');
  }, [pathname]);

  useEffect(() => {
    const updateFilter = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        setFilterType(params.get('type') || 'all');
      }
    };
    updateFilter();
    const interval = setInterval(updateFilter, 100);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const handleNav = (path: string) => {
    router.push(path);
  };

  const isAdmin = user.role === 'Admin';
  const isManager = user.role === 'Manager';

  return (
    <aside className="sidebar">
      <ul>
        {/* Reports is available to Admin and Manager */}
        {(isAdmin || isManager) && (
          <li
            className={pathname === '/reports' ? 'active' : ''}
            onClick={() => handleNav('/reports')}
          >
            <i className="ti ti-chart-bar"></i>
            Reports
          </li>
        )}

        {/* Products is only for Admin */}
        {isAdmin && (
          <li
            className={pathname === '/masterlist' ? 'active' : ''}
            onClick={() => handleNav('/masterlist')}
          >
            <i className="ti ti-burger"></i>
            Products
          </li>
        )}

        {/* Transactions (Detailed inventory & stockin) is available to Admin and Manager */}
        {(isAdmin || isManager) && (
          <li className="has-submenu">
            <div
              className={`submenu-header ${pathname === '/transactions' || pathname === '/stockin' ? 'active' : ''}`}
              onClick={() => handleNav('/transactions?type=all')}
            >
              <i className="ti ti-receipt"></i>
              Transactions
              <i 
                className={`ti ti-chevron-${isSubmenuOpen ? 'up' : 'down'}`} 
                style={{ marginLeft: 'auto', fontSize: '12px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSubmenuOpen(!isSubmenuOpen);
                }}
              ></i>
            </div>
            {isSubmenuOpen && (
              <ul className="submenu-list">
                <li
                  className={pathname === '/transactions' && filterType === 'all' ? 'submenu-active' : ''}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('/transactions?type=all');
                  }}
                >
                  <i className="ti ti-point" style={{ fontSize: '10px' }}></i>
                  All Transactions
                </li>
                <li
                  className={pathname === '/transactions' && filterType === 'sales' ? 'submenu-active' : ''}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('/transactions?type=sales');
                  }}
                >
                  <i className="ti ti-point" style={{ fontSize: '10px' }}></i>
                  Sales Order
                </li>
                <li
                  className={pathname === '/stockin' ? 'submenu-active' : ''}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('/stockin');
                  }}
                >
                  <i className="ti ti-point" style={{ fontSize: '10px' }}></i>
                  Purchase Order
                </li>
              </ul>
            )}
          </li>
        )}

        {/* Settings is only for Admin */}
        {isAdmin && (
          <li
            className={pathname === '/settings' ? 'active' : ''}
            onClick={() => handleNav('/settings')}
          >
            <i className="ti ti-settings"></i>
            Settings
          </li>
        )}

        {/* Kitchen KDS - visible to everyone */}
        <li
          className={pathname === '/kitchen' ? 'active' : ''}
          onClick={() => handleNav('/kitchen')}
        >
          <i className="ti ti-tools-kitchen-2"></i>
          Kitchen KDS
        </li>

        {/* Waiter App - visible to everyone */}
        <li
          className={pathname === '/waiter' ? 'active' : ''}
          onClick={() => handleNav('/waiter')}
        >
          <i className="ti ti-clipboard-list"></i>
          Waiter App
        </li>

        {/* Point of Sale order page - visible to everyone */}
        <li
          className={pathname === '/order' ? 'active' : ''}
          onClick={() => handleNav('/order')}
        >
          <i className="ti ti-device-ipad"></i>
          Order POS
        </li>

        <li onClick={logout} className="logout-item">
          <i className="ti ti-logout"></i>
          Logout
        </li>
      </ul>
      <div className="user-profile-badge">
        <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div className="info">
          <div className="name">{user.name}</div>
          <div className="role">{user.role}</div>
        </div>
      </div>
    </aside>
  );
}
