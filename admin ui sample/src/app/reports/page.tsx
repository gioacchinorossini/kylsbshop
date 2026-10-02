'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

interface OrderSummary {
  Order_No: string;
  Date_Time: string;
  Total_Qty: number;
  Total_Amount: number;
  Order_Type: string;
  Payment_Method: string;
}

interface OrderDetailItem {
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
  Cash: number;
  Change: number;
  Date_Time: string;
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // View Receipt (OR) Modal
  const [receiptOrderNo, setReceiptOrderNo] = useState<string | null>(null);
  const [receiptDetails, setReceiptDetails] = useState<OrderDetailItem[]>([]);
  const [receiptLoading, setReceiptLoading] = useState(false);

  // Edit Order Modal
  const [editOrderNo, setEditOrderNo] = useState<string | null>(null);
  const [editOrderType, setEditOrderType] = useState('dinein');
  const [editPaymentMethod, setEditPaymentMethod] = useState('cash');
  const [editItems, setEditItems] = useState<OrderDetailItem[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        setError('Failed to fetch sales reports.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection database error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && (user.role === 'Admin' || user.role === 'Manager')) {
      fetchOrders();
    }
  }, [user, authLoading]);

  if (authLoading || !user || (user.role !== 'Admin' && user.role !== 'Manager')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-deep)', color: 'var(--primary)' }}>
        <h3>Loading session and verifying privileges...</h3>
      </div>
    );
  }

  // Load detailed OR
  const handleViewOR = async (orderNo: string) => {
    setReceiptOrderNo(orderNo);
    setReceiptLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderNo}`);
      if (res.ok) {
        const data = await res.json();
        setReceiptDetails(data);
      } else {
        alert('Failed to load receipt details.');
        setReceiptOrderNo(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching receipt data.');
      setReceiptOrderNo(null);
    } finally {
      setReceiptLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = async (orderNo: string, currentType: string, currentPayment: string) => {
    setEditOrderNo(orderNo);
    setEditOrderType(currentType.toLowerCase());
    setEditPaymentMethod(currentPayment.toLowerCase());
    setEditLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderNo}`);
      if (res.ok) {
        const data = await res.json();
        setEditItems(data);
      } else {
        alert('Failed to load order items.');
        setEditOrderNo(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching order items.');
      setEditOrderNo(null);
    } finally {
      setEditLoading(false);
    }
  };

  // Update Order Metadata
  const handleUpdateOrder = async () => {
    if (!editOrderNo) return;
    try {
      const res = await fetch(`/api/orders/${editOrderNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: editOrderType,
          paymentMethod: editPaymentMethod
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Order updated successfully!');
        setEditOrderNo(null);
        fetchOrders();
      } else {
        alert(data.message || 'Failed to update order metadata.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error.');
    }
  };

  // Delete specific order line item
  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to remove this item from the order?')) {
      return;
    }
    try {
      const res = await fetch(`/api/orders/items/${itemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Reload edit item list
        if (editOrderNo) {
          const detailRes = await fetch(`/api/orders/${editOrderNo}`);
          if (detailRes.ok) {
            const updatedItems = await detailRes.json();
            if (updatedItems.length === 0) {
              // Entire order is now empty
              setEditOrderNo(null);
            } else {
              setEditItems(updatedItems);
            }
          }
        }
        fetchOrders();
      } else {
        alert(data.message || 'Failed to delete item.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error.');
    }
  };

  // Delete entire order
  const handleDeleteOrder = async () => {
    if (!editOrderNo) return;
    if (!confirm(`Are you sure you want to delete ALL records for Order #${editOrderNo}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/orders/${editOrderNo}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Order deleted successfully!');
        setEditOrderNo(null);
        fetchOrders();
      } else {
        alert(data.message || 'Failed to delete order.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error.');
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('No records to export.');
      return;
    }

    const headers = ['Order #', 'Date & Time', 'Total Qty', 'Total Amount', 'Type', 'Payment'];
    const rows = orders.map((r) => [
      `#${r.Order_No}`,
      r.Date_Time,
      r.Total_Qty,
      r.Total_Amount.toFixed(2),
      r.Order_Type,
      r.Payment_Method,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Sales_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalQty = orders.reduce((sum, r) => sum + r.Total_Qty, 0);
  const totalRevenue = orders.reduce((sum, r) => sum + r.Total_Amount, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <Sidebar />

      <main className="main-content">
        <div className="header-actions">
          <h1>Reports</h1>
          <button className="report-action-btn" onClick={handleExportCSV}>
            <i className="ti ti-download"></i> Export CSV
          </button>
        </div>

        {/* Date Filter Panel */}
        <div className="filter-section" style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '25px' }}>
          <div className="input-group" style={{ marginBottom: 0, minWidth: '200px', flex: 1 }}>
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0, minWidth: '200px', flex: 1 }}>
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="report-action-btn" onClick={fetchOrders}>
              <i className="ti ti-filter"></i> Filter
            </button>
            <button className="report-action-btn" onClick={() => { setStartDate(''); setEndDate(''); fetchOrders(); }}>
              <i className="ti ti-refresh"></i> Reset
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '15px', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: '#ff4d4d', borderRadius: '8px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Sales Table */}
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--primary)' }}>
              <div className="spinner-loader" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '10px' }}>Loading reports...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
              No orders found in date range.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date & Time</th>
                  <th>Total Qty</th>
                  <th>Total Amount</th>
                  <th>Type</th>
                  <th>Payment</th>
                  <th style={{ textAlign: 'center', width: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((row) => (
                  <tr key={row.Order_No}>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>#{row.Order_No}</td>
                    <td>{row.Date_Time}</td>
                    <td>{row.Total_Qty}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>₱{row.Total_Amount.toFixed(2)}</td>
                    <td>
                      <span 
                        className="badge badge-system"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {row.Order_Type.toLowerCase().includes('dine') ? (
                          <i className="ti ti-tools-kitchen-2" style={{ fontSize: '13px' }}></i>
                        ) : (
                          <i className="ti ti-shopping-bag" style={{ fontSize: '13px' }}></i>
                        )}
                        {row.Order_Type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${row.Payment_Method.toLowerCase()}`}>
                        {row.Payment_Method}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="primary-btn"
                        style={{ padding: '6px 10px', fontSize: '14px' }}
                        onClick={() => handleViewOR(row.Order_No)}
                        title="View OR"
                      >
                        <i className="ti ti-eye"></i>
                      </button>
                      <button
                        className="info-btn"
                        style={{ padding: '6px 10px', fontSize: '14px' }}
                        onClick={() => handleOpenEdit(row.Order_No, row.Order_Type, row.Payment_Method)}
                        title="Edit OR"
                      >
                        <i className="ti ti-edit"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Aggregated Totals Panel */}
        <div className="stats-container" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '25px' }}>
          <div className="stat-card">
            <h3>TOTAL QUANTITY SOLD</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)', margin: '10px 0 0 0' }}>{totalQty}</p>
          </div>
          <div className="stat-card">
            <h3>TOTAL REVENUE</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)', margin: '10px 0 0 0' }}>₱{totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </main>

      {/* View Receipt Modal */}
      {receiptOrderNo && (
        <div className="modal-overlay open">
          <div className="receipt-modal" style={{ width: '400px', background: '#fff', color: '#333', padding: '25px', borderRadius: '12px' }}>
            {receiptLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--primary)' }}>Loading receipt...</div>
            ) : (
              <div>
                <div className="receipt-header" style={{ textAlign: 'center' }}>
                  <h2 style={{ fontFamily: "'Poppins', sans-serif", color: 'var(--primary)', fontSize: '24px', margin: 0 }}>SIZZLING GRILL</h2>
                  <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Premium Sizzling & Grilled Dishes</p>
                </div>

                <hr className="receipt-divider" style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '15px 0' }} />

                {receiptDetails.length > 0 && (
                  <div>
                    <div className="receipt-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                      <span>Order #:</span> <strong>{receiptOrderNo}</strong>
                    </div>
                    <div className="receipt-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                      <span>Date:</span> <strong>{new Date(receiptDetails[0].Date_Time).toLocaleString()}</strong>
                    </div>
                    <div className="receipt-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                      <span>Type:</span> <strong>{receiptDetails[0].Order_Type.toUpperCase()}</strong>
                    </div>
                    <div className="receipt-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                      <span>Payment:</span> <strong>{receiptDetails[0].Payment_Method.toUpperCase()}</strong>
                    </div>
                    {receiptDetails[0].Ref_Code && (
                      <div className="receipt-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                        <span>Ref #:</span> <strong>{receiptDetails[0].Ref_Code}</strong>
                      </div>
                    )}
                  </div>
                )}

                <hr className="receipt-divider" style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '15px 0' }} />

                <div className="receipt-items">
                  {receiptDetails.map(item => (
                    <div className="receipt-item" key={item.OR_ID} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', margin: '6px 0' }}>
                      <span>{item.Product_Name} x{item.Quantity}</span>
                      <strong style={{ color: 'var(--success)' }}>₱{item.SubTotal.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>

                <hr className="receipt-divider" style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '15px 0' }} />

                <div className="receipt-totals">
                  <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', margin: '4px 0' }}>
                    <span>Subtotal:</span>
                    <span style={{ color: 'var(--success)' }}>₱{receiptDetails.reduce((a, c) => a + c.SubTotal, 0).toFixed(2)}</span>
                  </div>
                  <div className="row big" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: 'var(--success)', margin: '8px 0' }}>
                    <span>TOTAL:</span>
                    <span>₱{receiptDetails.reduce((a, c) => a + c.SubTotal, 0).toFixed(2)}</span>
                  </div>
                  {receiptDetails.length > 0 && receiptDetails[0].Payment_Method.toLowerCase() === 'cash' && (
                    <>
                      <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', margin: '4px 0' }}>
                        <span>Cash Received:</span>
                        <span style={{ color: 'var(--success)' }}>₱{receiptDetails[0].Cash.toFixed(2)}</span>
                      </div>
                      <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', margin: '4px 0', color: 'var(--success)', fontWeight: 'bold' }}>
                        <span>Change:</span>
                        <span>₱{receiptDetails[0].Change.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="receipt-footer" style={{ textAlign: 'center', fontSize: '12px', color: '#777', marginTop: '20px' }}>
                  Thank you for your visit!<br />Please come again. 🔥
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="primary-btn" onClick={() => window.print()} style={{ flex: 1 }}>
                    <i className="ti ti-printer"></i> Print
                  </button>
                  <button className="secondary-btn" onClick={() => setReceiptOrderNo(null)} style={{ flex: 1 }}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editOrderNo && (
        <div className="modal-overlay open">
          <div className="modal-content" style={{ width: '550px' }}>
            <button className="close-btn" onClick={() => setEditOrderNo(null)}>
              <i className="ti ti-x"></i>
            </button>
            <h3 style={{ marginBottom: '20px', fontFamily: "'Poppins', sans-serif", fontSize: '24px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Edit Order #{editOrderNo}
            </h3>

            {editLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--primary)' }}>Loading items...</div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Order Type</label>
                    <select value={editOrderType} onChange={(e) => setEditOrderType(e.target.value)}>
                      <option value="dinein">Dine In</option>
                      <option value="takeout">Take Out</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Payment Method</label>
                    <select value={editPaymentMethod} onChange={(e) => setEditPaymentMethod(e.target.value)}>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="qrs">QR / GCash</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>Items & Quantities</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)' }}>
                    {editItems.map(item => (
                      <div key={item.OR_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <span style={{ fontWeight: '500', color: 'var(--text-dark)' }}>{item.Product_Name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>Qty: {item.Quantity} @ <span style={{ color: 'var(--success)', fontWeight: '500' }}>₱{item.Price.toFixed(2)}</span></span>
                        </div>
                        <button
                          className="danger-btn"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => handleDeleteItem(item.OR_ID)}
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="success-btn" onClick={handleUpdateOrder} style={{ flex: 1 }}>
                    Save Changes
                  </button>
                  <button className="danger-btn" onClick={handleDeleteOrder} style={{ flex: 1 }}>
                    Delete Entire Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
          .receipt-print-btn, .receipt-close-btn, .primary-btn, .secondary-btn {
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
