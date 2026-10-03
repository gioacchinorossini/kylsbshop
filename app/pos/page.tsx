'use client';

import { Navbar } from '@/components/Navbar';
import { useCashierOrders, CashierTab } from '@/hooks/useCashierOrders';
import { Order } from '@/types/database';
import { playOrderChime } from '@/lib/audio/chime';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  Receipt,
  Archive,
  Clock,
  Utensils,
  Check,
  X,
  RotateCcw,
  Bell,
  RefreshCw,
  Plus,
} from 'lucide-react';

export default function CashierPosPage() {
  const {
    tab,
    setTab,
    orders,
    allActiveOrders,
    archivedOrders,
    pendingOrdersCount,
    activeTableOrdersCount,
    archivedOrdersCount,
    loading,
    connectionStatus,
    refreshOrders,
    acceptAndMarkPaid,
    cancelOrder,
    archiveOrder,
    archiveTableOrders,
    unarchiveOrder,
  } = useCashierOrders();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedTableToArchive, setSelectedTableToArchive] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Distinct tables that have active orders
  const activeTables = useMemo(() => {
    const tableSet = new Set<string>();
    allActiveOrders.forEach((o) => {
      const num = o.dining_table?.table_number
        ? String(o.dining_table.table_number)
        : o.customer_notes?.match(/table\s*(\d+)/i)?.[1] ||
          o.customer_name?.match(/table\s*(\d+)/i)?.[1];
      if (num) tableSet.add(num);
    });
    return Array.from(tableSet).sort((a, b) => Number(a) - Number(b));
  }, [allActiveOrders]);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

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
      showNotification('Order marked as paid & completed.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setProcessingId(orderId);
    try {
      await cancelOrder(orderId);
      showNotification('Order cancelled.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleArchive = async (orderId: string, tableLabel?: string) => {
    setProcessingId(orderId);
    try {
      await archiveOrder(orderId);
      showNotification(
        tableLabel
          ? `Order archived. ${tableLabel} is now cleared for new incoming customers.`
          : 'Order archived and cleared from active table queue.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleArchiveTable = async (tableNum: string) => {
    if (!tableNum) return;
    if (
      !confirm(
        `Are you sure you want to archive all orders for Table ${tableNum}? This will clear the table so new customers can order fresh.`
      )
    ) {
      return;
    }

    setProcessingId(`table-${tableNum}`);
    try {
      const res = await archiveTableOrders(tableNum);
      if (res.success) {
        showNotification(
          `Table ${tableNum} archived. ${res.data?.count ?? 0} order(s) archived. Table is now cleared.`
        );
        setSelectedTableToArchive('');
      } else {
        alert(res.error || 'Failed to archive table orders.');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnarchive = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await unarchiveOrder(orderId);
      showNotification('Order restored to active orders.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Notification Banner */}
          {actionMessage && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400" />
                <span>{actionMessage}</span>
              </div>
              <button
                onClick={() => setActionMessage(null)}
                className="text-emerald-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Terminal Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
                  <Receipt size={24} className="text-amber-400" />
                  <span>Cashier Terminal</span>
                </h1>
                {getStatusBadge(connectionStatus)}
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Live incoming table orders. Accept payments, manage tickets, and archive completed tables when new customers arrive.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Audio chime test button */}
              <button
                onClick={() => playOrderChime()}
                title="Test notification alert chime"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition flex items-center gap-1.5 shadow-sm"
              >
                <Bell size={13} />
                <span>Test Chime</span>
              </button>

              {/* Manual refresh button */}
              <button
                onClick={() => refreshOrders()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>

              <Link
                href="/menu"
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Plus size={14} />
                <span>New Order</span>
              </Link>
            </div>
          </header>

          {/* Tabs & Table Archive Bar */}
          <div className="space-y-4">
            {/* View Selector Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 p-2 rounded-2xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTab('pending')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                    tab === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Clock size={14} />
                  <span>Pending Incoming</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      tab === 'pending'
                        ? 'bg-slate-950 text-amber-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {pendingOrdersCount}
                  </span>
                </button>

                <button
                  onClick={() => setTab('active')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                    tab === 'active'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Utensils size={14} />
                  <span>All Active Tables</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      tab === 'active'
                        ? 'bg-slate-950 text-amber-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {activeTableOrdersCount}
                  </span>
                </button>

                <button
                  onClick={() => setTab('archived')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                    tab === 'archived'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Archive size={14} />
                  <span>Archived</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      tab === 'archived'
                        ? 'bg-slate-950 text-amber-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {archivedOrdersCount}
                  </span>
                </button>
              </div>

              {/* Quick Clear Table Tool */}
              <div className="flex items-center gap-2 px-2">
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap hidden lg:inline">
                  Clear Table for Next Guest:
                </span>
                <select
                  value={selectedTableToArchive}
                  onChange={(e) => setSelectedTableToArchive(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Active Table...</option>
                  {activeTables.map((t) => (
                    <option key={t} value={t}>
                      Table {t}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleArchiveTable(selectedTableToArchive)}
                  disabled={!selectedTableToArchive || processingId === `table-${selectedTableToArchive}`}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-200 hover:text-red-300 border border-slate-700 hover:border-red-500/40 rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
                  title="Archive all orders for this table so incoming new customers get a fresh empty table receipt"
                >
                  <Archive size={13} />
                  <span>Archive Table</span>
                </button>
              </div>
            </div>

            {/* Explanatory helper pill */}
            <div className="flex items-center justify-between text-xs px-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">Tip:</span>
                <span>
                  Archiving an order or table clears it from customer status so when new customers sit down and order, they start with a clean receipt.
                </span>
              </div>
              <span className="text-slate-500 hidden sm:inline">
                {tab === 'archived' ? 'Viewing archived order history' : 'Realtime WebSocket stream active'}
              </span>
            </div>
          </div>

          {/* Content Body */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 text-sm">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            /* Empty State */
            <div className="py-24 text-center space-y-4 bg-slate-900/30 border border-slate-800/80 rounded-3xl max-w-xl mx-auto my-8 p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
                {tab === 'archived' ? (
                  <Archive className="w-8 h-8 text-slate-500" strokeWidth={1.5} />
                ) : (
                  <Receipt className="w-8 h-8 text-slate-500" strokeWidth={1.5} />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">
                  {tab === 'pending'
                    ? 'No pending table orders'
                    : tab === 'active'
                    ? 'No active table orders'
                    : 'No archived orders'}
                </h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                  {tab === 'pending'
                    ? 'When customers place an order from their table QR code, tickets appear here instantly with sound alert.'
                    : tab === 'active'
                    ? 'All tables are currently clear. When new customers order, active table tickets will appear here.'
                    : 'When you archive completed table orders, they will be archived here for record keeping.'}
                </p>
              </div>
              {tab !== 'archived' && (
                <div className="pt-2">
                  <Link
                    href="/menu"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                  >
                    Go to Menu & Place Test Order
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Order Tickets Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => (
                <OrderTicketCard
                  key={order.id}
                  order={order}
                  isArchivedView={tab === 'archived'}
                  isProcessing={processingId === order.id}
                  onAccept={() => handleAccept(order.id)}
                  onCancel={() => handleCancel(order.id)}
                  onArchive={() => {
                    const label = order.dining_table
                      ? `Table ${order.dining_table.table_number}`
                      : 'Takeaway';
                    handleArchive(order.id, label);
                  }}
                  onUnarchive={() => handleUnarchive(order.id)}
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
  isArchivedView,
  isProcessing,
  onAccept,
  onCancel,
  onArchive,
  onUnarchive,
}: {
  order: Order;
  isArchivedView: boolean;
  isProcessing: boolean;
  onAccept: () => void;
  onCancel: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
}) {
  // Format table label
  const tableLabel = order.dining_table
    ? `Table ${String(order.dining_table.table_number).padStart(2, '0')}`
    : order.customer_notes?.match(/table\s*(\d+)/i)?.[0] || 'Takeaway / Guest';

  // Format timestamp
  const orderTime = order.created_at
    ? new Date(order.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  const items = order.order_items || [];
  const isArchived = order.status === 'Archived' || (order.status as string) === 'archived';
  const isCompleted = order.status === 'completed';
  const isPending = order.status === 'pending';

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all border ${
        isArchived
          ? 'bg-slate-900/50 border-slate-800 opacity-80 hover:opacity-100'
          : isCompleted
          ? 'bg-slate-900 border-emerald-900/40 hover:border-emerald-700/60'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Ticket Header */}
      <div>
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-sm rounded-lg">
                <Utensils size={13} />
                <span>{tableLabel}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {order.order_number}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{order.customer_name || 'Guest'}</span>
              <span>•</span>
              <span className="text-slate-500 font-mono">{orderTime}</span>
            </div>
          </div>

          <div>
            {isArchived ? (
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-black uppercase rounded tracking-wider">
                ARCHIVED
              </span>
            ) : isCompleted ? (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase rounded tracking-wider">
                PAID & COMPLETED
              </span>
            ) : isPending ? (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase rounded tracking-wider">
                UNPAID
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase rounded tracking-wider">
                {order.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Customer Notes */}
        {order.customer_notes && (
          <div className="mt-3 p-2 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-amber-200/90 italic">
            Note: {order.customer_notes}
          </div>
        )}

        {/* Ordered Items List */}
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Ordered Items ({items.reduce((acc, cur) => acc + cur.quantity, 0)}):
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
            {isCompleted || isArchived ? 'Total Amount:' : 'Total Due:'}
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            ₱{Number(order.total_amount).toFixed(2)}
          </span>
        </div>

        {/* Actions according to view / status */}
        {isArchivedView || isArchived ? (
          <div className="pt-1">
            <button
              onClick={onUnarchive}
              disabled={isProcessing}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Restore to Active Orders</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              {/* Cancel Order */}
              <button
                onClick={onCancel}
                disabled={isProcessing}
                className="py-2.5 px-2 bg-slate-800/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>

              {/* Accept & Mark Paid */}
              <button
                onClick={onAccept}
                disabled={isProcessing || isCompleted}
                className={`py-2.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  isCompleted
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 disabled:opacity-50'
                }`}
              >
                {isProcessing ? (
                  <span>Saving...</span>
                ) : isCompleted ? (
                  <span className="flex items-center gap-1">
                    <Check size={14} /> Paid
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Check size={14} /> Accept & Paid
                  </span>
                )}
              </button>
            </div>

            {/* Archive Order / Clear Table Button */}
            <button
              onClick={onArchive}
              disabled={isProcessing}
              title="Archive this order to remove it from the table so a new customer can order"
              className="w-full py-2 px-3 bg-slate-950 hover:bg-amber-500/15 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/30 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Archive size={14} />
              <span>Archive Table Order</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
