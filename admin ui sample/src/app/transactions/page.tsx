'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

interface TransactionItem {
  OR_ID: number;
  Order_No: string;
  P_Code: string;
  Product_Name: string;
  Quantity: number;
  Price: number;
  SubTotal: number;
  Order_Type: string;
  Payment_Method: string;
  Ref_Code: string | null;
  Date_Time: string;
  LiveStock: number;
}

interface StockLog {
  Sin_ID: number;
  Date_time: string;
  Product_code: string;
  P_name: string;
  Quantity: number;
}

interface UnifiedItem {
  id: string; // "sales-{OR_ID}" or "purchase-{Sin_ID}"
  displayId: string;
  type: 'Sales' | 'Purchase';
  date: string;
  rawDate: Date;
  productCode: string;
  productName: string;
  qty: number;
  price: number | string;
  subtotal: number | string;
  paymentMethod: string;
  orderType: string;
  refCode?: string | null;
  liveStock?: number | string;
}

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [unifiedItems, setUnifiedItems] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const updateFilter = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        setFilterType(params.get('type') || 'all');
      }
    };
    updateFilter();

    const interval = setInterval(updateFilter, 300);
    return () => clearInterval(interval);
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch detailed sales
      const resSales = await fetch('/api/orders?detailed=true');
      let salesData: TransactionItem[] = [];
      if (resSales.ok) {
        salesData = await resSales.json();
      }

      // Fetch stock-in history (Purchases)
      const resStock = await fetch('/api/stock?action=get_history');
      let stockData: StockLog[] = [];
      if (resStock.ok) {
        stockData = await resStock.json();
      }

      // Format Sales into UnifiedItems
      const formattedSales = salesData.map((s) => ({
        id: `sales-${s.OR_ID}`,
        displayId: `#${s.Order_No}`,
        type: 'Sales' as const,
        date: new Date(s.Date_Time).toLocaleString('en-US', { hour12: true }),
        rawDate: new Date(s.Date_Time),
        productCode: s.P_Code,
        productName: s.Product_Name,
        qty: s.Quantity,
        price: s.Price,
        subtotal: s.SubTotal,
        paymentMethod: s.Payment_Method,
        orderType: s.Order_Type,
        refCode: s.Ref_Code,
        liveStock: s.LiveStock
      }));

      // Format Purchase into UnifiedItems
      const formattedStock = stockData.map((st) => {
        const parsedDate = new Date(st.Date_time);
        return {
          id: `purchase-${st.Sin_ID}`,
          displayId: `#${st.Sin_ID}`,
          type: 'Purchase' as const,
          date: st.Date_time,
          rawDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
          productCode: st.Product_code,
          productName: st.P_name,
          qty: st.Quantity,
          price: '—',
          subtotal: '—',
          paymentMethod: 'System',
          orderType: 'Stock In',
          refCode: null,
          liveStock: '—'
        };
      });

      // Combine and sort by date descending
      const combined = [...formattedSales, ...formattedStock].sort((a, b) => {
        return b.rawDate.getTime() - a.rawDate.getTime();
      });

      setUnifiedItems(combined);
    } catch (err) {
      console.error(err);
      setError('Connection database error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && (user.role === 'Admin' || user.role === 'Manager')) {
      fetchTransactions();
    }
  }, [user, authLoading]);

  if (authLoading || !user || (user.role !== 'Admin' && user.role !== 'Manager')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-deep)', color: 'var(--primary)' }}>
        <h3>Loading session and verifying privileges...</h3>
      </div>
    );
  }

  const handleDeleteAll = async () => {
    if (user.role !== 'Admin') {
      alert('Only administrators are allowed to delete transaction history.');
      return;
    }

    if (!confirm('Are you sure you want to delete ALL sales records? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('All sales records have been deleted successfully.');
        fetchTransactions();
      } else {
        alert(data.message || 'Error deleting records.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error deleting records.');
    }
  };

  const filteredItems = unifiedItems.filter((item) => {
    // Apply type filter
    if (filterType === 'sales' && item.type !== 'Sales') return false;
    if (filterType === 'purchase' && item.type !== 'Purchase') return false;

    // Apply search query filter
    const term = searchQuery.toLowerCase();
    return (
      item.displayId.toLowerCase().includes(term) ||
      item.productName.toLowerCase().includes(term) ||
      item.productCode.toLowerCase().includes(term) ||
      item.orderType.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <Sidebar />

      <main className="main-content">
        <div className="header-actions">
          <h1>
            {filterType === 'sales' ? 'Sales Transactions' : filterType === 'purchase' ? 'Purchase Transactions' : 'All Transactions'}
          </h1>
        </div>

        <div className="header-actions" style={{ marginBottom: '20px' }}>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="primary-btn" onClick={fetchTransactions}>
              <i className="ti ti-refresh"></i> Refresh
            </button>
            {user.role === 'Admin' && filterType !== 'purchase' && (
              <button className="danger-btn" onClick={handleDeleteAll}>
                <i className="ti ti-trash"></i> Delete Sales History
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="filter-section" style={{ marginBottom: '20px' }}>
          <div className="page-search" style={{ maxWidth: '380px' }}>
            <i className="ti ti-search page-search-icon"></i>
            <input
              type="text"
              placeholder="Search by Order/ID #, Product Code, Name or Type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="page-search-input"
            />
          </div>
        </div>

        {error && (
          <div style={{ padding: '15px', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: '#ff4d4d', borderRadius: '8px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--primary)' }}>
              <div className="spinner-loader" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '10px' }}>Loading transactions...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
              No transactions found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order/ID #</th>
                  <th>Date & Time</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                  <th>Type</th>
                  <th>Payment</th>
                  <th>Live Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>{row.displayId}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{row.date}</td>
                    <td>
                      <div style={{ fontWeight: '500', color: 'var(--text-dark)' }}>{row.productName}</div>
                      <small style={{ color: 'var(--text-muted)' }}>{row.productCode}</small>
                    </td>
                    <td style={{ fontWeight: 'bold', color: row.type === 'Purchase' ? '#28a745' : 'inherit' }}>
                      {row.type === 'Purchase' ? `+${row.qty}` : row.qty}
                    </td>
                    <td style={{ color: 'var(--success)' }}>{typeof row.price === 'number' ? `₱${row.price.toFixed(2)}` : row.price}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                      {typeof row.subtotal === 'number' ? `₱${row.subtotal.toFixed(2)}` : row.subtotal}
                    </td>
                    <td>
                      <span
                        className="badge badge-system"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {row.orderType.toLowerCase().includes('dine') && (
                          <i className="ti ti-tools-kitchen-2" style={{ fontSize: '13px' }}></i>
                        )}
                        {row.orderType.toLowerCase().includes('take') && (
                          <i className="ti ti-shopping-bag" style={{ fontSize: '13px' }}></i>
                        )}
                        {row.orderType}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${row.paymentMethod.toLowerCase().replace(/\s+/g, '')}`}>
                        {row.paymentMethod}
                      </span>
                      {row.refCode && (
                        <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                          Ref: {row.refCode}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        color: typeof row.liveStock === 'number' ? (row.liveStock <= 10 ? '#ff4d4d' : '#28a745') : 'inherit',
                        fontWeight: 'bold',
                      }}
                    >
                      {row.liveStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
