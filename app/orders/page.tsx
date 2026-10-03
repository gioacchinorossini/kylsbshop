'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { getActiveOrdersAction } from '@/app/actions/orders';
import { Order, OrderStatus } from '@/types/database';
import { subscribeToOrdersRealtime } from '@/lib/realtime/orders';
import { CustomerStatusContent } from '@/app/status/page';
import Link from 'next/link';

function ActiveOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table');

  useEffect(() => {
    // If a customer at a table lands on cashier orders page, redirect to customer status
    if (tableParam) {
      router.replace(`/status?table=${encodeURIComponent(tableParam)}`);
    }
  }, [tableParam, router]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTING');
  const [viewFilter, setViewFilter] = useState<'active' | 'all'>('active');

  const fetchOrders = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      // includeAll = true if viewFilter is 'all'
      const res = await getActiveOrdersAction(viewFilter === 'all');
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [viewFilter]);

  useEffect(() => {
    fetchOrders(false);

    // Subscribe to live Supabase Realtime changes on orders
    const unsubscribe = subscribeToOrdersRealtime({
      onNewOrder: () => {
        // Refetch to pull joined order_items and dining_table records
        fetchOrders(true);
      },
      onOrderUpdated: (updatedOrder) => {
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === updatedOrder.id);
          if (!exists) return prev;
          return prev.map((o) =>
            o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
          );
        });
        // Background refresh to guarantee nested items match
        fetchOrders(true);
      },
      onOrderDeleted: (orderId) => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [fetchOrders]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pending / Unpaid
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Preparing
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Ready
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Paid & Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Cancelled
          </span>
        );
      case 'Archived':
      case 'archived':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Archived
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const getRealtimeIndicator = (status: string) => {
    switch (status) {
      case 'SUBSCRIBED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE STREAM
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold rounded-full">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            CONNECTING...
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
                <span>📋 Live Orders Tracker</span>
              </h1>
              {getRealtimeIndicator(connectionStatus)}
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Live status of customer table orders synchronized instantly via Supabase Realtime WebSocket streams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchOrders(false)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition flex items-center gap-1.5"
            >
              <span>🔄 Refresh</span>
            </button>
            <Link
              href="/?table=1"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20"
            >
              + Place Test Order
            </Link>
          </div>
        </header>

        {/* View Filter Tabs & Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 px-5 py-3 rounded-2xl">
          <div className="flex gap-2">
            <button
              onClick={() => setViewFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewFilter === 'active'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Orders ({orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setViewFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewFilter === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Records
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Total Orders in View: <span className="text-white font-bold">{orders.length}</span>
          </div>
        </div>

        {/* Orders List / Cards */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-sm">Fetching live orders from database...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty state only when DB returns 0 records */
          <div className="py-24 text-center space-y-4 bg-slate-900/30 border border-slate-800 rounded-3xl max-w-lg mx-auto my-8 p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-3xl flex items-center justify-center mx-auto shadow-inner">
              📭
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">No active orders right now</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                When dining customers place an order from their table QR code, it will automatically appear here in real-time.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/?table=1"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition"
              >
                Place a Test Table Order &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orders.map((order) => {
              const tableNum = order.dining_table
                ? String(order.dining_table.table_number).padStart(2, '0')
                : null;
              const items = order.order_items || [];
              const timeDisplay = order.created_at
                ? new Date(order.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Just now';

              return (
                <div
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-sm rounded-lg">
                            {tableNum ? `🍽️ Table ${tableNum}` : '🥡 Takeaway / Guest'}
                          </span>
                          <span className="font-mono text-xs text-slate-400">
                            {order.order_number}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <span>👤 {order.customer_name || 'Guest'}</span>
                          <span>•</span>
                          <span className="text-slate-500 font-mono">🕒 {timeDisplay}</span>
                        </div>
                      </div>

                      <div>{getStatusBadge(order.status)}</div>
                    </div>

                    {/* Customer Notes */}
                    {order.customer_notes && (
                      <div className="mt-2.5 p-2 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-amber-200/90 italic">
                        📝 {order.customer_notes}
                      </div>
                    )}

                    {/* Itemized List */}
                    <div className="mt-4 space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Itemized Dishes ({items.reduce((acc, i) => acc + i.quantity, 0)} items):
                      </div>
                      <div className="divide-y divide-slate-800/60">
                        {items.length === 0 ? (
                          <div className="py-2 text-xs text-slate-500 italic">
                            No dish details available
                          </div>
                        ) : (
                          items.map((item, idx) => (
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
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Total Price */}
                  <div className="border-t border-slate-800 pt-3.5 flex items-baseline justify-between">
                    <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                      Total Order Price:
                    </span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      ₱{Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

function OrdersRouteDispatcher() {
  const searchParams = useSearchParams();
  const isStaff = searchParams.get('staff') === 'true';

  if (!isStaff) {
    return <CustomerStatusContent />;
  }

  return <ActiveOrdersContent />;
}

export default function ActiveOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrdersRouteDispatcher />
    </Suspense>
  );
}

