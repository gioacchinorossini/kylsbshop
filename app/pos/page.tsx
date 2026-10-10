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
  Package,
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
    acceptAndMarkPaidBatch,
    completePaymentBatch,
    cancelOrder,
    archiveOrder,
    archiveTableOrders,
    unarchiveOrder,
  } = useCashierOrders();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedTableToArchive, setSelectedTableToArchive] = useState<string>('');
  const [archiveTableTarget, setArchiveTableTarget] = useState<string | null>(null);
  const [tenderModal, setTenderModal] = useState<{
    isOpen: boolean;
    tableNumber: string;
    orderIds: string[];
    totalDue: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');
  const [tenderAmount, setTenderAmount] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Group unpaid/active orders by table number
  const groupedOrders = useMemo(() => {
    if (tab === 'archived') {
      return orders.map((o) => ({
        key: o.id,
        tableLabel: extractTableInfo(o).label,
        tableNumber: extractTableInfo(o).number,
        orders: [o],
      }));
    }

    const map = new Map<string, { tableLabel: string; tableNumber: string | null; orders: Order[] }>();

    orders.forEach((order) => {
      const { key, label, number } = extractTableInfo(order);
      const existing = map.get(key);
      if (existing) {
        existing.orders.push(order);
      } else {
        map.set(key, { tableLabel: label, tableNumber: number, orders: [order] });
      }
    });

    return Array.from(map.entries()).map(([key, value]) => ({
      key,
      tableLabel: value.tableLabel,
      tableNumber: value.tableNumber,
      orders: value.orders,
    }));
  }, [orders, tab]);

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
          <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-bold rounded-full">
            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
            CONNECTING...
          </span>
        );
    }
  };

  const handleOpenTenderModal = (
    orderIds: string[],
    tableNumber: string,
    totalDue: number
  ) => {
    setPaymentMethod('cash');
    setTenderAmount('');
    setReferenceNumber('');
    setTenderModal({
      isOpen: true,
      tableNumber,
      orderIds,
      totalDue,
    });
  };

  const handleCloseTenderModal = () => {
    setTenderModal(null);
  };

  const handleConfirmPayment = async () => {
    if (!tenderModal) return;
    const { orderIds, tableNumber, totalDue } = tenderModal;
    const tendered = tenderAmount === '' ? 0 : parseFloat(tenderAmount) || 0;
    const change = Math.max(0, tendered - totalDue);

    setProcessingId(`tender-${orderIds.join('-')}`);
    try {
      const res = await completePaymentBatch(orderIds, {
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'cash' ? tendered : totalDue,
        change_given: paymentMethod === 'cash' ? change : 0,
        reference_number: paymentMethod === 'gcash' ? referenceNumber.trim() : undefined,
      });

      if (res.success) {
        const cleanTable = tableNumber.replace(/^table\s*/i, '').trim();
        showNotification(
          `Payment confirmed for Table ${cleanTable}. Ticket(s) marked as paid.`
        );
        setTenderModal(null);
      } else {
        alert(res.error || 'Failed to complete payment.');
      }
    } finally {
      setProcessingId(null);
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

  const handleAcceptBatch = async (orderIds: string[], tableLabel: string) => {
    if (orderIds.length === 0) return;
    setProcessingId(`batch-${orderIds.join('-')}`);
    try {
      const res = await acceptAndMarkPaidBatch(orderIds);
      if (res.success) {
        showNotification(`All tickets for ${tableLabel} marked as paid & completed.`);
      } else {
        alert(res.error || 'Failed to complete table orders.');
      }
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

  const handleArchiveTable = (tableNum: string) => {
    if (!tableNum) return;
    setArchiveTableTarget(tableNum);
  };

  const handleConfirmArchiveTable = async () => {
    if (!archiveTableTarget) return;
    const tableNum = archiveTableTarget;
    setProcessingId(`table-${tableNum}`);
    try {
      const res = await archiveTableOrders(tableNum);
      if (res.success) {
        showNotification(
          `Table ${tableNum} archived. ${res.data?.count ?? 0} order(s) archived. Table is now cleared.`
        );
        if (selectedTableToArchive === tableNum) {
          setSelectedTableToArchive('');
        }
      } else {
        alert(res.error || 'Failed to archive table orders.');
      }
    } finally {
      setProcessingId(null);
      setArchiveTableTarget(null);
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
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
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
                  <Receipt size={24} className="text-amber-400" />
                  <span>Cashier Terminal</span>
                </h1>
                {getStatusBadge(connectionStatus)}
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Live incoming table orders. Accept payments, manage tickets, and archive completed tables when new customers arrive.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Audio chime test button */}
              <button
                onClick={() => playOrderChime()}
                title="Test notification alert chime"
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 transition flex items-center gap-1.5 shadow-sm"
              >
                <Bell size={13} />
                <span>Test Chime</span>
              </button>

              {/* Manual refresh button */}
              <button
                onClick={() => refreshOrders()}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 transition flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>

              <Link
                href="/menu"
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Plus size={14} />
                <span>New Order</span>
              </Link>
            </div>
          </header>

          {/* Tabs & Table Archive Bar */}
          <div className="space-y-4">
            {/* View Selector Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/70 border border-zinc-800 p-2 rounded-2xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTab('pending')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                    tab === 'pending'
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <Clock size={14} />
                  <span>Pending Incoming</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      tab === 'pending'
                        ? 'bg-zinc-950 text-amber-400'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {pendingOrdersCount}
                  </span>
                </button>

                <button
                  onClick={() => setTab('active')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                    tab === 'active'
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <Utensils size={14} />
                  <span>All Active Tables</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      tab === 'active'
                        ? 'bg-zinc-950 text-amber-400'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {activeTableOrdersCount}
                  </span>
                </button>

                <button
                  onClick={() => setTab('archived')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                    tab === 'archived'
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <Archive size={14} />
                  <span>Archived</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      tab === 'archived'
                        ? 'bg-zinc-950 text-amber-400'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {archivedOrdersCount}
                  </span>
                </button>
              </div>

              {/* Quick Clear Table Tool */}
              <div className="flex items-center gap-2 px-2">
                <span className="text-xs text-zinc-400 font-semibold whitespace-nowrap hidden lg:inline">
                  Clear Table for Next Guest:
                </span>
                <select
                  value={selectedTableToArchive}
                  onChange={(e) => setSelectedTableToArchive(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
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
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-200 hover:text-red-300 border border-zinc-700 hover:border-red-500/40 rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
                  title="Archive all orders for this table so incoming new customers get a fresh empty table receipt"
                >
                  <Archive size={13} />
                  <span>Archive Table</span>
                </button>
              </div>
            </div>

            {/* Explanatory helper pill */}
            <div className="flex items-center justify-between text-xs px-2 text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">Tip:</span>
                <span>
                  Archiving an order or table clears it from customer status so when new customers sit down and order, they start with a clean receipt.
                </span>
              </div>
              <span className="text-zinc-500 hidden sm:inline">
                {tab === 'archived' ? 'Viewing archived order history' : 'Realtime WebSocket stream active'}
              </span>
            </div>
          </div>

          {/* Content Body */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-zinc-400 text-sm">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            /* Empty State */
            <div className="py-24 text-center space-y-4 bg-zinc-900/30 border border-zinc-800/80 rounded-3xl max-w-xl mx-auto my-8 p-8">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-inner">
                {tab === 'archived' ? (
                  <Archive className="w-8 h-8 text-zinc-500" strokeWidth={1.5} />
                ) : (
                  <Receipt className="w-8 h-8 text-zinc-500" strokeWidth={1.5} />
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
                <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition"
                  >
                    Go to Menu & Place Test Order
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Order Tickets Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedOrders.map((group) => {
                if (group.orders.length === 1) {
                  const order = group.orders[0];
                  return (
                    <OrderTicketCard
                      key={order.id}
                      order={order}
                      isArchivedView={tab === 'archived'}
                      isProcessing={processingId === order.id || processingId === `tender-${order.id}`}
                      onAccept={() => {
                        const tableNum = group.tableNumber || extractTableInfo(order).number || 'Guest';
                        handleOpenTenderModal([order.id], tableNum, getOrderEffectiveTotal(order));
                      }}
                      onCancel={() => handleCancel(order.id)}
                      onArchive={() => {
                        if (group.tableNumber) {
                          handleArchiveTable(group.tableNumber);
                        } else {
                          handleArchive(order.id, group.tableLabel);
                        }
                      }}
                      onUnarchive={() => handleUnarchive(order.id)}
                    />
                  );
                }

                return (
                  <div key={group.key} className="col-span-1 md:col-span-2 lg:col-span-2">
                    <MultiOrderTableCard
                      tableLabel={group.tableLabel}
                      orders={group.orders}
                      isProcessing={processingId?.startsWith('batch-') || processingId?.startsWith('tender-') || false}
                      processingId={processingId}
                      onAcceptAll={(orderIds) => {
                        const unpaid = group.orders.filter((o) => o.status !== 'completed' && o.status !== 'Archived');
                        const unpaidTotal = unpaid.reduce((sum, o) => sum + getOrderEffectiveTotal(o), 0);
                        const tableNum = group.tableNumber || (group.orders[0] ? extractTableInfo(group.orders[0]).number : null) || 'Guest';
                        handleOpenTenderModal(orderIds, tableNum, unpaidTotal);
                      }}
                      onAcceptOrder={(orderId) => {
                        const targetOrder = group.orders.find((o) => o.id === orderId);
                        const orderTotal = targetOrder ? getOrderEffectiveTotal(targetOrder) : 0;
                        const tableNum = group.tableNumber || (targetOrder ? extractTableInfo(targetOrder).number : null) || 'Guest';
                        handleOpenTenderModal([orderId], tableNum, orderTotal);
                      }}
                      onCancelOrder={(orderId) => handleCancel(orderId)}
                      onArchiveTable={() => {
                        if (group.tableNumber) {
                          handleArchiveTable(group.tableNumber);
                        } else {
                          group.orders.forEach((o) => handleArchive(o.id, group.tableLabel));
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Archive Table Confirmation Modal */}
      {archiveTableTarget && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setArchiveTableTarget(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
              <Archive size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Clear Table {archiveTableTarget.replace(/^table\s*/i, '').trim()}?
            </h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              This will archive all orders and reset the table so the next guest starts with a fresh menu.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setArchiveTableTarget(null)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchiveTable}
                disabled={processingId === `table-${archiveTableTarget}`}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold transition-colors"
              >
                {processingId === `table-${archiveTableTarget}` ? 'Archiving...' : 'Clear & Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Quick-Cash and Tender Change Modal */}
      {tenderModal && tenderModal.isOpen && (() => {
        const tendered = tenderAmount === '' ? 0 : parseFloat(tenderAmount) || 0;
        const change = Math.max(0, tendered - tenderModal.totalDue);
        const isSufficient = tendered >= tenderModal.totalDue;
        const cleanTableNum = tenderModal.tableNumber.replace(/^table\s*/i, '').trim();
        const isConfirmDisabled =
          processingId === `tender-${tenderModal.orderIds.join('-')}` ||
          (paymentMethod === 'cash' && !isSufficient);

        return (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseTenderModal}
          >
            <div
              className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt size={18} className="text-amber-400" />
                  <span>Settle Payment • Table {cleanTableNum}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleCloseTenderModal}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Total Display */}
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 text-center">
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-zinc-400 block mb-1">
                  Total Due
                </span>
                <span className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight">
                  ₱{tenderModal.totalDue.toFixed(2)}
                </span>
                <span className="text-[11px] text-zinc-500 block mt-1">
                  {tenderModal.orderIds.length} ticket(s) to settle
                </span>
              </div>

              {/* Payment Method Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition ${
                      paymentMethod === 'cash'
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gcash')}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition ${
                      paymentMethod === 'gcash'
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    GCash / Maya
                  </button>
                </div>
              </div>

              {/* Cash Controls */}
              {paymentMethod === 'cash' ? (
                <div className="space-y-4">
                  {/* Quick Tender Buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Quick Tender
                      </span>
                      {tenderAmount !== '' && (
                        <button
                          type="button"
                          onClick={() => setTenderAmount('')}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTenderAmount(tenderModal.totalDue.toFixed(2))}
                        className={`px-2 py-2.5 rounded-xl text-xs font-bold transition border text-center ${
                          tenderAmount === tenderModal.totalDue.toFixed(2)
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-md'
                            : 'bg-zinc-800 hover:bg-zinc-700 active:bg-amber-500 active:text-zinc-950 text-zinc-200 border-zinc-700/60'
                        }`}
                      >
                        Exact ₱{tenderModal.totalDue.toFixed(2)}
                      </button>
                      <button
                        type="button"
                        disabled={tenderModal.totalDue > 500}
                        onClick={() => setTenderAmount('500')}
                        className={`px-2 py-2.5 rounded-xl text-xs font-bold transition border text-center ${
                          tenderAmount === '500'
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-md'
                            : 'bg-zinc-800 hover:bg-zinc-700 active:bg-amber-500 active:text-zinc-950 text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed border-zinc-700/60'
                        }`}
                      >
                        ₱500
                      </button>
                      <button
                        type="button"
                        disabled={tenderModal.totalDue > 1000}
                        onClick={() => setTenderAmount('1000')}
                        className={`px-2 py-2.5 rounded-xl text-xs font-bold transition border text-center ${
                          tenderAmount === '1000'
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-md'
                            : 'bg-zinc-800 hover:bg-zinc-700 active:bg-amber-500 active:text-zinc-950 text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed border-zinc-700/60'
                        }`}
                      >
                        ₱1,000
                      </button>
                    </div>
                  </div>

                  {/* Custom Tender Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Amount Tendered
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-bold text-sm">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={tenderAmount}
                        onChange={(e) => setTenderAmount(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Live Change Calculation */}
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-400 block">
                        Change Due:
                      </span>
                      {tenderAmount !== '' && !isSufficient && (
                        <span className="text-[11px] text-amber-400 font-medium">
                          Short by ₱{(tenderModal.totalDue - tendered).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      ₱{change.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                /* GCash / Maya Controls */
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1029384756"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none transition"
                    />
                  </div>
                  <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-zinc-400 leading-relaxed">
                    Verify QR payment confirmation on your merchant terminal or app before completing.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleCloseTenderModal}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl font-bold transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isConfirmDisabled}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  {processingId === `tender-${tenderModal.orderIds.join('-')}` ? (
                    <span>Processing...</span>
                  ) : (
                    <span>Confirm Payment</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Helper to extract table key, label, and number from order
function extractTableInfo(order: Order): { key: string; label: string; number: string | null } {
  if (order.dining_table?.table_number) {
    const num = String(order.dining_table.table_number).padStart(2, '0');
    return { key: `table-${num}`, label: `Table ${num}`, number: num };
  }
  const matchNotes = order.customer_notes?.match(/table\s*(\d+)/i)?.[1];
  if (matchNotes) {
    const num = matchNotes.padStart(2, '0');
    return { key: `table-${num}`, label: `Table ${num}`, number: num };
  }
  const matchName = order.customer_name?.match(/table\s*(\d+)/i)?.[1];
  if (matchName) {
    const num = matchName.padStart(2, '0');
    return { key: `table-${num}`, label: `Table ${num}`, number: num };
  }
  return { key: `order-${order.id}`, label: 'Takeaway / Guest', number: null };
}

// ─── Helper for effective order total (including packaging fee) ───
function getOrderEffectiveTotal(order: Order): number {
  const itemsSubtotal = (order.order_items || []).reduce((sum, item) => {
    const price = Number((item as any).price ?? item.unit_price ?? 0);
    return sum + price * Number(item.quantity || 1);
  }, 0);
  const pkgFee = Number(order.packaging_fee || 0);
  const calculatedGrandTotal = itemsSubtotal + pkgFee;

  if (calculatedGrandTotal > 0) {
    return Math.max(Number(order.total_amount || 0), calculatedGrandTotal);
  }
  return Number(order.total_amount || 0) + pkgFee;
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

  const isTakeOut =
    order.order_type === 'take_out' ||
    order.order_type === 'takeaway' ||
    (order.order_type as string) === 'take-out' ||
    ((order as unknown as { orderType?: string }).orderType === 'take_out') ||
    ((order as unknown as { orderType?: string }).orderType === 'takeaway') ||
    ((order as unknown as { orderType?: string }).orderType === 'take-out');

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all border ${
        isArchived
          ? 'bg-zinc-900/50 border-zinc-800 opacity-80 hover:opacity-100'
          : isCompleted
          ? 'bg-zinc-900 border-emerald-900/40 hover:border-emerald-700/60'
          : isTakeOut
          ? 'bg-zinc-900 border-amber-700/30 hover:border-amber-600/50'
          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Ticket Header */}
      <div>
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-sm rounded-lg">
                <Utensils size={13} />
                <span>{tableLabel}</span>
              </span>
              {/* Order type badge */}
              {isTakeOut ? (
                <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wide bg-amber-500 text-black">
                  Take-Out
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-blue-600 text-white">
                  Dine-In
                </span>
              )}
              <span className="text-xs text-zinc-400 font-mono">
                {order.order_number}
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span>{order.customer_name || 'Guest'}</span>
              <span>•</span>
              <span className="text-zinc-500 font-mono">{orderTime}</span>
            </div>
          </div>

          <div>
            {isArchived ? (
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-black uppercase rounded tracking-wider">
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
          <div className="mt-3 p-2 bg-zinc-950/60 border border-zinc-800/80 rounded-lg text-xs text-amber-200/90 italic">
            Note: {order.customer_notes}
          </div>
        )}

        {/* Ordered Items List */}
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Ordered Items ({items.reduce((acc, cur) => acc + cur.quantity, 0)}):
          </div>
          <div className="divide-y divide-zinc-800/60">
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
                    <span className="text-zinc-200 font-medium">
                      {item.menu_item_name}
                    </span>
                  </div>
                  {item.special_instructions && (
                    <div className="text-[11px] text-zinc-400 italic mt-0.5 pl-4">
                      ↳ {item.special_instructions}
                    </div>
                  )}
                </div>

                <div className="text-right font-mono">
                  <div className="text-zinc-200 font-bold">
                    ₱{Number(item.subtotal || item.unit_price * item.quantity).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    ₱{Number(item.unit_price).toFixed(2)} ea
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Packaging Fee row if > 0 */}
          {Number(order.packaging_fee || 0) > 0 && (
            <div className="pt-2 flex items-center justify-between text-xs text-amber-400 font-medium border-t border-zinc-800">
              <span className="flex items-center gap-1">
                <Package size={13} />
                <span>Packaging Fee (₱10/tub)</span>
              </span>
              <span className="font-mono font-bold">
                ₱{Number(order.packaging_fee).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Footer & Actions */}
      <div className="border-t border-zinc-800 pt-4 space-y-3">
        {/* Total Price */}
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider">
            {isCompleted || isArchived ? 'Total Amount:' : 'Total Due:'}
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            ₱{getOrderEffectiveTotal(order).toFixed(2)}
          </span>
        </div>

        {/* Actions according to view / status */}
        {isArchivedView || isArchived ? (
          <div className="pt-1">
            <button
              onClick={onUnarchive}
              disabled={isProcessing}
              className="w-full py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
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
                className="py-2.5 px-2 bg-zinc-800/80 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-700 hover:border-red-500/40 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
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
                    ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20 disabled:opacity-50'
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
              className="w-full py-2 px-3 bg-zinc-950 hover:bg-amber-500/15 text-zinc-400 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/30 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
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

// ─── Multi-Order Consolidated Table Card Component ───
function MultiOrderTableCard({
  tableLabel,
  orders,
  isProcessing,
  processingId,
  onAcceptAll,
  onAcceptOrder,
  onCancelOrder,
  onArchiveTable,
}: {
  tableLabel: string;
  orders: Order[];
  isProcessing: boolean;
  processingId: string | null;
  onAcceptAll: (orderIds: string[]) => void;
  onAcceptOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onArchiveTable: () => void;
}) {
  const unpaidOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'Archived');
  const allCompleted = orders.length > 0 && unpaidOrders.length === 0;
  const combinedTotal = orders.reduce((sum, o) => sum + getOrderEffectiveTotal(o), 0);
  const unpaidTotal = unpaidOrders.reduce((sum, o) => sum + getOrderEffectiveTotal(o), 0);
  const totalPackaging = orders.reduce((sum, o) => sum + Number(o.packaging_fee || 0), 0);

  return (
    <div className="rounded-3xl p-6 bg-zinc-900 border-2 border-zinc-800 shadow-2xl flex flex-col justify-between space-y-5 transition-all">
      {/* Table Consolidation Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-base rounded-xl">
              <Utensils size={16} />
              <span>{tableLabel}</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {orders.length} Sub-Orders
            </span>
            {totalPackaging > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Package size={13} />
                <span>₱{totalPackaging.toFixed(2)} pkg</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {allCompleted ? (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase rounded-lg tracking-wider">
                ALL PAID & COMPLETED
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase rounded-lg tracking-wider">
                {unpaidOrders.length} UNPAID
              </span>
            )}

            <button
              onClick={onArchiveTable}
              title="Archive all orders for this table to clear it for new customers"
              className="p-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg transition"
            >
              <Archive size={14} />
            </button>
          </div>
        </div>

        {/* Sub-Orders Grid */}
        <div className="mt-4 space-y-4">
          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Consolidated Tickets ({orders.length}):
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {orders.map((order) => {
              const items = order.order_items || [];
              const isOrderCompleted = order.status === 'completed';
              const orderTime = order.created_at
                ? new Date(order.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Just now';

              const isTakeOut =
                order.order_type === 'take_out' ||
                order.order_type === 'takeaway' ||
                (order.order_type as string) === 'take-out' ||
                ((order as unknown as { orderType?: string }).orderType === 'take_out') ||
                ((order as unknown as { orderType?: string }).orderType === 'takeaway') ||
                ((order as unknown as { orderType?: string }).orderType === 'take-out');

              const isOrderProcessing = processingId === order.id;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl p-4 flex flex-col justify-between border bg-zinc-950/70 ${
                    isOrderCompleted
                      ? 'border-emerald-900/40 bg-zinc-950/40'
                      : isTakeOut
                      ? 'border-amber-700/30'
                      : 'border-zinc-800'
                  }`}
                >
                  <div>
                    {/* Sub-order Header */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        {isTakeOut ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-amber-500 text-black">
                            Take-Out
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-blue-600 text-white">
                            Dine-In
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-zinc-300">
                          {order.order_number}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {orderTime}
                      </span>
                    </div>

                    {/* Sub-order Items List */}
                    <div className="py-2.5 space-y-1.5 text-xs">
                      {items.map((item, idx) => (
                        <div key={item.id || idx} className="flex justify-between items-baseline gap-2">
                          <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="font-extrabold text-amber-400 shrink-0">
                              {item.quantity}×
                            </span>
                            <span className="text-zinc-200 truncate">
                              {item.menu_item_name}
                            </span>
                          </div>
                          <span className="font-mono text-zinc-300 shrink-0 font-medium">
                            ₱{Number(item.subtotal || item.unit_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}

                      {/* Sub-order packaging fee */}
                      {Number(order.packaging_fee || 0) > 0 && (
                        <div className="flex justify-between items-center pt-1 text-[11px] text-amber-400 font-medium border-t border-zinc-800/60">
                          <span className="flex items-center gap-1">
                            <Package size={12} />
                            <span>Packaging Fee (₱10/tub)</span>
                          </span>
                          <span className="font-mono font-bold">
                            ₱{Number(order.packaging_fee).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sub-order split billing / action footer */}
                  <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="font-mono">
                      <span className="text-[10px] text-zinc-500 block uppercase">Sub-Total</span>
                      <span className="text-sm font-bold text-emerald-400">
                        ₱{getOrderEffectiveTotal(order).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isOrderCompleted && (
                        <button
                          onClick={() => onCancelOrder(order.id)}
                          disabled={isOrderProcessing || isProcessing}
                          title="Cancel ticket"
                          className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 transition"
                        >
                          <X size={13} />
                        </button>
                      )}

                      <button
                        onClick={() => onAcceptOrder(order.id)}
                        disabled={isOrderCompleted || isOrderProcessing || isProcessing}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          isOrderCompleted
                            ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white border border-zinc-700 active:scale-95'
                        }`}
                      >
                        {isOrderCompleted ? (
                          <>
                            <Check size={12} />
                            <span>Paid</span>
                          </>
                        ) : (
                          <span>Pay Ticket</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multi-Order Table Summary & Batch Action Footer */}
      <div className="border-t border-zinc-800 pt-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider block">
              Consolidated Table Total:
            </span>
            <span className="text-[11px] text-zinc-500">
              {orders.length} tickets combined
            </span>
          </div>
          <span className="text-3xl font-black text-emerald-400 font-mono">
            ₱{combinedTotal.toFixed(2)}
          </span>
        </div>

        {/* Primary Action Button: "Accept & Pay All • ₱{combinedTotal}" */}
        <button
          onClick={() => onAcceptAll(unpaidOrders.map((o) => o.id))}
          disabled={allCompleted || isProcessing}
          className={`w-full py-3.5 px-4 rounded-2xl text-sm font-black transition flex items-center justify-center gap-2 shadow-lg ${
            allCompleted
              ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/25 active:scale-98 disabled:opacity-60'
          }`}
        >
          {isProcessing ? (
            <span>Processing Table Payment...</span>
          ) : allCompleted ? (
            <>
              <Check size={16} />
              <span>All Tickets Paid & Completed</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>Accept & Pay All • ₱{unpaidTotal.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

