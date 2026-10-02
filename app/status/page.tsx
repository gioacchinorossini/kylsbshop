'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChefHat, Clock, Utensils, ReceiptText, ArrowLeft, RefreshCw, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { getOrderByIdAction, getOrdersByTableAction } from '@/app/actions/orders';
import { subscribeToCustomerOrder, subscribeToTableOrders } from '@/lib/realtime/customer-order';
import { Order, OrderStatus } from '@/types/database';

// ─── Theme ────────────────────────────────────────────────────────────────────
type Brand = 'kyles-eatery' | 'batchoy-shop';

const BRAND_THEME = {
  'kyles-eatery': {
    bg: 'bg-white',
    text: 'text-zinc-900',
    subtext: 'text-zinc-500',
    accent: 'text-orange-500',
    accentBg: 'bg-orange-500',
    accentLight: 'bg-orange-50',
    accentBorder: 'border-orange-200',
    tableBadge: 'bg-orange-50 border-orange-200 text-orange-700',
    stepActive: 'bg-orange-500 text-white',
    stepDone: 'bg-orange-100 text-orange-600',
    stepInactive: 'bg-zinc-100 text-zinc-400',
    lineActive: 'bg-orange-400',
    lineInactive: 'bg-zinc-200',
    divider: 'divide-zinc-100',
    dividerBg: 'bg-zinc-100',
    subtleText: 'text-zinc-400',
    brandName: "Kyle's Eatery",
    loaderColor: 'border-orange-500',
    headerBg: 'bg-white/90 border-zinc-100',
    backBtn: 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100',
    footerLink: 'text-zinc-400 hover:text-zinc-700',
  },
  'batchoy-shop': {
    bg: 'bg-zinc-950',
    text: 'text-white',
    subtext: 'text-zinc-400',
    accent: 'text-red-400',
    accentBg: 'bg-red-600',
    accentLight: 'bg-red-950/60',
    accentBorder: 'border-red-800',
    tableBadge: 'bg-red-950/80 border-red-800 text-red-300',
    stepActive: 'bg-red-600 text-white',
    stepDone: 'bg-red-950 text-red-400',
    stepInactive: 'bg-zinc-800 text-zinc-500',
    lineActive: 'bg-red-600',
    lineInactive: 'bg-zinc-800',
    divider: 'divide-zinc-800',
    dividerBg: 'bg-zinc-800',
    subtleText: 'text-zinc-600',
    brandName: 'Batchoy Shop',
    loaderColor: 'border-red-500',
    headerBg: 'bg-zinc-950/90 border-zinc-800',
    backBtn: 'text-zinc-500 hover:text-white hover:bg-zinc-800',
    footerLink: 'text-zinc-600 hover:text-zinc-400',
  },
} as const;

type Theme = (typeof BRAND_THEME)[Brand];

// ─── Step definitions ─────────────────────────────────────────────────────────
type StepId = 'received' | 'preparing' | 'ready';
const STEPS: { id: StepId; label: string; sub: string; Icon: React.ElementType }[] = [
  { id: 'received', label: 'Received', sub: 'Sent to cashier', Icon: Clock },
  { id: 'preparing', label: 'Preparing', sub: 'Kitchen is on it', Icon: ChefHat },
  { id: 'ready', label: 'Ready', sub: 'Come pick it up!', Icon: Utensils },
];

