import { useState, useEffect, useCallback } from 'react';
import { getServerUrl, setServerUrl } from './config';
import './waiter.css';

// ─── Types ───────────────────────────────────────────────────────────────────
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
  sections: { [sectionName: string]: MenuItem[] };
}
interface CartItem extends MenuItem { qty: number; }
interface User { userId: string; name: string; role: string; }

const TABLES_DATA: { [key: string]: { id: number; pax: number; occupied: boolean }[] } = {
  indoor: [
    { id: 1, pax: 2, occupied: false }, { id: 2, pax: 2, occupied: false },
    { id: 3, pax: 4, occupied: false }, { id: 4, pax: 4, occupied: false },
    { id: 5, pax: 4, occupied: false }, { id: 6, pax: 6, occupied: false },
    { id: 7, pax: 6, occupied: false }, { id: 8, pax: 2, occupied: false },
    { id: 9, pax: 2, occupied: false }, { id: 10, pax: 4, occupied: false },
  ],
  window: [
    { id: 11, pax: 2, occupied: false }, { id: 12, pax: 2, occupied: false },
    { id: 13, pax: 2, occupied: false }, { id: 14, pax: 4, occupied: false },
    { id: 15, pax: 4, occupied: false },
  ],
  terrace: [
    { id: 16, pax: 4, occupied: false }, { id: 17, pax: 4, occupied: false },
    { id: 18, pax: 6, occupied: false }, { id: 19, pax: 6, occupied: false },
    { id: 20, pax: 2, occupied: false },
  ],
};

