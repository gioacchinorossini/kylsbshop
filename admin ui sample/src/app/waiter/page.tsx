'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  status: string;
  stock: number;
  image: string | null;
  emoji: string;
}

interface CategoryGroup {
  label: string;
  icon: string;
  sections: {
    [sectionName: string]: MenuItem[];
  };
}

interface CartItem extends MenuItem {
  qty: number;
}

interface Table {
  id: number;
  pax: number;
  occupied: boolean;
  zone: 'indoor' | 'window' | 'terrace';
}

const TABLES_DATA: { [key: string]: { id: number; pax: number; occupied: boolean }[] } = {
  indoor: [
    { id: 1, pax: 2, occupied: false },
    { id: 2, pax: 2, occupied: false },
    { id: 3, pax: 4, occupied: false },
    { id: 4, pax: 4, occupied: false },
    { id: 5, pax: 4, occupied: false },
    { id: 6, pax: 6, occupied: false },
    { id: 7, pax: 6, occupied: false },
    { id: 8, pax: 2, occupied: false },
    { id: 9, pax: 2, occupied: false },
    { id: 10, pax: 4, occupied: false },
  ],
  window: [
    { id: 11, pax: 2, occupied: false },
    { id: 12, pax: 2, occupied: false },
    { id: 13, pax: 2, occupied: false },
    { id: 14, pax: 4, occupied: false },
    { id: 15, pax: 4, occupied: false },
  ],
  terrace: [
    { id: 16, pax: 4, occupied: false },
    { id: 17, pax: 4, occupied: false },
    { id: 18, pax: 6, occupied: false },
    { id: 19, pax: 6, occupied: false },
    { id: 20, pax: 2, occupied: false },
  ]
};

