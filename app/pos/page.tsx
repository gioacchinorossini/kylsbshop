'use client';

import { Navbar } from '@/components/Navbar';
import { useCashierOrders } from '@/hooks/useCashierOrders';
import { Order } from '@/types/database';
import { playOrderChime } from '@/lib/audio/chime';
import Link from 'next/link';
import { useState } from 'react';

export default function CashierPosPage() {
  const {
    orders,
    loading,
    connectionStatus,
    refreshOrders,
    acceptAndMarkPaid,
    cancelOrder,
  } = useCashierOrders();

  const [processingId, setProcessingId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBSCRIBED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE REALTIME ACTIVE
          </span>
        );
      case 'CLOSED':
      case 'CHANNEL_ERROR':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            REALTIME RECONNECTING...
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold rounded-full">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
            CONNECTING...
          </span>
        );
    }
  };

  const handleAccept = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await acceptAndMarkPaid(orderId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setProcessingId(orderId);
    try {
      await cancelOrder(orderId);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Terminal Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
                <span>💵 Cashier Terminal</span>
              </h1>
              {getStatusBadge(connectionStatus)}
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Live incoming table orders. Review tickets, accept payments, and manage order flow.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Audio chime test button */}
            <button
              onClick={() => playOrderChime()}
              title="Test notification alert chime"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition flex items-center gap-1.5 shadow-sm"
            >
              <span>🔔 Test Chime</span>
            </button>

            {/* Manual refresh button */}
            <button
              onClick={() => refreshOrders()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition flex items-center gap-1.5 shadow-sm"
            >
              <span>🔄 Refresh</span>
            </button>

            <Link
              href="/menu"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <span>+ New Order</span>
            </Link>
          </div>
        </header>

        {/* Queue Summary Bar */}
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 px-5 py-3.5 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-300">Pending Incoming Orders:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950">
              {orders.length}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Realtime WebSocket stream active
          </span>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-sm">Checking for pending orders...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="py-24 text-center space-y-4 bg-slate-900/30 border border-slate-800/80 rounded-3xl max-w-xl mx-auto my-8 p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-3xl flex items-center justify-center mx-auto shadow-inner">
              🧾
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">No pending table orders</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                When customers place an order from their table QR code, the order ticket will appear here instantly with sound alert.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Go to Menu & Place Test Order →
              </Link>
            </div>
          </div>
        ) : (
          /* Order Tickets Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <OrderTicketCard
                key={order.id}
                order={order}
                isProcessing={processingId === order.id}
                onAccept={() => handleAccept(order.id)}
                onCancel={() => handleCancel(order.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

// ─── Order Ticket Card Component ───
function OrderTicketCard({
  order,
  isProcessing,
  onAccept,
  onCancel,
}: {
  order: Order;
  isProcessing: boolean;
  onAccept: () => void;
  onCancel: () => void;
}) {
  // Format table label
  const tableLabel = order.dining_table
    ? `Table ${String(order.dining_table.table_number).padStart(2, '0')}`
    : 'Takeaway / Guest';

  // Format timestamp
  const orderTime = order.created_at
    ? new Date(order.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  const items = order.order_items || [];

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all">
      {/* Ticket Header */}
      <div>
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-sm rounded-lg">
                🍽️ {tableLabel}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {order.order_number}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>👤 {order.customer_name || 'Guest'}</span>
              <span>•</span>
              <span className="text-slate-500 font-mono">🕒 {orderTime}</span>
            </div>
          </div>

          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase rounded tracking-wider">
            UNPAID
          </span>
        </div>

        {/* Customer Notes */}
        {order.customer_notes && (
          <div className="mt-3 p-2 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-amber-200/90 italic">
            📝 Note: {order.customer_notes}
          </div>
        )}

        {/* Ordered Items List */}
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Ordered Items:
          </div>
          <div className="divide-y divide-slate-800/60">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="py-2 flex items-start justify-between gap-2 text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold text-amber-400">
                      {item.quantity}×
                    </span>
                    <span className="text-slate-200 font-medium">
                      {item.menu_item_name}
                    </span>
                  </div>
                  {item.special_instructions && (
                    <div className="text-[11px] text-slate-400 italic mt-0.5 pl-4">
                      ↳ {item.special_instructions}
                    </div>
                  )}
                </div>

                <div className="text-right font-mono">
                  <div className="text-slate-200 font-bold">
                    ₱{Number(item.subtotal || item.unit_price * item.quantity).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    ₱{Number(item.unit_price).toFixed(2)} ea
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Footer & Actions */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        {/* Total Price */}
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
            Total Due:
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            ₱{Number(order.total_amount).toFixed(2)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Cancel Order */}
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full py-2.5 px-3 bg-slate-800/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>❌ Cancel</span>
          </button>

          {/* Accept & Mark Paid */}
          <button
            onClick={onAccept}
            disabled={isProcessing}
            className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isProcessing ? (
              <span>Saving...</span>
            ) : (
              <span>✅ Accept & Paid</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
