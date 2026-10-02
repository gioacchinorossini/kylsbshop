'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface OrderItem {
  name: string;
  qty: number;
  image: string | null;
}

interface KitchenOrder {
  order_no: string;
  table_number: string;
  status: string;
  date_and_time: string;
  items: OrderItem[];
}

export default function KitchenPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    orderNo: string;
    nextStatus: string;
  }>({
    isOpen: false,
    orderNo: '',
    nextStatus: ''
  });

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/kitchen/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setError('');
      } else {
        setError('Failed to fetch kitchen orders.');
      }
    } catch (err) {
      console.error('Fetch kitchen orders error:', err);
      setError('Connection/database error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-deep)', color: 'var(--primary)' }}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>Verifying credentials...</h3>
      </div>
    );
  }

  const getItemIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('blender')) return 'ti ti-blender';
    if (lowercaseName.includes('beer') || lowercaseName.includes('carlsberg') || lowercaseName.includes('kingfisher')) return 'ti ti-glass-full';
    if (lowercaseName.includes('margarita') || lowercaseName.includes('cosmopolitan') || lowercaseName.includes('mimosa') || lowercaseName.includes('screw driver')) return 'ti ti-glass-cocktail';
    if (lowercaseName.includes('espresso') || lowercaseName.includes('coffee') || lowercaseName.includes('tea')) return 'ti ti-cup';
    if (lowercaseName.includes('santra') || lowercaseName.includes('lemon') || lowercaseName.includes('orange')) return 'ti ti-lemon-2';
    if (lowercaseName.includes('choco') || lowercaseName.includes('candy')) return 'ti ti-candy';
    if (lowercaseName.includes('veg') || lowercaseName.includes('leaf')) return 'ti ti-leaf';
    return 'ti ti-tools-kitchen-2';
  };

  const handleCardClick = (orderNo: string, currentStatus: string) => {
    let nextStatus = 'Pending';
    if (currentStatus === 'Pending') {
      nextStatus = 'Preparing';
    } else if (currentStatus === 'Preparing') {
      nextStatus = 'Complete';
    } else if (currentStatus === 'Complete') {
      nextStatus = 'Archive';
    }

    setConfirmModal({
      isOpen: true,
      orderNo,
      nextStatus
    });
  };

  const executeStatusChange = async () => {
    const { orderNo, nextStatus } = confirmModal;
    setConfirmModal({ isOpen: false, orderNo: '', nextStatus: '' });

    try {
      const res = await fetch('/api/kitchen/orders/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_no: orderNo, status: nextStatus })
      });
      if (res.ok) {
        fetchOrders();
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating order status');
    }
  };

  // Group columns
  const pendingOrders = orders.filter(o => o.status.toLowerCase() === 'pending');
  const preparingOrders = orders.filter(o => o.status.toLowerCase() === 'preparing');
  const completeOrders = orders.filter(o => o.status.toLowerCase() === 'complete');

  const getModalConfig = () => {
    const { orderNo, nextStatus } = confirmModal;
    if (nextStatus === 'Archive') {
      return {
        title: 'Archive Completed Order',
        message: `Are you sure you want to archive Order #${orderNo}? This saves it to the orders database and clears it from active display monitors.`,
        confirmText: 'Yes, Archive'
      };
    } else if (nextStatus === 'Complete') {
      return {
        title: 'Mark as Ready',
        message: `Confirm that all items in Order #${orderNo} are cooked, assembled, and ready for serving.`,
        confirmText: 'Yes, Complete'
      };
    } else if (nextStatus === 'Preparing') {
      return {
        title: 'Start Food Prep',
        message: `Send Order #${orderNo} to the active food preparation queue?`,
        confirmText: 'Start Cooking'
      };
    }
    return {
      title: 'Confirm Status Change',
      message: `Change the status of Order #${orderNo} to "${nextStatus}"?`,
      confirmText: 'Yes, Update'
    };
  };

  const modalConfig = getModalConfig();

  return (
    <>
      {/* Tabler Icons CDN */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

      {/* CSS overrides to create a high-end, eye-strain-free kitchen dashboard */}
      <style dangerouslySetInnerHTML={{
        __html: `
        body {
          background: var(--bg-deep) !important;
          margin: 0;
          padding: 0;
          color: var(--text-dark);
          font-family: 'Poppins', sans-serif;
        }

        .kds-wrapper {
          max-width: 1520px;
          width: 100%;
          background: var(--bg-card);
          border-radius: 16px;
          box-shadow: var(--shadow-md);
          padding: 2.2rem;
          margin: 2rem auto;
          border: 1px solid var(--border);
        }

        .kds-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2.2rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1.2rem;
        }

        .kds-header h1 {
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--text-dark);
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 0;
          font-family: 'Poppins', sans-serif;
        }

        .kds-header h1 i {
          color: var(--primary);
          font-size: 2.2rem;
        }

        .status-legend {
          display: flex;
          gap: 2rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-muted);
          align-items: center;
        }

        .status-legend span {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-legend i {
          font-size: 1.1rem;
        }

        .status-legend .pending i { color: #f59e0b; }
        .status-legend .preparing i { color: #3b82f6; }
        .status-legend .complete i { color: var(--success); }

        .order-columns {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.8rem;
        }

        .column {
          background: #f8f9fa;
          border-radius: 16px;
          padding: 1.4rem 1.2rem 1.6rem;
          border: 1px solid var(--border);
          min-height: 520px;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 1.4rem;
          padding-bottom: 0.6rem;
          border-bottom: 2px dashed var(--border);
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.5px;
        }

        .column-header .badge {
          background: rgba(0, 0, 0, 0.05);
          padding: 0.2rem 0.9rem;
          border-radius: 40px;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          border: 1px solid var(--border);
        }

        .order-card {
          background: var(--bg-card);
          border-radius: 20px;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          border: 1px solid var(--border);
          transition: var(--transition);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          padding: 0;
        }

        .order-card:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }

        .order-banner {
          height: 110px;
          width: 100%;
          overflow: hidden;
          background: #f8f9fa;
          border-radius: 16px;
          margin: 4px 4px 0;
          width: calc(100% - 8px);
        }

        .order-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Collage grid styles */
        .banner-collage {
          width: 100%;
          height: 100%;
          display: grid;
          gap: 1px;
          background: #e5e5e5;
        }

        .banner-collage.count-1 {
          grid-template-columns: 1fr;
        }

        .banner-collage.count-2 {
          grid-template-columns: 1fr 1fr;
        }

        .banner-collage.count-3 {
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
        }

        .banner-collage.count-3 .collage-cell:first-child {
          grid-row: span 2;
        }

        .banner-collage.count-4plus {
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
        }

        .collage-cell {
          overflow: hidden;
          background: #f0f0f0;
          position: relative;
        }

        .collage-cell img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .collage-cell.more-overlay::after {
          content: attr(data-more);
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          color: #fff;
          font-size: 18px;
          font-weight: 800;
          font-family: 'Poppins', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .order-brand-badge {
          flex-shrink: 0;
          width: 52px;
          height: 56px;
          border-radius: 14px;
          background: #34363a;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
          z-index: 5;
        }

        .order-brand-badge i {
          font-size: 18px;
          line-height: 1;
        }

        .order-brand-label {
          font-size: 9.5px;
          font-weight: 800;
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.3px;
          line-height: 1;
        }

        .order-card-content {
          padding: 0 16px 18px;
        }

        .order-header-inline {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
          margin-top: -22px;
        }

        .order-header-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-top: 30px;
        }

        .order-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .order-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--text-dark);
        }

        .order-price {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--primary);
        }

        .order-timeline {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-timeline::before {
          content: '';
          position: absolute;
          left: 11px;
          top: 12px;
          bottom: 12px;
          width: 2px;
          border-left: 2px dashed var(--border);
          z-index: 1;
        }

        .timeline-node {
          display: flex;
          align-items: flex-start;
          position: relative;
        }

        .node-icon-wrapper {
          width: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 24px;
          z-index: 2;
        }

        .node-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #a0aec0;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1.5px #a0aec0;
        }

        .node-dot.orange-dot {
          background: var(--primary);
          box-shadow: 0 0 0 1.5px var(--primary);
        }

        .node-dot.gray-dot {
          background: #718096;
          box-shadow: 0 0 0 1.5px #718096;
        }

        .node-content {
          display: flex;
          justify-content: space-between;
          flex: 1;
          padding-left: 8px;
          align-items: center;
          font-size: 13.5px;
        }

        .node-label {
          font-weight: 600;
          color: var(--text-dark);
        }

        .node-value {
          color: var(--text-muted);
          font-size: 11.5px;
          font-weight: 500;
        }

        .node-item-text {
          padding-left: 8px;
          color: var(--text-dark);
          font-weight: 500;
          font-size: 13.5px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .node-item-qty {
          color: var(--text-dark);
          font-weight: 700;
          margin-right: 6px;
        }

        .veg-badge {
          background: rgba(40, 167, 69, 0.15);
          color: #28a745;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.1rem 0.5rem;
          border-radius: 40px;
          margin-left: 6px;
          letter-spacing: 0.5px;
        }

        .order-card.status-pending .order-brand-badge {
          background: #f59e0b;
        }
        .order-card.status-pending:hover {
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.12);
        }

        .order-card.status-preparing .order-brand-badge {
          background: #3b82f6;
        }
        .order-card.status-preparing:hover {
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.12);
        }

        .order-card.status-complete .order-brand-badge {
          background: var(--success);
        }
        .order-card.status-complete:hover {
          box-shadow: 0 8px 24px rgba(34, 197, 94, 0.12);
        }

        @media (max-width: 1000px) {
          .order-columns { grid-template-columns: 1fr 1fr; }
          .column:last-child { grid-column: span 2; }
        }

        @media (max-width: 680px) {
          .order-columns { grid-template-columns: 1fr; }
          .column:last-child { grid-column: span 1; }
          .kds-wrapper { padding: 1.2rem; }
          .kds-header { flex-direction: column; align-items: flex-start; gap: 0.8rem; }
          .status-legend { flex-wrap: wrap; gap: 0.8rem 1.5rem; }
        }

        /* Confirmation Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .modal-content {
          background: var(--bg-card);
          width: 90%;
          max-width: 440px;
          border-radius: 16px;
          box-shadow: var(--shadow-md);
          padding: 2.2rem;
          text-align: center;
          border: 1px solid var(--border);
        }

        .modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.2rem;
        }

        .modal-icon {
          font-size: 3.2rem;
          color: var(--primary);
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-dark);
          letter-spacing: -0.3px;
          margin: 0;
          font-family: 'Poppins', sans-serif;
        }

        .modal-body p {
          font-size: 1rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .modal-btn {
          flex: 1;
          padding: 0.9rem 1.25rem;
          font-size: 0.95rem;
          font-weight: 700;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
        }

        .btn-cancel {
          background: transparent;
          color: var(--text-dark);
          border: 1px solid var(--border);
        }

        .btn-cancel:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .btn-confirm {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(234, 106, 18, 0.2);
        }

        .btn-confirm:hover {
          background: var(--primary-hover);
        }
      ` }} />

      <div style={{ padding: '20px' }}>
        <div className="kds-wrapper">
          {/* Header */}
          <div className="kds-header">
            <h1>
              <i className="ti ti-tools-kitchen-2"></i> Kitchen Display
            </h1>
            <div className="status-legend">
              <span className="pending">
                <i className="ti ti-hourglass-low"></i> Pending
              </span>
              <span className="preparing">
                <i className="ti ti-tools-kitchen-2"></i> Preparing
              </span>
              <span className="complete">
                <i className="ti ti-circle-check"></i> Complete
              </span>

              {/* Back to admin dashboard */}
              <button
                onClick={() => {
                  if (user.role === 'Admin') router.push('/masterlist');
                  else if (user.role === 'Manager') router.push('/reports');
                  else router.push('/order');
                }}
                className="report-action-btn"
                style={{ marginLeft: '20px' }}
              >
                <i className="ti ti-arrow-left"></i> Dashboard
              </button>
            </div>
          </div>

          {/* 3 columns: Pending · Preparing · Complete */}
          <div className="order-columns">

            {/* ========== PENDING ========== */}
            <div className="column">
              <div className="column-header">
                <span>
                  <i className="ti ti-hourglass-low" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
                  Pending
                </span>
                <span className="badge">
                  {pendingOrders.length} {pendingOrders.length === 1 ? 'order' : 'orders'}
                </span>
              </div>
              <div>
                {pendingOrders.map(order => (
                  <KdsCard key={order.order_no} order={order} onCardClick={handleCardClick} getIcon={getItemIcon} />
                ))}
                {pendingOrders.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 10px', fontSize: '0.9rem' }}>
                    No pending orders
                  </div>
                )}
              </div>
            </div>

            {/* ========== PREPARING ========== */}
            <div className="column">
              <div className="column-header">
                <span>
                  <i className="ti ti-tools-kitchen-2" style={{ color: '#3b82f6', marginRight: '8px' }}></i>
                  Preparing
                </span>
                <span className="badge">
                  {preparingOrders.length} {preparingOrders.length === 1 ? 'order' : 'orders'}
                </span>
              </div>
              <div>
                {preparingOrders.map(order => (
                  <KdsCard key={order.order_no} order={order} onCardClick={handleCardClick} getIcon={getItemIcon} />
                ))}
                {preparingOrders.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 10px', fontSize: '0.9rem' }}>
                    No items currently cooking
                  </div>
                )}
              </div>
            </div>

            {/* ========== COMPLETE ========== */}
            <div className="column">
              <div className="column-header">
                <span>
                  <i className="ti ti-circle-check" style={{ color: 'var(--success)', marginRight: '8px' }}></i>
                  Complete
                </span>
                <span className="badge">
                  {completeOrders.length} {completeOrders.length === 1 ? 'order' : 'orders'}
                </span>
              </div>
              <div>
                {completeOrders.map(order => (
                  <KdsCard key={order.order_no} order={order} onCardClick={handleCardClick} getIcon={getItemIcon} />
                ))}
                {completeOrders.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 10px', fontSize: '0.9rem' }}>
                    No orders completed yet
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <i className="ti ti-help-circle modal-icon"></i>
              <h2>{modalConfig.title}</h2>
            </div>
            <div className="modal-body">
              <p>{modalConfig.message}</p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setConfirmModal({ isOpen: false, orderNo: '', nextStatus: '' })}
                className="modal-btn btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={executeStatusChange}
                className="modal-btn btn-confirm"
              >
                {modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KdsCard({
  order,
  onCardClick,
  getIcon
}: {
  order: KitchenOrder;
  onCardClick: (orderNo: string, status: string) => void;
  getIcon: (name: string) => string;
}) {
  return (
    <div
      className={`order-card status-${order.status.toLowerCase()}`}
      onClick={() => onCardClick(order.order_no, order.status)}
    >
      {/* Top Banner — collage of item images */}
      <div className="order-banner">
        {(() => {
          // Deduplicate images (one per unique item image)
          const images = order.items
            .map(i => i.image)
            .filter((img): img is string => !!img)
            .filter((img, idx, arr) => arr.indexOf(img) === idx);

          if (images.length === 0) {
            return <img src="/food_banner.png" alt="Order Banner" />;
          }

          const countClass =
            images.length === 1 ? 'count-1' :
              images.length === 2 ? 'count-2' :
                images.length === 3 ? 'count-3' : 'count-4plus';

          // Show max 4 cells; last cell gets a "+N more" overlay if extras
          const visible = images.slice(0, 4);
          const extra = images.length - 4;

          return (
            <div className={`banner-collage ${countClass}`}>
              {visible.map((img, idx) => {
                const isLast = idx === 3 && extra > 0;
                return (
                  <div
                    key={idx}
                    className={`collage-cell${isLast ? ' more-overlay' : ''}`}
                    {...(isLast ? { 'data-more': `+${extra + 1}` } : {})}
                  >
                    <img src={`/uploads/${img}`} alt="" />
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Card Body Content */}
      <div className="order-card-content">
        {/* Header row: badge overlapping image + title text */}
        <div className="order-header-inline">
          <div className="order-brand-badge">
            <i className="ti ti-armchair"></i>
            <span className="order-brand-label">T-{order.table_number}</span>
          </div>
          <div className="order-header-text">
            <span className="order-title">Order #{order.order_no}</span>
            <span className="order-price" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {(() => {
                const raw = order.date_and_time || '';
                const d = new Date(raw);
                if (isNaN(d.getTime())) {
                  // Fallback: try replacing space with T for ISO parsing
                  const d2 = new Date(raw.replace(' ', 'T'));
                  if (!isNaN(d2.getTime())) {
                    return d2.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                  }
                  return raw;
                }
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
              })()}
            </span>
          </div>
        </div>

        {/* Timeline representation of Received state & Order Items */}
        <div className="order-timeline">


          {/* Item Nodes */}
          {order.items.map((item, index) => {
            const isVeg = item.name.toLowerCase().includes('veg') ||
              item.name.toLowerCase().includes('paneer') ||
              item.name.toLowerCase().includes('chana');
            return (
              <div key={index} className="timeline-node">
                <div className="node-icon-wrapper">
                  <div className="node-dot gray-dot"></div>
                </div>
                <div className="node-item-text">
                  <span className="node-item-qty">{item.qty}x</span>
                  <span>
                    {item.name}
                    {isVeg && <span className="veg-badge">VEG</span>}
                  </span>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
