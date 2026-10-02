'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

interface Product {
  P_code: number;
  Product_code: string;
  P_name: string;
  P_Category: string;
  P_S_P: string | number;
  P_P_P: string | number;
  P_image: string | null;
  Date_time: string;
}

export default function MasterlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoriesList = [
    { value: 'all', label: 'All' },
    { value: 'appetizers', label: 'Appetizers' },
    { value: 'inasal', label: 'Inasal' },
    { value: 'sizzling', label: 'Sizzling' },
    { value: 'seafood', label: 'Seafood' },
    { value: 'shakes', label: 'Shakes' },
    { value: 'drinks', label: 'Drinks' },
    { value: 'liquor', label: 'Liquor' },
    { value: 'others', label: 'Others' }
  ];

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [pCode, setPCode] = useState('');
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('appetizers');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      console.error(err);
      setError('Database error connection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'Admin') {
      fetchProducts();
    }
  }, [user, authLoading]);

  if (authLoading || !user || user.role !== 'Admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-deep)', color: 'var(--primary)' }}>
        <h3>Loading session and verifying privileges...</h3>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (!pCode || !pName || !pCategory || !sellingPrice || !purchasePrice) {
      setFormError('Please fill out all required fields.');
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('pCode', pCode);
    formData.append('pName', pName);
    formData.append('pCategory', pCategory);
    formData.append('sellingPrice', sellingPrice);
    formData.append('purchasePrice', purchasePrice);
    if (imageFile) {
      formData.append('pImage', imageFile);
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        // Reset form
        setPCode('');
        setPName('');
        setPCategory('appetizers');
        setSellingPrice('');
        setPurchasePrice('');
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchProducts();
      } else {
        setFormError(data.message || 'Error saving product');
      }
    } catch (err) {
      console.error(err);
      setFormError('Connection error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pDbCode: number, pCodeStr: string) => {
    if (!confirm(`Are you sure you want to delete product "${pCodeStr}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${pDbCode}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        fetchProducts();
      } else {
        alert(data.message || 'Error deleting product');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error deleting product');
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = (
      p.Product_code.toLowerCase().includes(term) ||
      p.P_name.toLowerCase().includes(term) ||
      p.P_Category.toLowerCase().includes(term)
    );
    const matchesCategory = selectedCategory === 'all' || p.P_Category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <Sidebar />

      <main className="main-content">
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h1 style={{ margin: 0 }}>Products</h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: viewMode === 'list' ? '1px solid var(--primary)' : '1px solid var(--border)',
                  color: viewMode === 'list' ? '#000' : '#adb5bd',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  fontSize: '18px'
                }}
              >
                <i className="ti ti-list"></i>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: viewMode === 'grid' ? '1px solid var(--primary)' : '1px solid var(--border)',
                  color: viewMode === 'grid' ? '#000' : '#adb5bd',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  fontSize: '18px'
                }}
              >
                <i className="ti ti-layout-grid"></i>
              </button>
            </div>
          </div>

          <button className="add-new-btn" onClick={() => setShowModal(true)}>
            <i className="ti ti-plus" style={{ fontSize: '16px' }}></i> Add new
          </button>
        </div>

        {/* Categories below the header */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '25px' }}>
          {categoriesList.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: selectedCategory === cat.value ? 'rgba(234, 106, 18, 0.1)' : 'transparent',
                color: selectedCategory === cat.value ? 'var(--primary)' : '#5c636a',
                fontSize: '14px',
                fontWeight: selectedCategory === cat.value ? '600' : '500',
                cursor: 'pointer',
                transition: 'var(--transition)',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {error && <div className="danger-box" style={{ padding: '15px', color: '#ff4d4d', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

        {/* Products Table or Grid */}
        {loading ? (
          <div className="table-wrapper" style={{ textAlign: 'center', padding: '40px', color: 'var(--primary)' }}>
            <div className="spinner-loader" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #1a1a1a', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '10px' }}>Loading products list...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="table-wrapper" style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            <i className="ti ti-package-off" style={{ fontSize: '48px', color: 'var(--primary)', marginBottom: '10px', display: 'block' }}></i>
            No products found matching the search.
          </div>
        ) : viewMode === 'list' ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Image</th>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Selling Price</th>
                  <th>Purchase Price</th>
                  <th>Date & Time Added</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.P_code}>
                    <td>
                      {p.P_image ? (
                        <img
                          src={p.P_image.startsWith('uploads/') ? `/${p.P_image}` : `/uploads/${p.P_image}`}
                          alt={p.P_name}
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/finallogo.png';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '6px',
                            background: 'var(--border)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            color: 'var(--primary)',
                          }}
                        >
                          🍔
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>{p.Product_code}</td>
                    <td style={{ color: 'var(--text-dark)', fontWeight: '500' }}>{p.P_name}</td>
                    <td>
                      <span className="badge badge-role">{p.P_Category}</span>
                    </td>
                    <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>₱{parseFloat(p.P_S_P as string).toFixed(2)}</td>
                    <td style={{ color: 'var(--success)' }}>₱{parseFloat(p.P_P_P as string).toFixed(2)}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.Date_time}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="danger-btn"
                        style={{ padding: '6px 10px', fontSize: '14px' }}
                        onClick={() => handleDelete(p.P_code, p.P_name)}
                        title="Delete"
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View Layout */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '20px',
              paddingBottom: '40px',
            }}
          >
            {filteredProducts.map((p) => (
              <div
                key={p.P_code}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'var(--transition)',
                }}
                className="product-card-grid"
              >
                {/* Image / Icon container */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '140px',
                    borderRadius: '8px',
                    background: '#f8f9fa',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                  }}
                >
                  {p.P_image ? (
                    <img
                      src={p.P_image.startsWith('uploads/') ? `/${p.P_image}` : `/uploads/${p.P_image}`}
                      alt={p.P_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/finallogo.png';
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '48px' }}>🍔</div>
                  )}
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-role" style={{ fontSize: '11px', padding: '4px 8px', textTransform: 'capitalize' }}>
                      {p.P_Category}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {p.Product_code}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--text-dark)',
                      marginTop: '4px',
                      lineHeight: '1.4',
                    }}
                  >
                    {p.P_name}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Selling Price:</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                        ₱{parseFloat(p.P_S_P as string).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Purchase Price:</span>
                      <span style={{ color: 'var(--success)' }}>
                        ₱{parseFloat(p.P_P_P as string).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action footer */}
                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {p.Date_time.split(' ')[0]} {/* Date only */}
                  </span>
                  <button
                    className="danger-btn"
                    style={{ padding: '6px 10px', fontSize: '14px' }}
                    onClick={() => handleDelete(p.P_code, p.P_name)}
                    title="Delete"
                  >
                    <i className="ti ti-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '550px' }}>
            <button className="close-btn" onClick={() => setShowModal(false)}>
              <i className="ti ti-x"></i>
            </button>
            <h3 style={{ marginBottom: '20px', fontFamily: "'Poppins', sans-serif", fontSize: '24px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Add New Product
            </h3>

            {formError && (
              <div style={{ padding: '10px', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: '#ff4d4d', borderRadius: '6px', fontSize: '13px', marginBottom: '15px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddProduct}>
              <div className="input-group">
                <label>Product Code / barcode</label>
                <input
                  type="text"
                  placeholder="e.g. 1001"
                  value={pCode}
                  onChange={(e) => setPCode(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pork Sisig"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Category</label>
                <select value={pCategory} onChange={(e) => setPCategory(e.target.value)} required>
                  <option value="appetizers">Appetizers</option>
                  <option value="inasal">Inasal</option>
                  <option value="sizzling">Sizzling</option>
                  <option value="seafood">Seafood</option>
                  <option value="shakes">Shakes</option>
                  <option value="drinks">Drinks</option>
                  <option value="liquor">Liquor</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Selling Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Purchase Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ padding: '8px' }}
                />
              </div>

              <button
                type="submit"
                className="primary-btn"
                style={{ width: '100%', marginTop: '15px' }}
                disabled={submitting}
              >
                {submitting ? 'ADDING PRODUCT...' : 'SAVE PRODUCT'}
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