export default function WaiterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Menu / Products State
  const [categories, setCategories] = useState<{ [category: string]: CategoryGroup }>({});
  const [menuLoading, setMenuLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart / Order State
  const [order, setOrder] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<{ id: number; pax: number; zone: string } | null>(null);
  const [pendingTableId, setPendingTableId] = useState<number | null>(null);

  // Modals & Navigation Drawers
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const [toastShow, setToastShow] = useState(false);
  const [sendingOrder, setSendingOrder] = useState(false);

  // Fetch Menu
  const fetchMenu = async () => {
    try {
      setMenuLoading(true);
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Waiter menu fetch error:', err);
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchMenu();
    }
  }, [user, authLoading]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastText(msg);
    setToastShow(true);
    const timer = setTimeout(() => {
      setToastShow(false);
    }, 2600);
    return () => clearTimeout(timer);
  };

  if (authLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-deep)', color: 'var(--primary)' }}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif' }}>Loading session and verifying privileges...</h3>
      </div>
    );
  }

  // Cart Helpers
  const findProduct = (id: string): MenuItem | null => {
    for (const cat of Object.values(categories)) {
      if (!cat || !cat.sections) continue;
      for (const items of Object.values(cat.sections)) {
        for (const p of items) {
          if (String(p.id) === String(id)) return p;
        }
      }
    }
    return null;
  };

  const addToOrder = (id: string) => {
    const p = findProduct(id);
    if (!p) return;
    if (p.status === 'unavailable' || p.stock <= 0) {
      showToast(`⚠️ ${p.name} is out of stock`);
      return;
    }

    setOrder(prev => {
      const existing = prev.find(item => String(item.id) === String(id));
      if (existing) {
        if (existing.qty >= p.stock) {
          showToast(`⚠️ Maximum stock reached`);
          return prev;
        }
        showToast(`${p.name} added`);
        return prev.map(item => String(item.id) === String(id) ? { ...item, qty: item.qty + 1 } : item);
      }
      showToast(`${p.name} added`);
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setOrder(prev => {
      const existing = prev.find(item => String(item.id) === String(id));
      if (!existing) return prev;

      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        return prev.filter(item => String(item.id) !== String(id));
      }

      if (delta > 0 && newQty > existing.stock) {
        showToast(`⚠️ Maximum stock reached`);
        return prev;
      }

      return prev.map(item => String(item.id) === String(id) ? { ...item, qty: newQty } : item);
    });
  };

  // Table Picker Helpers
  const openTableModal = () => {
    setPendingTableId(selectedTable ? selectedTable.id : null);
    setTableModalOpen(true);
  };

  const findTableData = (id: number) => {
    for (const [zone, tables] of Object.entries(TABLES_DATA)) {
      const t = tables.find(t => t.id === id);
      if (t) return { ...t, zone };
    }
    return null;
  };

  const confirmTable = () => {
    if (!pendingTableId) return;
    const table = findTableData(pendingTableId);
    if (table) {
      setSelectedTable(table);
      setTableModalOpen(false);
      showToast(`Table ${table.id} selected`);
    }
  };

  // Send Order
  const sendOrder = async () => {
    if (!order.length || !selectedTable) return;
    setSendingOrder(true);
    const orderNo = 'T' + selectedTable.id + '-' + (Math.floor(Math.random() * 9000) + 1000);

    try {
      const res = await fetch('/api/kitchen/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo,
          tableNumber: selectedTable.id.toString(),
          items: order.map(item => ({ name: item.name, qty: item.qty, price: item.price }))
        })
      });

      if (res.ok) {
        const totalItems = order.reduce((sum, item) => sum + item.qty, 0);
        showToast(`Order sent! Table ${selectedTable.id} · ${totalItems} items → Kitchen`);
        setOrder([]);
        setSelectedTable(null);
        setDrawerOpen(false);
      } else {
        alert('Failed to send order to kitchen.');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending order to kitchen.');
    } finally {
      setSendingOrder(false);
    }
  };

  // Filter sections and items
  const getAllSections = () => {
    const out: { sec: string; items: MenuItem[]; catKey: string }[] = [];
    for (const [catKey, catObj] of Object.entries(categories)) {
      if (!catObj || !catObj.sections) continue;
      for (const [sec, items] of Object.entries(catObj.sections)) {
        out.push({ sec, items, catKey });
      }
    }
    return out;
  };

  const getFilteredSections = () => {
    let sections = [];
    if (currentCategory === 'all') {
      sections = getAllSections();
    } else {
      const catObj = categories[currentCategory];
      if (catObj && catObj.sections) {
        for (const [sec, items] of Object.entries(catObj.sections)) {
          sections.push({ sec, items, catKey: currentCategory });
        }
      }
    }

    if (searchQuery) {
      sections = sections.map(s => ({
        ...s,
        items: s.items.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      })).filter(s => s.items.length > 0);
    }

    return sections;
  };

  const sectionsToRender = getFilteredSections();
  const totalItems = order.reduce((sum, item) => sum + item.qty, 0);
  const orderSubtotal = order.reduce((sum, item) => sum + item.price * item.qty, 0);

  const zoneLabels: { [key: string]: string } = {
    indoor: 'Indoor · Main Floor',
    window: 'Indoor · Window Side',
    terrace: 'Outdoor · Terrace'
  };

  return (
    <>
      {/* Load Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      {/* Tabler Icons CDN */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      
      {/* Inject exact waiter.css styles updated to match our design */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary-orange: #EA6A12;
          --primary-hover: #d55b0c;
          --success-green: #02a488;
          --border-color: #dee2e6;
          --bg-gray: #f2f4f5;
          --card-white: #ffffff;
          --text-deep: #34363a;
          --text-muted: #74788d;
          --radius: 12px;
          --radius-sm: 8px;
        }

        body {
          font-family: 'Poppins', sans-serif !important;
          background: var(--bg-gray) !important;
          color: var(--text-deep) !important;
          margin: 0;
          padding: 0;
          height: 100vh;
          overflow: hidden;
        }

        .topbar {
          background: var(--card-white);
          border-bottom: 1.5px solid var(--border-color);
          padding: 10px 24px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
          z-index: 20;
          height: 60px;
          box-sizing: border-box;
        }

        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: var(--primary-orange);
        }

        .logo-name {
          font-family: 'Poppins', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-deep);
          letter-spacing: 0.5px;
        }

        .table-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 30px;
          padding: 6px 14px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-deep);
          transition: var(--transition);
          flex-shrink: 0;
          white-space: nowrap;
          outline: none;
          font-family: 'Poppins', sans-serif;
        }

        .table-chip:hover {
          border-color: var(--primary-orange);
          color: var(--primary-orange);
          background: rgba(234, 106, 18, 0.02);
        }

        .table-chip.selected {
          background: rgba(234, 106, 18, 0.08);
          border-color: var(--primary-orange);
          color: var(--primary-orange);
        }

        .topbar-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .waiter-badge {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 5px 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border: 1px solid var(--border-color);
        }

        .cat-nav {
          background: var(--card-white);
          border-bottom: 1.5px solid var(--border-color);
          padding: 10px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          overflow-x: auto;
        }

        .cat-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 30px;
          border: 1px solid var(--border-color);
          background: transparent;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.18s;
          outline: none;
        }

        .cat-pill.active {
          background: rgba(234, 106, 18, 0.1);
          border-color: var(--primary-orange);
          color: var(--primary-orange);
        }

        .main-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
          height: calc(100vh - 60px);
        }

        .sidebar {
          width: 250px;
          background-color: var(--card-white);
          color: var(--text-deep);
          padding: 20px 0;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow-y: auto;
        }

        .logo-area {
          display: flex;
          align-items: center;
          padding: 10px 24px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
          gap: 10px;
        }

        .cat-list {
          display: flex;
          flex-direction: column;
        }

        .cat-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          padding: 14px 24px;
          text-align: left;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          outline: none;
          border-left: 3px solid transparent;
        }

        .cat-btn:hover {
          background-color: rgba(0, 0, 0, 0.02);
          color: var(--text-deep);
        }

        .cat-btn.active {
          border-left: 3px solid var(--primary-orange);
          background-color: rgba(234, 106, 18, 0.05);
          color: var(--primary-orange);
          font-weight: 600;
        }

        .content {
          flex: 1;
          overflow-y: auto;
          padding: 22px 24px 30px;
        }

        .section-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 14px;
          padding-bottom: 6px;
          border-bottom: 1.5px solid var(--border-color);
          font-family: 'Poppins', sans-serif;
        }

        .h-scroll-section {
          margin-bottom: 28px;
        }

        .h-scroll-row {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 8px;
        }

        .product-card {
          background: var(--card-white);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: 0 2px 5px rgba(0,0,0,0.04);
          transition: all 0.2s;
          cursor: pointer;
          flex-shrink: 0;
          width: 180px;
          border: 1px solid var(--border-color);
        }

        .product-card:hover {
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
          transform: translateY(-2px);
          border-color: var(--primary-orange);
        }

        .product-card.unavailable {
          opacity: 0.55;
          pointer-events: none;
        }

        .product-img {
          width: 100%;
          height: 110px;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
          overflow: hidden;
          border-bottom: 1px solid var(--border-color);
        }

        .product-info {
          padding: 10px 12px 12px;
        }

        .product-name {
          font-weight: 700;
          font-size: 13.5px;
          color: var(--text-deep);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-status {
          font-size: 11px;
          color: var(--success-green);
          font-weight: 500;
        }

        .product-status.unavail {
          color: #ff4d4d;
        }

        .product-sold {
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
        }

        .product-price {
          font-weight: 700;
          font-size: 13.5px;
          color: var(--success-green);
        }

        .add-btn {
          background: transparent;
          color: var(--primary-orange);
          border: 1px solid var(--primary-orange);
          border-radius: 8px;
          padding: 4px 11px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          transition: all 0.18s;
        }

        .add-btn:hover {
          background: var(--primary-orange);
          color: #ffffff;
        }

        /* Table picker modal */
        .modal-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 100;
          align-items: center;
          justify-content: center;
        }

        .modal-overlay.open {
          display: flex;
        }

        .table-modal {
          background: var(--card-white);
          border-radius: 16px;
          padding: 28px 24px 24px;
          width: 520px;
          max-width: 95vw;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--border-color);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .modal-title {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-deep);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-close {
          background: #f8f9fa;
          border: 1px solid var(--border-color);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: var(--transition);
        }

        .modal-close:hover {
          background: #e9ecef;
          color: var(--text-deep);
        }

        .modal-sub {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        .zone-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 10px;
          margin-top: 16px;
        }

        .table-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-bottom: 4px;
        }

        .table-btn {
          aspect-ratio: 1;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: transparent;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          font-family: 'Poppins', sans-serif;
          transition: all 0.16s;
          position: relative;
          outline: none;
        }

        .table-btn .tb-icon { font-size: 20px; color: var(--text-muted); }
        .table-btn .tb-num { font-size: 12px; font-weight: 700; color: var(--text-deep); }
        .table-btn .tb-pax { font-size: 10px; color: var(--text-muted); }

        .table-btn:hover:not(.occupied) { border-color: var(--primary-orange); background: rgba(234, 106, 18, 0.02); }
        .table-btn.selected { background: rgba(234, 106, 18, 0.08); border-color: var(--primary-orange); }
        .table-btn.selected .tb-num, .table-btn.selected .tb-pax, .table-btn.selected .tb-icon { color: var(--primary-orange); }

        .table-btn.occupied { background: #fff5f5; border-color: #f5c2c2; cursor: not-allowed; }
        .table-btn.occupied .tb-num, .table-btn.occupied .tb-icon { color: #ff4d4d; }
        .table-btn.occupied .tb-pax { color: #f5c2c2; }

        .occ-dot {
          position: absolute;
          top: 6px;
          right: 7px;
          width: 7px;
          height: 7px;
          background: #ff4d4d;
          border-radius: 50%;
        }

        .legend {
          display: flex;
          gap: 16px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .legend-dot.free { background: transparent; border: 1.5px solid var(--border-color); }
        .legend-dot.busy { background: #fff5f5; border: 1.5px solid #f5c2c2; }
        .legend-dot.active { background: rgba(234, 106, 18, 0.08); border: 1.5px solid var(--primary-orange); }

        .confirm-table-btn {
          width: 100%;
          margin-top: 20px;
          padding: 13px;
          border-radius: var(--radius-sm);
          border: none;
          background: var(--primary-orange);
          color: #ffffff;
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .confirm-table-btn:hover {
          background: var(--primary-hover);
        }

        .confirm-table-btn:disabled {
          background: #e9ecef;
          color: var(--text-muted);
          cursor: not-allowed;
          border: 1px solid var(--border-color);
        }

        /* Order FAB */
        .order-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          background: var(--primary-orange);
          color: #ffffff;
          border: none;
          border-radius: 50px;
          padding: 14px 22px;
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 28px rgba(234, 106, 18, 0.3);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 50;
          transition: background 0.2s, transform 0.2s;
          outline: none;
        }

        .order-fab:hover {
          background: var(--primary-hover);
        }

        .order-fab.hidden { display: none; }
        .order-fab .fab-badge {
          background: #ffffff;
          color: var(--primary-orange);
          border-radius: 50%;
          width: 22px;
          height: 22px;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Drawer Overlay */
        .drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 55;
          display: none;
        }

        .drawer-backdrop.open { display: block; }

        .order-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 380px;
          background: var(--card-white);
          box-shadow: -8px 0 40px rgba(0,0,0,0.08);
          z-index: 60;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(.4, 0, .2, 1);
          border-left: 1px solid var(--border-color);
        }

        .order-drawer.open { transform: translateX(0); }

        .drawer-header {
          padding: 16px 18px 12px;
          border-bottom: 1.5px solid var(--border-color);
          flex-shrink: 0;
        }

        .drawer-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .drawer-title {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-deep);
        }

        .drawer-close {
          background: #f8f9fa;
          border: 1px solid var(--border-color);
          border-radius: 50%;
          width: 34px;
          height: 34px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: var(--transition);
        }

        .drawer-close:hover {
          background: #e9ecef;
          color: var(--text-deep);
        }

        .drawer-table-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8f9fa;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
        }

        .dts-left { display: flex; align-items: center; gap: 8px; }
        .dts-icon { font-size: 20px; color: var(--primary-orange); }
        .dts-table { font-size: 14px; font-weight: 700; color: var(--text-deep); }
        .dts-pax { font-size: 11px; color: var(--text-muted); }

        .dts-change {
          font-size: 12px;
          font-weight: 600;
          color: var(--primary-orange);
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
          background: none;
          border: none;
          font-family: 'Poppins', sans-serif;
        }

        .no-table-warn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fffdf9;
          border: 1px solid var(--primary-orange);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 13px;
          color: var(--primary-orange);
          font-weight: 500;
        }

        .drawer-items {
          flex: 1;
          overflow-y: auto;
          padding: 12px 16px;
        }

        .empty-order {
          text-align: center;
          padding: 40px 10px;
          color: var(--text-muted);
        }

        .empty-order .eo-icon { font-size: 40px; margin-bottom: 10px; color: var(--text-muted); }

        .order-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8f9fa;
          border-radius: var(--radius-sm);
          padding: 9px 11px;
          margin-bottom: 8px;
          border: 1px solid var(--border-color);
        }

        .oi-emoji { font-size: 26px; flex-shrink: 0; }
        .oi-info { flex: 1; min-width: 0; }
        .oi-name { font-weight: 700; font-size: 13px; color: var(--text-deep); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .oi-price { font-size: 11px; color: var(--text-muted); }
        .oi-qty { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .qty-btn {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px solid var(--primary-orange);
          background: #ffffff;
          color: var(--primary-orange);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.13s;
          line-height: 1;
        }

        .qty-btn:hover { background: var(--primary-orange); color: #ffffff; }
        .qty-num { font-weight: 700; font-size: 14px; min-width: 18px; text-align: center; }
        .oi-total { font-weight: 700; font-size: 13px; color: var(--text-deep); min-width: 60px; text-align: right; flex-shrink: 0; }

        .drawer-footer {
          padding: 14px 16px;
          border-top: 1.5px solid var(--border-color);
          flex-shrink: 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .summary-row.total-row {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-deep);
          margin-top: 6px;
          padding-top: 8px;
          border-top: 1.5px dashed var(--border-color);
        }

        .send-order-btn {
          width: 100%;
          margin-top: 14px;
          padding: 13px;
          border-radius: var(--radius-sm);
          border: none;
          background: var(--primary-orange);
          color: #ffffff;
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .send-order-btn:hover { background: var(--primary-hover); }
        .send-order-btn:disabled { background: #e9ecef; color: var(--text-muted); cursor: not-allowed; border: 1px solid var(--border-color); }

        .toast {
          position: fixed;
          bottom: 90px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: #34363a;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.3s, transform 0.3s;
          pointer-events: none;
          z-index: 200;
          white-space: nowrap;
        }

        .toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .no-results {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
          font-size: 15px;
        }

        .no-results .nr-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        @media (max-width: 768px) {
          .main-layout { flex-direction: column; }
          .sidebar { display: none !important; }
          .cat-nav { display: flex !important; }
          .topbar .logo-wrap { display: flex !important; }
        }

        @media (min-width: 769px) {
          .cat-nav { display: none !important; }
          .topbar .logo-wrap { display: none !important; }
          .topbar { padding-left: 24px; }
        }
      ` }} />

      {/* TOPBAR */}
      <div className="topbar">
        <div className="logo-wrap">
          <div className="logo-icon">
            <i className="ti ti-flame"></i>
          </div>
          <div className="logo-name">Sizzling Grill</div>
        </div>

        {/* Table chip */}
        <button 
          className={`table-chip ${selectedTable ? 'selected' : ''}`} 
          onClick={openTableModal}
        >
          <span className="tc-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <i className="ti ti-armchair"></i>
          </span>
          <span>{selectedTable ? `Table ${selectedTable.id}` : 'Select Table'}</span>
        </button>

        <div className="topbar-right">
          <span className="waiter-badge">
            <i className="ti ti-user"></i> Waiter Dashboard
          </span>
          
          {/* Dashboard Exit Link */}
          <button 
            onClick={() => {
              if (user.role === 'Admin') router.push('/masterlist');
              else if (user.role === 'Manager') router.push('/reports');
              else router.push('/order');
            }}
            className="report-action-btn"
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 'bold',
            }}
          >
            Dashboard
          </button>
          
          <div className="user-avatar">
            <i className="ti ti-user-circle" style={{ color: 'var(--primary-orange)', fontSize: '20px' }}></i>
          </div>
        </div>
      </div>

      {/* Search and Mobile categories Nav */}
      <div className="cat-nav">
        <button 
          className={`cat-pill ${currentCategory === 'all' ? 'active' : ''}`} 
          onClick={() => setCurrentCategory('all')}
        >
          <span className="pill-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <i className="ti ti-tools-kitchen-2"></i>
          </span> All Menu
        </button>
        {Object.entries(categories).map(([key, catObj]) => (
          <button 
            key={key} 
            className={`cat-pill ${currentCategory === key ? 'active' : ''}`}
            onClick={() => setCurrentCategory(key)}
          >
            <span className="pill-icon">{catObj.icon || '🍽️'}</span> {catObj.label}
          </button>
        ))}
      </div>

      {/* MAIN LAYOUT (Desktop sidebar + content) */}
      <div className="main-layout">
        <aside className="sidebar">
          <div className="logo-area">
            <div className="logo-icon">
              <i className="ti ti-flame" style={{ color: 'var(--primary-orange)', fontSize: '22px' }}></i>
            </div>
            <div className="logo-name">Sizzling Grill</div>
          </div>
          <div className="cat-list">
            <button 
              className={`cat-btn ${currentCategory === 'all' ? 'active' : ''}`}
              onClick={() => setCurrentCategory('all')}
            >
              <span className="cat-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <i className="ti ti-tools-kitchen-2"></i>
              </span>
              <span className="cat-name">All Menu</span>
            </button>
            {Object.entries(categories).map(([key, catObj]) => (
              <button 
                key={key} 
                className={`cat-btn ${currentCategory === key ? 'active' : ''}`}
                onClick={() => setCurrentCategory(key)}
              >
                <span className="cat-icon">{catObj.icon || '🍽️'}</span>
                <span className="cat-name">{catObj.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* CONTENT */}
        <div className="content">
          {menuLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', color: 'var(--text-deep)' }}>Loading menu...</div>
          ) : sectionsToRender.length === 0 ? (
            <div className="no-results">
              <div className="nr-icon">
                <i className="ti ti-search" style={{ fontSize: '32px', color: 'var(--text-muted)' }}></i>
              </div>
              No products found.
            </div>
          ) : (
            sectionsToRender.map(({ sec, items }) => (
              <div key={sec} className="h-scroll-section">
                <div className="section-label">{sec}</div>
                <div className="h-scroll-row">
                  {items.map(p => {
                    const isUnavailable = p.status === 'unavailable' || p.stock <= 0;
                    return (
                      <div 
                        key={p.id} 
                        className={`product-card ${isUnavailable ? 'unavailable' : ''}`} 
                        onClick={() => !isUnavailable && addToOrder(p.id)}
                      >
                        <div className="product-img">
                          {p.image ? (
                            <img src={`/${p.image}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            p.emoji
                          )}
                        </div>
                        <div className="product-info">
                          <div className="product-name">{p.name}</div>
                          <div className={`product-status ${isUnavailable ? 'unavail' : ''}`}>
                            {isUnavailable ? 'Not Available' : 'Available'}
                          </div>
                          <div className="product-sold">{p.stock} In Stock</div>
                          <div className="product-footer">
                            <div className="product-price">₱{p.price.toFixed(2)}</div>
                            <button 
                              className="add-btn" 
                              disabled={isUnavailable}
                              onClick={(e) => {
                                e.stopPropagation();
                                addToOrder(p.id);
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB (Floating Action Button) */}
      <button 
        className={`order-fab ${totalItems === 0 ? 'hidden' : ''}`} 
        onClick={() => setDrawerOpen(true)}
      >
        <i className="ti ti-shopping-cart"></i> View Order <span className="fab-badge">{totalItems}</span>
      </button>

      {/* TABLE PICKER MODAL */}
      <div className={`modal-overlay ${tableModalOpen ? 'open' : ''}`}>
        <div className="table-modal">
          <div className="modal-header">
            <div className="modal-title">
              <i className="ti ti-armchair" style={{ color: 'var(--primary-orange)' }}></i> Select Table
            </div>
            <button className="modal-close" onClick={() => setTableModalOpen(false)}>✕</button>
          </div>
          <div className="modal-sub">Tap a table to assign this order. Red = occupied.</div>

          {Object.entries(TABLES_DATA).map(([zoneKey, tables]) => (
            <div key={zoneKey}>
              <div className="zone-label">
                {zoneKey === 'indoor' ? 'Indoor — Main Floor' : zoneKey === 'window' ? 'Indoor — Window Side' : 'Outdoor — Terrace'}
              </div>
              <div className="table-grid">
                {tables.map(t => {
                  const isSelected = pendingTableId === t.id;
                  const cls = t.occupied ? 'occupied' : (isSelected ? 'selected' : '');
                  return (
                    <button 
                      key={t.id} 
                      className={`table-btn ${cls}`} 
                      onClick={() => !t.occupied && setPendingTableId(t.id)}
                      title={`Table ${t.id} · ${t.pax} pax`}
                    >
                      {t.occupied && <div className="occ-dot"></div>}
                      <span className="tb-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <i className="ti ti-armchair"></i>
                      </span>
                      <span className="tb-num">T-{t.id}</span>
                      <span className="tb-pax">{t.pax} pax</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="legend">
            <div className="legend-item">
              <div className="legend-dot free"></div> Available
            </div>
            <div className="legend-item">
              <div className="legend-dot busy"></div> Occupied
            </div>
            <div className="legend-item">
              <div className="legend-dot active"></div> Selected
            </div>
          </div>

          <button 
            className="confirm-table-btn" 
            onClick={confirmTable} 
            disabled={pendingTableId === null}
          >
            Confirm Table
          </button>
        </div>
      </div>

      {/* DRAWER BACKDROP */}
      <div className={`drawer-backdrop ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)}></div>

      {/* ORDER DRAWER */}
      <div className={`order-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-header-top">
            <div className="drawer-title">Current Order</div>
            <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
          </div>
          
          {selectedTable ? (
            <div className="drawer-table-strip">
              <div className="dts-left">
                <div className="dts-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <i className="ti ti-armchair"></i>
                </div>
                <div className="dts-info">
                  <div className="dts-table">Table {selectedTable.id}</div>
                  <div className="dts-pax">{zoneLabels[selectedTable.zone]} · {selectedTable.pax} pax</div>
                </div>
              </div>
              <button 
                className="dts-change" 
                onClick={() => {
                  setDrawerOpen(false);
                  openTableModal();
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="no-table-warn">
              <span>⚠️ No table selected</span> —{' '}
              <button 
                className="dts-change" 
                onClick={() => {
                  setDrawerOpen(false);
                  openTableModal();
                }}
              >
                Pick a table
              </button>
            </div>
          )}
        </div>

        <div className="drawer-items">
          {order.length === 0 ? (
            <div className="empty-order">
              <div className="eo-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <i className="ti ti-clipboard-list" style={{ fontSize: '40px' }}></i>
              </div>
              <p>No items yet.<br />Tap a product to add.</p>
            </div>
          ) : (
            order.map(item => (
              <div key={item.id} className="order-item">
                <div className="oi-emoji">{item.emoji || '🍽️'}</div>
                <div className="oi-info">
                  <div className="oi-name">{item.name}</div>
                  <div className="oi-price">₱{item.price.toFixed(2)} each</div>
                </div>
                <div className="oi-qty">
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                  <span className="qty-num">{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <div className="oi-total">₱{(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))
          )}
        </div>

        <div className="drawer-footer">
          <div className="summary-row">
            <span>Items</span>
            <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₱{orderSubtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row total-row">
            <span>TOTAL</span>
            <span>₱{orderSubtotal.toFixed(2)}</span>
          </div>
          
          <button 
            className="send-order-btn" 
            onClick={sendOrder} 
            disabled={order.length === 0 || !selectedTable || sendingOrder}
          >
            {sendingOrder ? 'Sending Order...' : 'Send Order to Kitchen'}
          </button>
        </div>
      </div>

      {/* TOAST MESSAGE */}
      <div className={`toast ${toastShow ? 'show' : ''}`}>
        {toastText}
      </div>
    </>
  );
}
