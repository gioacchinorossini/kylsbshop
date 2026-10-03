'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChefHat, Clock, Utensils, ReceiptText, Receipt, ArrowLeft, RefreshCw, ShoppingBag, Armchair } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getOrderByIdAction, getOrdersByTableAction } from '@/app/actions/orders';
import { subscribeToCustomerOrder, subscribeToTableOrders } from '@/lib/realtime/customer-order';
import { Order, OrderStatus } from '@/types/database';

// ─── Theme ────────────────────────────────────────────────────────────────────
type Brand = 'kyles-eatery' | 'batchoy-shop';

function detectOrderBrand(order: any): Brand {
  const notes = (order?.customer_notes || '').toLowerCase();
  if (notes.includes('batchoy-shop') || notes.includes('batchoy')) return 'batchoy-shop';
  if (notes.includes('kyles-eatery') || notes.includes('kyles') || notes.includes('kyle')) return 'kyles-eatery';

  const items = order?.order_items || [];
  for (const item of items) {
    const name = (item.menu_item_name || '').toLowerCase();
    if (
      name.includes('batchoy') ||
      name.includes('tempura') ||
      name.includes('miki') ||
      name.includes('caesar')
    ) {
      return 'batchoy-shop';
    }
    if (
      name.includes('chori') ||
      name.includes('inasal') ||
      name.includes('bbq') ||
      name.includes('ala king') ||
      name.includes('kawali')
    ) {
      return 'kyles-eatery';
    }
  }
  return 'kyles-eatery';
}

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
    case 'Archived':
    case 'archived':
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