function statusToStep(status: OrderStatus): number {
  switch (status) {
    case 'pending':
      return 0;
    case 'preparing':
      return 1;
    case 'ready':
      return 2;
    case 'completed':
      return 2;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
}

// ─── Progress stepper ─────────────────────────────────────────────────────────
function ProgressStepper({ status, theme }: { status: OrderStatus; theme: Theme }) {
  const activeIdx = statusToStep(status);
  const isDone = status === 'completed' || status === 'ready';

  return (
    <div className="w-full">
      <div className="flex items-start">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIdx || (isDone && idx === activeIdx);
          const isActive = idx === activeIdx && !isDone;

          return (
            <div key={step.id} className="flex items-start flex-1 last:flex-none">
              {/* Step node */}
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  initial={false}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  className={[
                    'w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-500',
                    isCompleted ? theme.stepDone : isActive ? theme.stepActive : theme.stepInactive,
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <CheckCircle size={20} strokeWidth={2.2} />
                  ) : (
                    <step.Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  )}
                </motion.div>
                <div className="text-center w-20">
                  <p
                    className={[
                      'text-[11px] font-bold leading-tight',
                      isCompleted || isActive ? theme.accent : theme.subtleText,
                    ].join(' ')}
                  >
                    {step.label}
                  </p>
                  <p className={['text-[10px] leading-snug mt-0.5', theme.subtleText].join(' ')}>
                    {step.sub}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={[
                    'flex-1 h-0.5 mt-6 mx-1 rounded-full transition-colors duration-700',
                    idx < activeIdx ? theme.lineActive : theme.lineInactive,
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Digital receipt ──────────────────────────────────────────────────────────
function DigitalReceipt({
  order,
  tableNumber,
  theme,
}: {
  order: Order;
  tableNumber?: string;
  theme: Theme;
}) {
  const items = order.order_items ?? [];
  const timeStr = order.created_at
    ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const displayTable = order.dining_table
    ? String(order.dining_table.table_number).padStart(2, '0')
    : tableNumber
    ? String(tableNumber).padStart(2, '0')
    : null;

  return (
    <div className="w-full space-y-6">
      {/* Receipt header */}
      <div className="flex items-start justify-between">
        <div>
          <p className={['text-[11px] font-bold uppercase tracking-widest mb-1', theme.subtleText].join(' ')}>
            Order
          </p>
          <p className={['text-4xl font-black font-mono tracking-tight', theme.accent].join(' ')}>
            #{order.order_number}
          </p>
          {timeStr && (
            <p className={['text-xs mt-1.5', theme.subtleText].join(' ')}>Placed at {timeStr}</p>
          )}
        </div>
        <ReceiptText size={30} strokeWidth={1.3} className={theme.subtleText} />
      </div>

      {/* Items list */}
      <div className={['divide-y', theme.divider].join(' ')}>
        {items.length === 0 ? (
          <p className={['py-4 text-sm', theme.subtleText].join(' ')}>No items available.</p>
        ) : (
          items.map((item, i) => (
            <div key={item.id ?? i} className="flex items-baseline justify-between gap-3 py-3.5">
              <div className="flex-1 min-w-0">
                <p className={['text-sm font-medium', theme.text].join(' ')}>
                  <span className={['font-mono font-bold mr-1.5 text-[13px]', theme.accent].join(' ')}>
                    {item.quantity}×
                  </span>
                  {item.menu_item_name}
                </p>
                {item.special_instructions && (
                  <p className={['text-[11px] italic mt-0.5 pl-5', theme.subtleText].join(' ')}>
                    ↳ {item.special_instructions}
                  </p>
                )}
              </div>
              <p className={['text-sm font-mono shrink-0', theme.text].join(' ')}>
                ₱{Number(item.subtotal ?? item.unit_price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between">
        <p className={['text-[11px] font-bold uppercase tracking-widest', theme.subtleText].join(' ')}>
          Total
        </p>
        <p className={['text-3xl font-black font-mono tracking-tight', theme.text].join(' ')}>
          ₱{Number(order.total_amount).toFixed(2)}
        </p>
      </div>

      {/* Cashier note */}
      <div className={['rounded-2xl border px-4 py-3.5 text-center', theme.accentLight, theme.accentBorder].join(' ')}>
        <p className={['text-[13px] font-medium leading-snug', theme.text].join(' ')}>
          {displayTable ? (
            <>
              State <strong>Table {displayTable}</strong> &amp; Order <strong>#{order.order_number}</strong> at the cashier when paying.
            </>
          ) : (
            <>
              State Order <strong>#{order.order_number}</strong> at the cashier counter when paying.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Main page content ────────────────────────────────────────────────────────
export function CustomerStatusContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('order') ?? '';
  const tableParam = searchParams.get('table') ?? '';
  const rawTableNumber = tableParam ? tableParam.replace(/^table\s*/i, '').trim() : '';
  const brandParam = searchParams.get('brand') as Brand | null;

  const dayOfWeek = new Date().getDay();
  const systemBrand: Brand = dayOfWeek === 0 ? 'batchoy-shop' : 'kyles-eatery';
  const brand: Brand =
    brandParam === 'batchoy-shop' || brandParam === 'kyles-eatery' ? brandParam : systemBrand;
  const theme = BRAND_THEME[brand];

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string>(orderIdParam);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load orders for table or single order
  const loadOrders = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);

    try {
      if (rawTableNumber) {
        // Table view: fetch ALL active orders belonging to this table
        const res = await getOrdersByTableAction(rawTableNumber);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setOrders(res.data);
          // Set active order if not already selected, or if current selection not found
          setActiveOrderId((prev) => {
            if (prev && res.data?.some((o) => o.id === prev)) return prev;
            if (orderIdParam && res.data?.some((o) => o.id === orderIdParam)) return orderIdParam;
            // Prefer first active order, else latest order
            const active = res.data?.find((o) => ['pending', 'preparing', 'ready'].includes(o.status));
            return active ? active.id : res.data![0].id;
          });
        } else if (orderIdParam) {
          // Fallback to specific orderId if table query returned nothing
          const singleRes = await getOrderByIdAction(orderIdParam);
          if (singleRes.success && singleRes.data) {
            setOrders([singleRes.data]);
            setActiveOrderId(singleRes.data.id);
          } else {
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
      } else if (orderIdParam) {
        // Single order view
        const res = await getOrderByIdAction(orderIdParam);
        if (res.success && res.data) {
          setOrders([res.data]);
          setActiveOrderId(res.data.id);

          // If the order has a table, load other orders for this table in the background
          const matchedTable = res.data.dining_table?.table_number
            ? String(res.data.dining_table.table_number)
            : res.data.customer_notes?.replace(/^table\s*/i, '').trim();
          if (matchedTable) {
            getOrdersByTableAction(matchedTable).then((tableRes) => {
              if (tableRes.success && Array.isArray(tableRes.data) && tableRes.data.length > 0) {
                setOrders(tableRes.data);
              }
            });
          }
        } else {
          setOrders([]);
        }
      } else {
        // Neither table nor order in URL: check localStorage for current table or last placed order
        let storedId: string | null = null;
        let storedTable: string | null = null;
        if (typeof window !== 'undefined') {
          storedTable = localStorage.getItem('kyles_current_table');
          storedId = localStorage.getItem('kyles_last_order_id');
        }

        if (storedTable) {
          const res = await getOrdersByTableAction(storedTable);
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setOrders(res.data);
            setActiveOrderId(res.data[0].id);
            return;
          }
        }

        if (storedId) {
          const res = await getOrderByIdAction(storedId);
          if (res.success && res.data) {
            setOrders([res.data]);
            setActiveOrderId(res.data.id);
          } else {
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
      }
    } catch {
      setOrders([]);
    } finally {
      if (!isBackground) setLoading(false);
      setIsRefreshing(false);
    }
  }, [rawTableNumber, orderIdParam]);

  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  // Selected order calculation based on activeOrderId
  const currentOrder = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    return orders.find((o) => o.id === activeOrderId) || orders[0];
  }, [orders, activeOrderId]);

  // Table ID for realtime
  const resolvedTableId = useMemo(() => {
    const fromOrder = orders.find((o) => o.table_id)?.table_id;
    return fromOrder || (orders[0]?.dining_table?.id ?? null);
  }, [orders]);

  // Live status updates
  useEffect(() => {
    // 1. Subscribe to selected single order updates
    let unsubscribeOrder: (() => void) | undefined;
    if (activeOrderId) {
      unsubscribeOrder = subscribeToCustomerOrder(activeOrderId, {
        onOrderUpdated: (updated) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === activeOrderId ? { ...o, ...updated } : o))
          );
        },
      });
    }

    // 2. Subscribe to table events if tableId is known
    let unsubscribeTable: (() => void) | undefined;
    if (resolvedTableId) {
      unsubscribeTable = subscribeToTableOrders(resolvedTableId, {
        onOrderUpdated: (updated) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
          );
        },
        onNewOrder: () => {
          loadOrders(true);
        },
      });
    }

    return () => {
      unsubscribeOrder?.();
      unsubscribeTable?.();
    };
  }, [activeOrderId, resolvedTableId, loadOrders]);

  // Back to menu URL preserves table and brand
  const backToMenuUrl = useMemo(() => {
    const tableToUse =
      rawTableNumber ||
      (currentOrder?.dining_table?.table_number
        ? String(currentOrder.dining_table.table_number)
        : '');
    return tableToUse
      ? `/?table=${encodeURIComponent(tableToUse)}&brand=${brand}`
      : `/?brand=${brand}`;
  }, [rawTableNumber, currentOrder, brand]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={['min-h-screen flex items-center justify-center', theme.bg].join(' ')}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
          className={['w-10 h-10 border-[3px] border-t-transparent rounded-full', theme.loaderColor].join(' ')}
        />
      </div>
    );
  }

  // ── No Orders Found ───────────────────────────────────────────────────────
  if (!currentOrder || orders.length === 0) {
    return (
      <div className={['min-h-screen flex flex-col', theme.bg].join(' ')}>
        {/* Brand header */}
        <header className={['sticky top-0 z-40 backdrop-blur-md border-b', theme.headerBg].join(' ')}>
          <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
            <Link
              href={backToMenuUrl}
              aria-label="Back to menu"
              className={['p-2 rounded-full transition-colors -ml-2', theme.backBtn].join(' ')}
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className={['text-base font-bold tracking-tight', theme.text].join(' ')}>
              {theme.brandName}
            </h1>
            <div className="w-9" />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center max-w-sm mx-auto">
          <div className={['w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-sm border', theme.accentLight, theme.accentBorder].join(' ')}>
            🧾
          </div>
          <p className={['text-xl font-extrabold', theme.text].join(' ')}>
            {rawTableNumber ? `No Active Orders for Table ${rawTableNumber}` : 'No Orders to Track'}
          </p>
          <p className={['text-sm leading-relaxed', theme.subtext].join(' ')}>
            {rawTableNumber
              ? `You haven't placed an order for Table ${rawTableNumber} yet, or your previous orders are already completed.`
              : 'Scan your table QR code or order from the menu to track your order in real-time.'}
          </p>
          <Link
            href={backToMenuUrl}
            className={[
              'inline-flex items-center gap-2 mt-3 px-6 py-3 rounded-full text-sm font-bold text-white transition shadow-sm active:scale-95',
              theme.accentBg,
            ].join(' ')}
          >
            <ArrowLeft size={15} />
            Browse Menu &amp; Order
          </Link>
        </main>
      </div>
    );
  }

  const activeStep = statusToStep(currentOrder.status);
  const isDone = currentOrder.status === 'completed';
  const isCancelled = currentOrder.status === 'cancelled';
  const displayTable =
    currentOrder.dining_table?.table_number ?? (rawTableNumber ? Number(rawTableNumber) : null);

  return (
    <div className={['min-h-screen flex flex-col', theme.bg].join(' ')}>
      {/* ── Brand header (Customer facing — no staff Navbar) ─────────────── */}
      <header className={['sticky top-0 z-40 backdrop-blur-md border-b', theme.headerBg].join(' ')}>
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <Link
            href={backToMenuUrl}
            aria-label="Back to menu"
            className={['p-2 rounded-full transition-colors -ml-2', theme.backBtn].join(' ')}
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="text-center">
            <h1 className={['text-base font-bold tracking-tight', theme.text].join(' ')}>
              {theme.brandName}
            </h1>
            <p className={['text-[10px] font-semibold tracking-wide uppercase', theme.subtleText].join(' ')}>
              Customer Order Tracker
            </p>
          </div>

          <div className="flex items-center gap-2">
            {displayTable && (
              <span className={['text-xs font-bold px-2.5 py-1 rounded-full border', theme.tableBadge].join(' ')}>
                Table {String(displayTable).padStart(2, '0')}
              </span>
            )}
            <button
              onClick={() => loadOrders(true)}
              aria-label="Refresh orders"
              className={['p-1.5 rounded-full transition-colors', theme.backBtn].join(' ')}
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-6 flex flex-col gap-7">



        {/* Status headline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentOrder.id + currentOrder.status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="text-center space-y-1.5"
          >
            <p className={['text-[11px] font-bold uppercase tracking-widest', theme.subtleText].join(' ')}>
              Order Status
            </p>
            {isDone && (
              <p className={['text-2xl font-extrabold', theme.text].join(' ')}>
                Paid &amp; Completed 🎉
              </p>
            )}
            {isCancelled && (
              <p className="text-2xl font-extrabold text-red-500">Order Cancelled</p>
            )}
            {!isDone && !isCancelled && (
              <>
                <p className={['text-2xl font-extrabold', theme.text].join(' ')}>
                  {activeStep === 0 && 'Sent to Cashier ✓'}
                  {activeStep === 1 && 'Kitchen is Preparing…'}
                  {activeStep === 2 && 'Ready for Pickup! 🍽️'}
                </p>
                {activeStep === 0 && (
                  <p className={['text-sm', theme.subtext].join(' ')}>
                    Please proceed to the cashier counter to confirm payment.
                  </p>
                )}
                {activeStep === 1 && (
                  <p className={['text-sm', theme.subtext].join(' ')}>
                    Your food is being freshly prepared in the kitchen.
                  </p>
                )}
                {activeStep === 2 && (
                  <p className={['text-sm', theme.subtext].join(' ')}>
                    Your order is ready! Please collect it at the counter.
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        {!isCancelled && <ProgressStepper status={currentOrder.status} theme={theme} />}

        {/* Divider */}
        <div className={['w-full h-px', theme.dividerBg].join(' ')} />

        {/* Digital receipt */}
        <DigitalReceipt
          order={currentOrder}
          tableNumber={rawTableNumber || undefined}
          theme={theme}
        />

        {/* Actions / Order More */}
        <div className="space-y-3 pt-2 pb-8 text-center">
          <Link
            href={backToMenuUrl}
            className={[
              'w-full py-3.5 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm',
              theme.accentBg,
              'text-white active:scale-98',
            ].join(' ')}
          >
            <ShoppingBag size={16} />
            Order More Food
          </Link>

          <div>
            <Link
              href={backToMenuUrl}
              className={['inline-flex items-center gap-1.5 text-xs font-semibold transition hover:underline', theme.footerLink].join(' ')}
            >
              <ArrowLeft size={12} />
              Back to {theme.brandName} Menu
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Page export (Suspense for useSearchParams) ───────────────────────────────
export default function CustomerStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CustomerStatusContent />
    </Suspense>
  );
}
