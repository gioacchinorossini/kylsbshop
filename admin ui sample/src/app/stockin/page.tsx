'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

interface StockLog {
  Sin_ID: number;
  Date_time: string;
  Product_code: string;
  P_name: string;
  Quantity: number;
}

interface ProductOption {
  Product_code: string;
  P_name: string;
  P_S_P: number;
}

export default function StockinPage() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProductCode, setSelectedProductCode] = useState('');
  const [salesPrice, setSalesPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stock?action=get_history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else {
        setError('Failed to fetch stock history.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection database error.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/stock?action=get_categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchProductsForCategory = async (cat: string) => {
    if (!cat) {
      setProducts([]);
      return;
    }
    try {
      const res = await fetch(`/api/stock?action=get_products&category=${encodeURIComponent(cat)}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  useEffect(() => {
    if (!authLoading && user && (user.role === 'Admin' || user.role === 'Manager')) {
      fetchHistory();
      fetchCategories();
    }
  }, [user, authLoading]);

  // Load products when category changes
  useEffect(() => {
    setSelectedProductCode('');
    setSalesPrice('');
    fetchProductsForCategory(selectedCategory);
  }, [selectedCategory]);

  // Update sales price when product changes
  useEffect(() => {
    const selectedProd = products.find(p => p.Product_code === selectedProductCode);
    if (selectedProd) {
      setSalesPrice(selectedProd.P_S_P);
    } else {
      setSalesPrice('');
    }
  }, [selectedProductCode, products]);

  if (authLoading || !user || (user.role !== 'Admin' && user.role !== 'Manager')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-deep)', color: 'var(--primary)' }}>
        <h3>Loading session and verifying privileges...</h3>
      </div>
    );
  }

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const selectedProd = products.find(p => p.Product_code === selectedProductCode);
    if (!selectedCategory || !selectedProductCode || !selectedProd || !quantity) {
      setFormError('Please select a product and enter quantity.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pCode: selectedProd.Product_code,
          pName: selectedProd.P_name,
          pCategory: selectedCategory,
          pSP: selectedProd.P_S_P,
          quantity: parseInt(quantity)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        setSelectedCategory('');
        setSelectedProductCode('');
        setQuantity('');
        setSalesPrice('');
        fetchHistory();
      } else {
        setFormError(data.message || 'Failed to save stock entry.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Connection error saving stock.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this stock entry? This will adjust active inventories.')) {
      return;
    }
    try {
      const res = await fetch(`/api/stock?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchHistory();
      } else {
        alert(data.message || 'Failed to delete stock entry.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error deleting stock entry.');
    }
  };

  const filteredHistory = history.filter(h => {
    const term = searchQuery.toLowerCase();
    return (
      h.Product_code.toLowerCase().includes(term) ||
      h.P_name.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <Sidebar />

      <main className="main-content">
        <div className="header-actions">
          <h1>Stock In Management</h1>
          <button className="primary-btn" onClick={() => setShowModal(true)}>
            <i className="ti ti-plus"></i> ADD STOCK ENTRY
          </button>
        </div>

        <div className="header-actions" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--primary)', fontFamily: "'Poppins', sans-serif" }}>
            Stock In History Table
          </h2>
        </div>

        {/* Filter input */}
        <div className="filter-section" style={{ marginBottom: '20px' }}>
          <div className="page-search" style={{ maxWidth: '380px' }}>
            <i className="ti ti-search page-search-icon"></i>
            <input
              type="text"
              placeholder="Search by Product Code or Name..."
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

        {/* Log table */}
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--primary)' }}>
              <div className="spinner-loader" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '10px' }}>Loading stock history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
              No stock entries recorded.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date & Time</th>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Quantity Added</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((row) => (
                  <tr key={row.Sin_ID}>
                    <td style={{ fontWeight: 'bold' }}>#{row.Sin_ID}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{row.Date_time}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>{row.Product_code}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: '500' }}>{row.P_name}</td>
                    <td style={{ fontWeight: 'bold', fontSize: '15px' }}>{row.Quantity}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="danger-btn"
                        style={{ padding: '6px 10px', fontSize: '14px' }}
                        onClick={() => handleDelete(row.Sin_ID)}
                        title="Delete"
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Stock entry modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '500px' }}>
            <button className="close-btn" onClick={() => setShowModal(false)}>
              <i className="ti ti-x"></i>
            </button>
            <h3 style={{ marginBottom: '20px', fontFamily: "'Poppins', sans-serif", fontSize: '24px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Add Stock Entry
            </h3>

            {formError && (
              <div style={{ padding: '10px', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: '#ff4d4d', borderRadius: '6px', fontSize: '13px', marginBottom: '15px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveStock}>
              <div className="input-group">
                <label>Category</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)} 
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Product Name</label>
                <select
                  value={selectedProductCode}
                  onChange={(e) => setSelectedProductCode(e.target.value)}
                  disabled={!selectedCategory || products.length === 0}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(prod => (
                    <option key={prod.Product_code} value={prod.Product_code}>
                      {prod.P_name} ({prod.Product_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Sales Price (₱)</label>
                <input
                  type="text"
                  value={salesPrice !== '' ? `₱${parseFloat(salesPrice as any).toFixed(2)}` : ''}
                  placeholder="Auto-filled"
                  readOnly
                />
              </div>

              <div className="input-group">
                <label>Quantity to Add</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <button
                type="submit"
                className="primary-btn"
                style={{ width: '100%', marginTop: '15px' }}
                disabled={submitting}
              >
                {submitting ? 'RECORDING STOCK...' : 'SAVE STOCK ENTRY'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