// ─── Digital receipt (Unified single receipt with item-level badging) ───────
function DigitalReceipt({
  orders,
  displayTable,
  theme,
}: {
  orders: Order[];
  displayTable: string | null;
  theme: Theme;
}) {
  const firstOrder = orders[0];
  const rawShortId = firstOrder?.short_id || firstOrder?.order_number || firstOrder?.id?.slice(-4) || '---';
  const heroOrderTitle = rawShortId.startsWith('#') ? rawShortId : `#${rawShortId}`;

  const timeStr = firstOrder?.created_at
    ? new Date(firstOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const grandTotal = orders.reduce(
    (sum, o) => sum + Number(o.total_amount ?? (o as any).total_price ?? 0),
    0
  );

  const hasAnyItems = orders.some(
    (o) => (o.items && o.items.length > 0) || (o.order_items && o.order_items.length > 0)
  );

  return (
    <div className="w-full space-y-6">
      {/* Receipt header with single master ticket number */}
      <div className="flex items-start justify-between">
        <div>
          <p className={['text-[11px] font-bold uppercase tracking-widest mb-1', theme.subtleText].join(' ')}>
            Order Ticket
          </p>
          <h1 className="text-4xl font-black font-mono tracking-tight text-red-600 dark:text-red-500">
            {heroOrderTitle}
          </h1>
          {timeStr && (
            <p className={['text-xs mt-1.5', theme.subtleText].join(' ')}>Placed at {timeStr}</p>
          )}
        </div>
        <ReceiptText size={30} strokeWidth={1.3} className={theme.subtleText} />
      </div>

      {/* Unified Items list */}
      <div className={['divide-y', theme.divider].join(' ')}>
        {!hasAnyItems ? (
          <p className={['py-4 text-sm', theme.subtleText].join(' ')}>No items available.</p>
        ) : (
          orders.map((order) => {
            const normType = (order.order_type || '').toLowerCase().replace(/[_\s]/g, '-');
            const isTakeout = normType.includes('take') || normType.includes('away');
            const items = (order.items || order.order_items || []) as any[];

            return items.map((item, itemIdx) => {
              const itemName = item.menu_item_name || item.name || item.title || 'Item';
              const itemPrice = Number(
                item.subtotal ??
                  (item.unit_price != null
                    ? item.unit_price * item.quantity
                    : (item.price != null ? item.price * item.quantity : 0))
              );
              const itemKey = item.id || `${order.id}-${itemIdx}`;

              return (
                <div key={itemKey} className="flex items-baseline justify-between gap-3 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-y-1">
                      <p className={['text-sm font-medium', theme.text].join(' ')}>
                        <span className={['font-mono font-bold mr-1.5 text-[13px]', theme.accent].join(' ')}>
                          {item.quantity}×
                        </span>
                        {itemName}
                      </p>
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-500 shrink-0">
                        {isTakeout ? (
                          <ShoppingBag className="w-2.5 h-2.5 shrink-0 text-zinc-500" strokeWidth={2} />
                        ) : (
                          <Utensils className="w-2.5 h-2.5 shrink-0 text-zinc-500" strokeWidth={2} />
                        )}
                        <span>{isTakeout ? 'Take-Out' : 'Dine-In'}</span>
                      </span>
                    </div>
                    {(item.special_instructions || item.notes) && (
                      <p className={['text-[11px] italic mt-0.5 pl-5', theme.subtleText].join(' ')}>
                        ↳ {item.special_instructions || item.notes}
                      </p>
                    )}
                  </div>
                  <p className={['text-sm font-mono shrink-0', theme.text].join(' ')}>
                    ₱{itemPrice.toFixed(2)}
                  </p>
                </div>
              );
            });
          })
        )}
      </div>

      {/* Single Total Footer */}
      <div className="flex items-center justify-between">
        <p className={['text-[11px] font-bold uppercase tracking-widest', theme.subtleText].join(' ')}>
          Total
        </p>
        <p className={['text-3xl sm:text-4xl font-black font-mono tracking-tight', theme.text].join(' ')}>
          ₱{grandTotal.toFixed(2)}
        </p>
      </div>

      {/* Cashier note */}
      <div className={['rounded-2xl border px-4 py-3.5 text-center', theme.accentLight, theme.accentBorder].join(' ')}>
        <p className={['text-[13px] font-medium leading-snug', theme.text].join(' ')}>
          {displayTable ? (
            <>
              State <strong>Table {displayTable}</strong> &amp; Order{' '}
              <strong className="text-red-600 dark:text-red-400">{heroOrderTitle}</strong> at the cashier when paying.
            </>
          ) : (
            <>
              State Order{' '}
              <strong className="text-red-600 dark:text-red-400">{heroOrderTitle}</strong> at the cashier counter when paying.
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

  // Initialize active brand state strictly from URL search params ('brand') first
  const [brand, setBrand] = useState<Brand>(() => {
    if (brandParam === 'batchoy-shop' || brandParam === 'kyles-eatery') {
      return brandParam;
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kyles_current_brand');
      if (stored === 'batchoy-shop' || stored === 'kyles-eatery') {
        return stored;
      }
    }
    const dayOfWeek = new Date().getDay();
    return dayOfWeek === 0 ? 'batchoy-shop' : 'kyles-eatery';
  });

  // Sync state if URL search param changes
  useEffect(() => {
    if (brandParam === 'batchoy-shop' || brandParam === 'kyles-eatery') {
      setBrand(brandParam);
      if (typeof window !== 'undefined') {
        localStorage.setItem('kyles_current_brand', brandParam);
      }
    }
  }, [brandParam]);

  const theme = BRAND_THEME[brand];

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string>(orderIdParam);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load orders for table session, gathering from localStorage (@kyle_pos_my_orders), URL params, and table
  const loadOrders = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);

    const activeBrandFilter =
      brandParam === 'batchoy-shop' || brandParam === 'kyles-eatery' ? brandParam : brand;

    try {
      // 1. Gather all candidate order IDs
      const candidateIds: string[] = [];
      let storedTable: string | null = null;

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('@kyle_pos_my_orders');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((id) => {
                if (typeof id === 'string' && id.trim() && !candidateIds.includes(id.trim())) {
                  candidateIds.push(id.trim());
                }
              });
            }
          }
        } catch {}

        storedTable = localStorage.getItem('kyles_current_table');
        const lastId = localStorage.getItem('kyles_last_order_id');
        if (lastId && typeof lastId === 'string' && !candidateIds.includes(lastId.trim())) {
          candidateIds.push(lastId.trim());
        }
      }

      if (orderIdParam && !candidateIds.includes(orderIdParam)) {
        candidateIds.push(orderIdParam);
      }

      // 2. Fetch all candidate orders by ID
      const fetchedOrders: Order[] = [];
      if (candidateIds.length > 0) {
        const idResults = await Promise.all(
          candidateIds.map((id) => getOrderByIdAction(id))
        );
        idResults.forEach((res) => {
          if (res.success && res.data) {
            fetchedOrders.push(res.data);
          }
        });
      }

      // 3. Resolve table number if available (from URL, localStorage, or fetched orders)
      const effectiveTable =
        rawTableNumber ||
        storedTable ||
        fetchedOrders.find((o) => o.dining_table?.table_number)?.dining_table?.table_number?.toString() ||
        fetchedOrders
          .map((o) => o.customer_notes?.match(/table\s*(\d+)/i)?.[1])
          .find(Boolean);

      // 4. If table is known, fetch table orders to ensure any additions at the table are included
      if (effectiveTable) {
        const tableRes = await getOrdersByTableAction(effectiveTable, activeBrandFilter);
        if (tableRes.success && Array.isArray(tableRes.data)) {
          tableRes.data.forEach((ord) => fetchedOrders.push(ord));
        }
      }

      // 5. Merge uniquely by ID
      const orderMap = new Map<string, Order>();
      fetchedOrders.forEach((ord) => {
        if (ord && ord.id) {
          const items = ord.items || ord.order_items || [];
          ord.items = items;
          ord.order_items = items;
          if (!ord.short_id) {
            ord.short_id = ord.order_number || ord.id.slice(-4);
          }
          orderMap.set(ord.id, ord);
        }
      });

      let combinedOrders = Array.from(orderMap.values());

      // Filter out archived orders
      combinedOrders = combinedOrders.filter(
        (o) => o.status !== 'Archived' && o.status !== 'archived'
      );

      // Filter by active brand
      if (activeBrandFilter) {
        combinedOrders = combinedOrders.filter((o) => detectOrderBrand(o) === activeBrandFilter);
      }

      // Detect brand if not explicitly provided
      if (!brandParam && combinedOrders.length > 0) {
        const detected = detectOrderBrand(combinedOrders[0]);
        if (detected) setBrand(detected);
      }

      // Sort chronologically (oldest to newest)
      combinedOrders.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // 6. Synchronize active orders with localStorage without wiping out multiple active orders
      if (typeof window !== 'undefined') {
        try {
          const activeStatuses = ['pending', 'received', 'preparing', 'ready'];
          const activeOrders = combinedOrders.filter((o) =>
            activeStatuses.includes((o.status || '').toLowerCase())
          );
          if (activeOrders.length > 0) {
            const activeIds = activeOrders.map((o) => o.id);
            localStorage.setItem('@kyle_pos_my_orders', JSON.stringify(activeIds));
            localStorage.setItem('kyles_last_order_id', activeIds[activeIds.length - 1]);
          } else if (combinedOrders.length === 0) {
            localStorage.removeItem('@kyle_pos_my_orders');
            localStorage.removeItem('kyles_last_order_id');
          }
        } catch {}
      }

      setOrders(combinedOrders);

      if (combinedOrders.length > 0) {
        setActiveOrderId((prev) => {
          if (prev && combinedOrders.some((o) => o.id === prev)) return prev;
          if (orderIdParam && combinedOrders.some((o) => o.id === orderIdParam)) return orderIdParam;
          const active = combinedOrders.find((o) =>
            ['pending', 'received', 'preparing', 'ready'].includes((o.status || '').toLowerCase())
          );
          return active ? active.id : combinedOrders[combinedOrders.length - 1].id;
        });
      } else {
        setActiveOrderId('');
      }
    } catch {
      setOrders([]);
    } finally {
      if (!isBackground) setLoading(false);
      setIsRefreshing(false);
    }
  }, [rawTableNumber, orderIdParam, brandParam, brand]);

  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  // Selected order calculation based on activeOrderId
  const currentOrder = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    return orders.find((o) => o.id === activeOrderId) || orders[0];
  }, [orders, activeOrderId]);

  // Session status calculation across all table orders
  const sessionStatus: OrderStatus = useMemo(() => {
    if (orders.length === 0) return 'pending';
    const activeOrders = orders.filter(
      (o) => o.status !== 'cancelled' && o.status !== 'Archived' && o.status !== 'archived'
    );
    if (activeOrders.length === 0) return orders[0].status;
    const allCompleted = activeOrders.every((o) => o.status === 'completed');
    if (allCompleted) return 'completed';
    const allReady = activeOrders.every((o) => o.status === 'ready' || o.status === 'completed');
    if (allReady) return 'ready';
    const anyPreparing = activeOrders.some((o) => o.status === 'preparing');
    if (anyPreparing) return 'preparing';
    return 'pending';
  }, [orders]);

  // Table ID for realtime
  const resolvedTableId = useMemo(() => {
    const fromOrder = orders.find((o) => o.table_id)?.table_id;
    return fromOrder || (orders[0]?.dining_table?.id ?? null);
  }, [orders]);

  // Live status updates
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // 1. Subscribe to each individual order in the table session
    orders.forEach((ord) => {
      if (ord.id) {
        const unsub = subscribeToCustomerOrder(ord.id, {
          onOrderUpdated: (updated) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === ord.id ? { ...o, ...updated } : o))
            );
          },
        });
        unsubscribes.push(unsub);
      }
    });

    // 2. Subscribe to table events if tableId is known
    if (resolvedTableId) {
      const unsubTable = subscribeToTableOrders(resolvedTableId, {
        onOrderUpdated: (updated) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
          );
        },
        onNewOrder: () => {
          loadOrders(true);
        },
      });
      unsubscribes.push(unsubTable);
    }

    return () => {
      unsubscribes.forEach((fn) => fn());
    };
  }, [orders, resolvedTableId, loadOrders]);

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
          <div className="max-w-lg mx-auto px-5 min-h-[4rem] py-2 flex items-center justify-between w-full">
            <div className="flex-1 flex items-center justify-start">
              <Link
                href={backToMenuUrl}
                aria-label="Back to menu"
                className={['p-2 rounded-full transition-colors -ml-2', theme.backBtn].join(' ')}
              >
                <ArrowLeft size={18} />
              </Link>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {brand === 'batchoy-shop' ? (
                <Image
                  src="/batchoyshop-logo-removebg-preview.png"
                  alt="Batchoy Shop"
                  width={180}
                  height={48}
                  className="h-10 sm:h-12 w-auto object-contain scale-[2.5] origin-center dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  priority
                />
              ) : (
                <Image
                  src="/kyles-logo.jpg"
                  alt="Kyle's Eatery"
                  width={48}
                  height={48}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-sm object-cover border border-zinc-100"
                  priority
                />
              )}
            </div>

            <div className="flex-1 flex items-center justify-end">
              {rawTableNumber ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white tracking-wide uppercase shadow-sm whitespace-nowrap">
                  <Armchair className="w-3.5 h-3.5 text-zinc-500 shrink-0" strokeWidth={2} />
                  <span>Table {String(rawTableNumber).padStart(2, '0')}</span>
                </span>
              ) : (
                <div className="w-9" />
              )}
            </div>
          </div>
        </header>

        <main className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <Receipt className="w-20 h-20 text-zinc-200 dark:text-zinc-800 mb-6" strokeWidth={1} />
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            {rawTableNumber ? `No Active Orders for Table ${String(rawTableNumber).padStart(2, '0')}` : 'No Orders to Track'}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-3 leading-relaxed text-sm">
            {rawTableNumber
              ? `You haven't placed an order for Table ${String(rawTableNumber).padStart(2, '0')} yet, or your previous orders are already completed.`
              : 'Scan your table QR code or order from the menu to track your order in real-time.'}
          </p>
          <Link
            href={backToMenuUrl}
            className={[
              'inline-flex items-center gap-2 mt-8 px-8 py-3.5 shadow-sm rounded-full text-sm font-bold text-white transition active:scale-95',
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

  const activeStep = statusToStep(sessionStatus);
  const isDone = sessionStatus === 'completed';
  const isCancelled = orders.length > 0 && orders.every((o) => o.status === 'cancelled');
  const displayTable =
    orders.find((o) => o.dining_table?.table_number)?.dining_table?.table_number ??
    (rawTableNumber ? Number(rawTableNumber) : null);

  return (
    <div className={['min-h-screen flex flex-col', theme.bg].join(' ')}>
      {/* ── Brand header (Customer facing — no staff Navbar) ─────────────── */}
      <header className={['sticky top-0 z-40 backdrop-blur-md border-b', theme.headerBg].join(' ')}>
        <div className="max-w-lg mx-auto px-5 min-h-[4rem] py-2 flex items-center justify-between w-full">
          <div className="flex-1 flex items-center justify-start">
            <Link
              href={backToMenuUrl}
              aria-label="Back to menu"
              className={['p-2 rounded-full transition-colors -ml-2', theme.backBtn].join(' ')}
            >
              <ArrowLeft size={18} />
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {brand === 'batchoy-shop' ? (
              <Image
                src="/batchoyshop-logo-removebg-preview.png"
                alt="Batchoy Shop"
                width={180}
                height={48}
                className="h-10 sm:h-12 w-auto object-contain scale-[2.5] origin-center dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                priority
              />
            ) : (
              <Image
                src="/kyles-logo.jpg"
                alt="Kyle's Eatery"
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-sm object-cover border border-zinc-100"
                priority
              />
            )}
          </div>

          <div className="flex-1 flex items-center justify-end gap-2">
            {displayTable && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white tracking-wide uppercase shadow-sm whitespace-nowrap">
                <Armchair className="w-3.5 h-3.5 text-zinc-500 shrink-0" strokeWidth={2} />
                <span>Table {String(displayTable).padStart(2, '0')}</span>
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
            key={sessionStatus + orders.length}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="text-center space-y-1.5"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <p className={['text-[11px] font-bold uppercase tracking-widest', theme.subtleText].join(' ')}>
                {orders.length > 1 ? 'Table Session Status' : 'Order Status'}
              </p>
              {orders.length > 1 && (
                <span className={['text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800', theme.accent].join(' ')}>
                  {orders.length} Active Orders
                </span>
              )}
            </div>
            {isDone && (
              <p className={['text-2xl font-extrabold', theme.text].join(' ')}>
                Paid &amp; Completed
              </p>
            )}
            {isCancelled && (
              <p className="text-2xl font-extrabold text-red-500">Order Cancelled</p>
            )}
            {!isDone && !isCancelled && (
              <>
                <p className={['text-2xl font-extrabold', theme.text].join(' ')}>
                  {activeStep === 0 && (orders.length > 1 ? 'Orders Sent to Cashier' : 'Sent to Cashier')}
                  {activeStep === 1 && (orders.length > 1 ? 'Kitchen is Preparing Orders...' : 'Kitchen is Preparing...')}
                  {activeStep === 2 && (orders.length > 1 ? 'All Orders Ready for Pickup' : 'Ready for Pickup')}
                </p>
                {activeStep === 0 && (
                  <p className={['text-sm', theme.subtext].join(' ')}>
                    Please proceed to the cashier counter to confirm payment for your table session.
                  </p>
                )}
                {activeStep === 1 && (
                  <p className={['text-sm', theme.subtext].join(' ')}>
                    {orders.length > 1
                      ? 'Your food batches are being freshly prepared in the kitchen.'
                      : 'Your food is being freshly prepared in the kitchen.'}
                  </p>
                )}
                {activeStep === 2 && (
                  <p className={['text-sm', theme.subtext].join(' ')}>
                    {orders.length > 1
                      ? 'All items in your table session are ready! Please collect at the counter.'
                      : 'Your order is ready! Please collect it at the counter.'}
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        {!isCancelled && <ProgressStepper status={sessionStatus} theme={theme} />}

        {/* Divider */}
        <div className={['w-full h-px', theme.dividerBg].join(' ')} />

        {/* Digital receipt */}
        <DigitalReceipt
          orders={orders}
          displayTable={displayTable ? String(displayTable).padStart(2, '0') : null}
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