const ZONE_LABELS: { [k: string]: string } = {
  indoor: 'Indoor · Main Floor',
  window: 'Indoor · Window Side',
  terrace: 'Outdoor · Terrace',
};

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrlState] = useState(getServerUrl());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('sg_user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Cannot reach server. Check your server URL in Settings.');
    } finally {
      setLoading(false);
    }
  };

  const saveServerUrl = () => {
    setServerUrl(serverUrl.trim());
    setShowSettings(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <i className="ti ti-flame login-logo-icon"></i>
          <h1 className="login-brand">Sizzling Grill</h1>
          <p className="login-sub">Waiter App</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error">{error}</div>}
          <div className="login-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button className="login-settings-btn" onClick={() => setShowSettings(v => !v)}>
          <i className="ti ti-settings"></i> Server Settings
        </button>

        {showSettings && (
          <div className="login-settings-panel">
            <label>Server URL</label>
            <input
              type="text"
              value={serverUrl}
              onChange={e => setServerUrlState(e.target.value)}
              placeholder="http://192.168.x.x:3000"
            />
            <button onClick={saveServerUrl} className="login-save-btn">Save</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Waiter App ───────────────────────────────────────────────────────────────
function WaiterApp({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [categories, setCategories] = useState<{ [k: string]: CategoryGroup }>({});
  const [menuLoading, setMenuLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<{ id: number; pax: number; zone: string } | null>(null);
  const [pendingTableId, setPendingTableId] = useState<number | null>(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const [toastShow, setToastShow] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      setMenuLoading(true);
      const base = getServerUrl();
      const res = await fetch(`${base}/api/menu`);
      if (res.ok) setCategories(await res.json());
    } catch { /* ignore */ } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const showToast = (msg: string) => {
    setToastText(msg);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 2600);
  };

  // ── Cart helpers ──
  const findProduct = (id: string): MenuItem | null => {
    for (const cat of Object.values(categories)) {
      if (!cat?.sections) continue;
      for (const items of Object.values(cat.sections))
        for (const p of items) if (String(p.id) === String(id)) return p;
    }
    return null;
  };

  const addToOrder = (id: string) => {
    const p = findProduct(id);
    if (!p) return;
    if (p.status === 'unavailable' || p.stock <= 0) { showToast(`⚠️ ${p.name} is out of stock`); return; }
    setOrder(prev => {
      const existing = prev.find(i => String(i.id) === String(id));
      if (existing) {
        if (existing.qty >= p.stock) { showToast('⚠️ Maximum stock reached'); return prev; }
        showToast(`${p.name} added`);
        return prev.map(i => String(i.id) === String(id) ? { ...i, qty: i.qty + 1 } : i);
      }
      showToast(`${p.name} added`);
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setOrder(prev => {
      const existing = prev.find(i => String(i.id) === String(id));
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) return prev.filter(i => String(i.id) !== String(id));
      if (delta > 0 && newQty > existing.stock) { showToast('⚠️ Maximum stock reached'); return prev; }
      return prev.map(i => String(i.id) === String(id) ? { ...i, qty: newQty } : i);
    });
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
    if (table) { setSelectedTable(table); setTableModalOpen(false); showToast(`Table ${table.id} selected`); }
  };

  const sendOrder = async () => {
    if (!order.length || !selectedTable) return;
    setSending(true);
    const orderNo = 'T' + selectedTable.id + '-' + (Math.floor(Math.random() * 9000) + 1000);
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/kitchen/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderNo,
          tableNumber: selectedTable.id.toString(),
          items: order.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        }),
      });
      if (res.ok) {
        showToast(`Order sent! Table ${selectedTable.id} · ${order.reduce((s, i) => s + i.qty, 0)} items → Kitchen`);
        setOrder([]); setSelectedTable(null); setDrawerOpen(false);
      } else {
        showToast('❌ Failed to send order');
      }
    } catch {
      showToast('❌ Network error');
    } finally {
      setSending(false);
    }
  };

  // ── Filter ──
  const getFilteredSections = () => {
    let sections: { sec: string; items: MenuItem[]; catKey: string }[] = [];
    if (currentCategory === 'all') {
      for (const [catKey, catObj] of Object.entries(categories)) {
        if (!catObj?.sections) continue;
        for (const [sec, items] of Object.entries(catObj.sections)) sections.push({ sec, items, catKey });
      }
    } else {
      const catObj = categories[currentCategory];
      if (catObj?.sections)
        for (const [sec, items] of Object.entries(catObj.sections)) sections.push({ sec, items, catKey: currentCategory });
    }
    if (searchQuery)
      sections = sections
        .map(s => ({ ...s, items: s.items.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) }))
        .filter(s => s.items.length > 0);
    return sections;
  };

  const sections = getFilteredSections();
  const totalItems = order.reduce((s, i) => s + i.qty, 0);
  const subtotal = order.reduce((s, i) => s + i.price * i.qty, 0);
  const base = getServerUrl();

  return (
    <div className="app-root">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="logo-wrap">
          <i className="ti ti-flame logo-icon"></i>
          <span className="logo-name">Sizzling Grill</span>
        </div>
        <button className={`table-chip ${selectedTable ? 'selected' : ''}`} onClick={() => { setPendingTableId(selectedTable?.id ?? null); setTableModalOpen(true); }}>
          <i className="ti ti-armchair"></i>
          {selectedTable ? `Table ${selectedTable.id}` : 'Select Table'}
        </button>
        <div className="topbar-right">
          <span className="waiter-badge"><i className="ti ti-user"></i> {user.name}</span>
          <button className="logout-btn" onClick={onLogout}><i className="ti ti-logout"></i></button>
        </div>
      </div>

      {/* MOBILE CATEGORY NAV */}
      <div className="cat-nav">
        <input className="search-input" type="text" placeholder="Search menu…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <button className={`cat-pill ${currentCategory === 'all' ? 'active' : ''}`} onClick={() => setCurrentCategory('all')}>
          <i className="ti ti-tools-kitchen-2"></i> All
        </button>
        {Object.entries(categories).map(([key, catObj]) => (
          <button key={key} className={`cat-pill ${currentCategory === key ? 'active' : ''}`} onClick={() => setCurrentCategory(key)}>
            <span>{catObj.icon}</span> {catObj.label}
          </button>
        ))}
      </div>

      {/* MAIN LAYOUT */}
      <div className="main-layout">
        {/* Desktop sidebar */}
        <aside className="sidebar">
          <div className="cat-list">
            <button className={`cat-btn ${currentCategory === 'all' ? 'active' : ''}`} onClick={() => setCurrentCategory('all')}>
              <i className="ti ti-tools-kitchen-2"></i> <span>All Menu</span>
            </button>
            {Object.entries(categories).map(([key, catObj]) => (
              <button key={key} className={`cat-btn ${currentCategory === key ? 'active' : ''}`} onClick={() => setCurrentCategory(key)}>
                <span>{catObj.icon}</span> <span>{catObj.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="content">
          {menuLoading ? (
            <div className="loading-state">Loading menu…</div>
          ) : sections.length === 0 ? (
            <div className="no-results"><i className="ti ti-search"></i><p>No products found.</p></div>
          ) : (
            sections.map(({ sec, items }) => (
              <div key={sec} className="h-scroll-section">
                <div className="section-label">{sec}</div>
                <div className="h-scroll-row">
                  {items.map(p => {
                    const unavail = p.status === 'unavailable' || p.stock <= 0;
                    return (
                      <div key={p.id} className={`product-card ${unavail ? 'unavailable' : ''}`} onClick={() => !unavail && addToOrder(p.id)}>
                        <div className="product-img">
                          {p.image
                            ? <img src={`${base}/${p.image}`} alt={p.name} />
                            : <span>{p.emoji}</span>}
                        </div>
                        <div className="product-info">
                          <div className="product-name">{p.name}</div>
                          <div className={`product-status ${unavail ? 'unavail' : ''}`}>{unavail ? 'Not Available' : 'Available'}</div>
                          <div className="product-sold">{p.stock} in stock</div>
                          <div className="product-footer">
                            <div className="product-price">₱{p.price.toFixed(2)}</div>
                            <button className="add-btn" disabled={unavail} onClick={e => { e.stopPropagation(); addToOrder(p.id); }}>Add</button>
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

      {/* FAB */}
      {totalItems > 0 && (
        <button className="order-fab" onClick={() => setDrawerOpen(true)}>
          <i className="ti ti-shopping-cart"></i> View Order <span className="fab-badge">{totalItems}</span>
        </button>
      )}

      {/* TABLE MODAL */}
      {tableModalOpen && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setTableModalOpen(false)}>
          <div className="table-modal">
            <div className="modal-header">
              <div className="modal-title"><i className="ti ti-armchair"></i> Select Table</div>
              <button className="modal-close" onClick={() => setTableModalOpen(false)}>✕</button>
            </div>
            <div className="modal-sub">Tap a table to assign this order.</div>
            {Object.entries(TABLES_DATA).map(([zoneKey, tables]) => (
              <div key={zoneKey}>
                <div className="zone-label">{zoneKey === 'indoor' ? 'Indoor — Main Floor' : zoneKey === 'window' ? 'Indoor — Window Side' : 'Outdoor — Terrace'}</div>
                <div className="table-grid">
                  {tables.map(t => {
                    const cls = t.occupied ? 'occupied' : pendingTableId === t.id ? 'selected' : '';
                    return (
                      <button key={t.id} className={`table-btn ${cls}`} onClick={() => !t.occupied && setPendingTableId(t.id)}>
                        {t.occupied && <div className="occ-dot"></div>}
                        <i className="ti ti-armchair tb-icon"></i>
                        <span className="tb-num">T-{t.id}</span>
                        <span className="tb-pax">{t.pax} pax</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="legend">
              <div className="legend-item"><div className="legend-dot free"></div> Available</div>
              <div className="legend-item"><div className="legend-dot busy"></div> Occupied</div>
              <div className="legend-item"><div className="legend-dot active"></div> Selected</div>
            </div>
            <button className="confirm-table-btn" onClick={confirmTable} disabled={!pendingTableId}>Confirm Table</button>
          </div>
        </div>
      )}

      {/* ORDER DRAWER */}
      <div className={`drawer-backdrop ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)}></div>
      <div className={`order-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-header-top">
            <div className="drawer-title">Current Order</div>
            <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
          </div>
          {selectedTable ? (
            <div className="drawer-table-strip">
              <div className="dts-left">
                <i className="ti ti-armchair dts-icon"></i>
                <div><div className="dts-table">Table {selectedTable.id}</div><div className="dts-pax">{ZONE_LABELS[selectedTable.zone]} · {selectedTable.pax} pax</div></div>
              </div>
              <button className="dts-change" onClick={() => { setDrawerOpen(false); setPendingTableId(selectedTable.id); setTableModalOpen(true); }}>Change</button>
            </div>
          ) : (
            <div className="no-table-warn">
              ⚠️ No table selected —{' '}
              <button className="dts-change" onClick={() => { setDrawerOpen(false); setTableModalOpen(true); }}>Pick a table</button>
            </div>
          )}
        </div>
        <div className="drawer-items">
          {order.length === 0 ? (
            <div className="empty-order"><i className="ti ti-clipboard-list eo-icon"></i><p>No items yet.<br />Tap a product to add.</p></div>
          ) : order.map(item => (
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
          ))}
        </div>
        <div className="drawer-footer">
          <div className="summary-row"><span>Items</span><span>{totalItems}</span></div>
          <div className="summary-row"><span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span></div>
          <div className="summary-row total-row"><span>TOTAL</span><span>₱{subtotal.toFixed(2)}</span></div>
          <button className="send-order-btn" onClick={sendOrder} disabled={!order.length || !selectedTable || sending}>
            {sending ? 'Sending…' : 'Send Order to Kitchen'}
          </button>
        </div>
      </div>

      {/* TOAST */}
      <div className={`toast ${toastShow ? 'show' : ''}`}>{toastText}</div>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('sg_user') || 'null'); } catch { return null; }
  });

  const handleLogin = (u: User) => setUser(u);
  const handleLogout = () => { localStorage.removeItem('sg_user'); setUser(null); };

  return user ? <WaiterApp user={user} onLogout={handleLogout} /> : <LoginScreen onLogin={handleLogin} />;
}
