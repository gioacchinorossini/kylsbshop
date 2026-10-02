'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { orderStyles } from './order-styles';
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

interface Transaction {
  items: CartItem[];
  total: number;
  cash: number | null;
  change: number | null;
  refCode: string | null;
  orderType: string;
  paymentMethod: string;
  date: Date;
  orderNo: number;
}

export default function OrderPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Menu State
  const [categories, setCategories] = useState<{ [category: string]: CategoryGroup }>({});
  const [menuLoading, setMenuLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHistory, setCartHistory] = useState<CartItem[][]>([]);
  const [orderType, setOrderType] = useState('dinein');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashInput, setCashInput] = useState('');
  const [refInput, setRefInput] = useState('');

  // Discount
  const [discountType, setDiscountType] = useState<'none' | 'senior_pwd'>('none');

  // Receipt Modal
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Mobile drawer states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileBillingOpen, setMobileBillingOpen] = useState(false);

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
      console.error('Failed to load menu:', err);
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchMenu();
    }
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-deep)', color: 'var(--primary)' }}>
        <h3>Loading session...</h3>
      </div>
    );
  }

  // Cart History Save for Undo
  const saveHistory = (currentCart: CartItem[]) => {
    setCartHistory((prev) => [...prev, [...currentCart.map((item) => ({ ...item }))]].slice(-20)); // Limit to last 20 states
  };

  const handleUndo = () => {
    if (cartHistory.length > 0) {
      const prevCart = cartHistory[cartHistory.length - 1];
      setCart(prevCart);
      setCartHistory((prev) => prev.slice(0, -1));
    }
  };

  // Find product by ID
  const findProductInMenu = (id: string): MenuItem | null => {
    for (const cat of Object.values(categories)) {
      for (const items of Object.values(cat.sections)) {
        const found = items.find((p) => String(p.id) === String(id));
        if (found) return found;
      }
    }
    return null;
  };

  const addToCart = (id: string) => {
    const item = findProductInMenu(id);
    if (!item || item.status === 'unavailable') return;

    saveHistory(cart);

    setCart((prevCart) => {
      const existing = prevCart.find((c) => c.id === id);
      if (existing) {
        // Limit additions to available stock
        if (existing.qty >= item.stock) {
          alert(`Cannot add more. Only ${item.stock} items in stock.`);
          return prevCart;
        }
        return prevCart.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c));
      } else {
        return [...prevCart, { ...item, qty: 1 }];
      }
    });
  };

  const updateQty = (id: string, delta: number) => {
    const item = findProductInMenu(id);
    if (!item) return;

    saveHistory(cart);

    setCart((prevCart) => {
      return prevCart
        .map((c) => {
          if (c.id === id) {
            const nextQty = c.qty + delta;
            if (nextQty > item.stock) {
              alert(`Cannot add more. Only ${item.stock} items in stock.`);
              return c;
            }
            return { ...c, qty: nextQty };
          }
          return c;
        })
        .filter((c) => c.qty > 0);
    });
  };

  // Reset bill
  const handleResetBill = () => {
    if (cart.length > 0 && confirm('Are you sure you want to reset the current order?')) {
      saveHistory(cart);
      setCart([]);
      setCashInput('');
      setRefInput('');
    }
  };

  // Calculations
  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.qty, 0);
  };

  const getDiscount = () => {
    const subtotal = getSubtotal();
    if (discountType === 'senior_pwd') {
      return subtotal * 0.2; // 20% discount
    }
    return 0;
  };

  const getTotal = () => {
    return getSubtotal() - getDiscount();
  };

  const getChange = () => {
    const total = getTotal();
    const cash = parseFloat(cashInput) || 0;
    return cash - total;
  };

  // Transaction processing
  const handleCheckout = async () => {
    const total = getTotal();
    const cashVal = paymentMethod === 'cash' ? (parseFloat(cashInput) || 0) : total;
    const changeVal = paymentMethod === 'cash' ? cashVal - total : 0;
    const refCodeVal = paymentMethod !== 'cash' ? refInput.trim() : null;

    if (paymentMethod === 'cash' && cashVal < total) {
      alert('Insufficient cash payment.');
      return;
    }
    if (paymentMethod !== 'cash' && !refCodeVal) {
      alert('Please enter reference number.');
      return;
    }

    const transaction: Transaction = {
      items: [...cart],
      total,
      cash: paymentMethod === 'cash' ? cashVal : null,
      change: paymentMethod === 'cash' ? changeVal : null,
      refCode: refCodeVal,
      orderType,
      paymentMethod,
      date: new Date(),
      orderNo: Math.floor(Math.random() * 9000) + 1000
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      const result = await response.json();

      if (result.success) {
        setLastTransaction(transaction);
        setShowReceipt(true);
      } else {
        alert(result.message || 'Failed to save order to database.');
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      alert('An error occurred while saving the transaction.');
    }
  };

  const closeReceiptModal = () => {
    setShowReceipt(false);
    setLastTransaction(null);
    setCart([]);
    setCashInput('');
    setRefInput('');
    setDiscountType('none');
    setCartHistory([]);
    fetchMenu(); // Refresh stock counts in UI
  };

  const handlePrint = () => {
    window.print();
  };

  // Is checkout button disabled?
  const isCheckoutDisabled = () => {
    if (cart.length === 0) return true;
    const total = getTotal();
    if (paymentMethod === 'cash') {
      const cash = parseFloat(cashInput) || 0;
      return cash < total;
    } else {
      return !refInput.trim();
    }
  };

  return (
    <div className="pos-body-wrapper">
      <style dangerouslySetInnerHTML={{ __html: orderStyles }} />

      {/* Topbar */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            aria-label="Toggle categories"
          >
            <i className="ti ti-menu-2"></i>
          </button>
          
          <h2 style={{ margin: 0, fontFamily: "'Poppins', sans-serif", color: 'var(--primary)', fontSize: '22px' }}>
            Sizzling Grill POS
          </h2>
        </div>

        <div className="page-search" style={{ maxWidth: '300px' }}>
          <i className="ti ti-search page-search-icon"></i>
          <input 
            type="text" 
            placeholder="Search items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="page-search-input"
          />
        </div>

        <div className="user-info">
          {user.role === 'Admin' && (
            <button className="add-btn" onClick={() => router.push('/masterlist')}>
              Admin
            </button>
          )}
          {user.role === 'Manager' && (
            <button className="add-btn" onClick={() => router.push('/reports')}>
              Reports
            </button>
          )}
          <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
          <span>{user.name}</span>
          <button 
            onClick={logout} 
            style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '18px', marginLeft: '10px' }}
            title="Logout"
          >
            <i className="ti ti-logout"></i>
          </button>

          <button 
            className="mobile-menu-toggle"
            style={{ display: 'none', marginLeft: '10px' }} // Controlled by CSS on mobile
            id="billingPanelToggleBtn"
            onClick={() => setMobileBillingOpen(!mobileBillingOpen)}
          >
            <i className="ti ti-shopping-cart"></i>
             <span style={{ fontSize: '12px', background: 'var(--primary)', color: '#fff', borderRadius: '50%', padding: '2px 6px', position: 'absolute', top: '5px', right: '5px' }}>
              {cart.reduce((a, c) => a + c.qty, 0)}
            </span>
          </button>
        </div>
      </header>

      <div className="main-layout">
        {/* Sidebar Categories */}
        <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
          <div className="logo-area">
            <span className="logo-icon">🔥</span>
            <span className="logo-name">Categories</span>
          </div>

          <button 
            className={`cat-btn ${currentCategory === 'all' ? 'active' : ''}`}
            onClick={() => {
              setCurrentCategory('all');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="cat-icon">🍽️</span> All Menu
          </button>

          {Object.entries(categories).map(([key, cat]) => (
            <button 
              key={key}
              className={`cat-btn ${currentCategory === key ? 'active' : ''}`}
              onClick={() => {
                setCurrentCategory(key);
                setMobileSidebarOpen(false);
              }}
            >
              <span className="cat-icon">{cat.icon}</span> {cat.label}
            </button>
          ))}
        </aside>

        {/* Menu Grid */}
        <section className="menu-area">
          {menuLoading ? (
             <div style={{ textAlign: 'center', padding: '50px', color: 'var(--primary)' }}>
              <i className="ti ti-loader" style={{ fontSize: '48px', animation: 'spin 1s linear infinite', display: 'block', marginBottom: '15px' }}></i>
              Loading Menu Items...
            </div>
          ) : (
            <div>
              {currentCategory === 'all' ? (
                <div>
                  <div className="menu-header">
                    <span className="menu-icon">🍽️</span>
                    <h1>ALL MENU</h1>
                  </div>
                  {Object.entries(categories).map(([catKey, catObj]) => (
                    <div key={catKey} className="section">
                      <div className="section-header">
                        <div className="section-title">{catObj.label}</div>
                      </div>
                      <div className="products-grid">
                        {Object.values(catObj.sections).flatMap(items => items)
                          .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(p => {
                            const isUnavail = p.status === 'unavailable' || p.stock <= 0;
                            return (
                              <div key={p.id} className="product-card">
                                <div className="product-img">
                                  {p.image ? <img src={`/${p.image}`} alt={p.name} onError={(e) => { (e.target as HTMLImageElement).src = '/assets/finallogo.png'; }} /> : p.emoji}
                                </div>
                                <div className="product-info">
                                  <div className="product-name">{p.name}</div>
                                  <div className={`product-status ${isUnavail ? 'unavailable' : ''}`}>
                                    {isUnavail ? 'Out of Stock' : 'Available'}
                                  </div>
                                  <div className="product-sold">{p.stock} In Stock</div>
                                  <div className="product-footer">
                                    <div className="product-price">₱{p.price.toFixed(2)}</div>
                                    <button 
                                      className="add-btn" 
                                      disabled={isUnavail} 
                                      onClick={() => addToCart(p.id)}
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                categories[currentCategory] && (
                  <div className="section">
                    <div className="menu-header">
                      <span className="menu-icon">{categories[currentCategory].icon}</span>
                      <h1>{categories[currentCategory].label.toUpperCase()}</h1>
                    </div>
                    <div className="products-grid">
                      {Object.values(categories[currentCategory].sections).flatMap(items => items)
                        .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(p => {
                          const isUnavail = p.status === 'unavailable' || p.stock <= 0;
                          return (
                            <div key={p.id} className="product-card">
                              <div className="product-img">
                                {p.image ? <img src={`/${p.image}`} alt={p.name} onError={(e) => { (e.target as HTMLImageElement).src = '/assets/finallogo.png'; }} /> : p.emoji}
                              </div>
                              <div className="product-info">
                                <div className="product-name">{p.name}</div>
                                <div className={`product-status ${isUnavail ? 'unavailable' : ''}`}>
                                  {isUnavail ? 'Out of Stock' : 'Available'}
                                </div>
                                <div className="product-sold">{p.stock} In Stock</div>
                                <div className="product-footer">
                                  <div className="product-price">₱{p.price.toFixed(2)}</div>
                                  <button 
                                    className="add-btn" 
                                    disabled={isUnavail} 
                                    onClick={() => addToCart(p.id)}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* Billing Panel */}
        <section className={`billing-panel ${mobileBillingOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 className="billing-title" style={{ margin: 0 }}>Current Order</h2>
            {cartHistory.length > 0 && (
              <button 
                onClick={handleUndo}
                 style={{ padding: '6px 12px', background: '#333', border: 'none', color: 'var(--primary)', cursor: 'pointer', borderRadius: '5px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <i className="ti ti-arrow-back-up"></i> Undo
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="cart-items" id="cartItems">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="ec-icon">🛒</div>
                <p>No items yet.<br />Add from the menu!</p>
              </div>
            ) : (
              cart.map(item => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-img">
                    {item.image ? <img src={`/${item.image}`} alt={item.name} onError={(e) => { (e.target as HTMLImageElement).src = '/assets/finallogo.png'; }} /> : item.emoji}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-cat">{item.id}</div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                      <span className="qty-num">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                  </div>
                  <div className="cart-item-price">₱{(item.price * item.qty).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>

          {/* Billing summary */}
          <div className="billing-summary">
            <div className="summary-row">
              <span>Items ({cart.reduce((a, c) => a + c.qty, 0)})</span>
              <span id="sumSubtotal">₱{getSubtotal().toFixed(2)}</span>
            </div>

            {/* Discount selector */}
            <div className="summary-row" style={{ alignItems: 'center', margin: '10px 0' }}>
              <span>Discount</span>
              <select 
                value={discountType} 
                onChange={(e) => setDiscountType(e.target.value as any)}
                style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', padding: '4px', fontSize: '13px', color: '#333' }}
              >
                <option value="none">No Discount</option>
                <option value="senior_pwd">Senior/PWD (20%)</option>
              </select>
            </div>

            {discountType !== 'none' && (
              <div className="summary-row" style={{ color: '#ff4d4d' }}>
                <span>Discount Amount</span>
                <span>- ₱{getDiscount().toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row total">
              <span>TOTAL</span>
              <span id="sumTotal">₱{getTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Order type */}
          <div className="order-type-section">
            <div className="section-label">Order Type</div>
            <div className="order-type-btns">
              <button 
                id="otDineIn" 
                className={`order-type-btn ${orderType === 'dinein' ? 'active' : ''}`}
                onClick={() => setOrderType('dinein')}
              >
                <span className="ot-icon">🍽️</span>
                <span className="ot-label">Dine In</span>
              </button>
              <button 
                id="otTakeOut" 
                className={`order-type-btn ${orderType === 'takeout' ? 'active' : ''}`}
                onClick={() => setOrderType('takeout')}
              >
                <span className="ot-icon">🛍️</span>
                <span className="ot-label">Take Out</span>
              </button>
            </div>
          </div>

          {/* Payment options */}
          <div className="payment-section">
            <div className="section-label">Payment Method</div>
            <div className="payment-methods">
              <button 
                id="pmCash" 
                className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <span className="pm-icon">💵</span>
                <span className="pm-label">Cash</span>
              </button>
              <button 
                id="pmCard" 
                className={`payment-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <span className="pm-icon">💳</span>
                <span className="pm-label">Card</span>
              </button>
              <button 
                id="pmQrs" 
                className={`payment-btn ${paymentMethod === 'qrs' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('qrs')}
              >
                <span className="pm-icon">📱</span>
                <span className="pm-label">GCash</span>
              </button>
            </div>

            {paymentMethod === 'cash' ? (
              <div>
                <div className="cash-input-wrap" id="cashInputWrap">
                  <label htmlFor="cashInput">Amount Received (₱)</label>
                  <input 
                    type="number" 
                    id="cashInput" 
                    placeholder="0.00"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                  />
                </div>
                <div id="changeRow" className={`change-row ${getChange() < 0 ? 'negative' : ''}`}>
                  <span>Change Due</span>
                  <span id="changeAmt">
                    {cashInput === '' ? '₱0.00' : getChange() >= 0 ? `₱${getChange().toFixed(2)}` : `- ₱${Math.abs(getChange()).toFixed(2)}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="ref-input-wrap" id="refInputWrap">
                <label htmlFor="refInput">Reference Number / Code</label>
                <input 
                  type="text" 
                  id="refInput" 
                  placeholder="Enter Transaction Ref"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="process-btns">
            <button 
              id="processBtn" 
              className="process-btn" 
              disabled={isCheckoutDisabled()}
              onClick={handleCheckout}
            >
              Checkout & Print Receipt
            </button>
            
            <button 
              onClick={handleResetBill}
              style={{ width: '100%', padding: '10px', background: 'none', border: '1px solid #ddd', color: '#777', borderRadius: '8px', cursor: 'pointer', marginTop: '10px', fontWeight: 600, fontSize: '13px' }}
              disabled={cart.length === 0}
            >
              Reset Current Bill
            </button>
          </div>
        </section>
      </div>

      {/* Receipt Modal overlay */}
      {showReceipt && lastTransaction && (
        <div className="modal-overlay open">
          <div className="receipt-modal">
            <div className="receipt-header">
              <div className="receipt-brand">SIZZLING GRILL</div>
              <div className="receipt-sub">Grilled to Perfection, Made to Satisfy</div>
              <div className="receipt-sub">123 Street Address, City</div>
            </div>
            
            <hr className="receipt-divider" />
            
            <div id="receiptMeta">
              <div className="receipt-meta">Order #: <span>{lastTransaction.orderNo}</span></div>
              <div className="receipt-meta">Date: <span>{lastTransaction.date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
              <div className="receipt-meta">Type: <span>{lastTransaction.orderType === 'dinein' ? 'Dine In' : 'Take Out'}</span></div>
              <div className="receipt-meta">Payment: <span>{lastTransaction.paymentMethod.toUpperCase()}</span></div>
              {lastTransaction.refCode && (
                <div className="receipt-meta">Ref #: <span>{lastTransaction.refCode}</span></div>
              )}
            </div>

            <hr className="receipt-divider" />

            <div id="receiptItems">
              {lastTransaction.items.map(item => (
                <div className="receipt-item" key={item.id}>
                  <span className="ri-name">{item.emoji} {item.name}</span>
                  <span className="ri-qty">x{item.qty}</span>
                  <span className="ri-price">₱{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <hr className="receipt-divider" />

            <div className="receipt-totals" id="receiptTotals">
              <div className="row">
                <span>Subtotal</span>
                <span>₱{lastTransaction.items.reduce((a,c) => a + c.price * c.qty, 0).toFixed(2)}</span>
              </div>
              {discountType !== 'none' && (
                <div className="row" style={{ color: '#ff4d4d' }}>
                  <span>Discount</span>
                  <span>- ₱{getDiscount().toFixed(2)}</span>
                </div>
              )}
              <div className="row big">
                <span>TOTAL</span>
                <span>₱{lastTransaction.total.toFixed(2)}</span>
              </div>
              {lastTransaction.paymentMethod === 'cash' && lastTransaction.cash !== null && lastTransaction.change !== null && (
                <>
                  <div className="row">
                    <span>Cash Received</span>
                    <span>₱{lastTransaction.cash.toFixed(2)}</span>
                  </div>
                  <div className="row change-green">
                    <span>Change</span>
                    <span>₱{lastTransaction.change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <hr className="receipt-divider" />

            <div className="receipt-footer">
              Thank you for dining with us!<br />
              Come back again! 🔥
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="receipt-print-btn" onClick={handlePrint}>
                <i className="ti ti-printer"></i> Print
              </button>
              <button 
                className="receipt-close-btn" 
                style={{ backgroundColor: '#333' }}
                onClick={closeReceiptModal}
              >
                Close & Next Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded print media style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .modal-overlay.open, .modal-overlay.open * {
            visibility: visible;
          }
          .modal-overlay.open {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: none;
            box-shadow: none;
          }
          .receipt-modal {
            border: none;
            box-shadow: none;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          .receipt-print-btn, .receipt-close-btn {
            display: none !important;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
