'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChefHat, Clock, Utensils, ReceiptText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getOrderByIdAction } from '@/app/actions/orders';
import { subscribeToCustomerOrder } from '@/lib/realtime/customer-order';
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

type Theme = typeof BRAND_THEME[Brand];

// ─── Step definitions ─────────────────────────────────────────────────────────
type StepId = 'received' | 'preparing' | 'ready';
const STEPS: { id: StepId; label: string; sub: string; Icon: React.ElementType }[] = [
  { id: 'received',  label: 'Received',  sub: 'Sent to cashier',  Icon: Clock    },
  { id: 'preparing', label: 'Preparing', sub: 'Kitchen is on it', Icon: ChefHat  },
  { id: 'ready',     label: 'Ready',     sub: 'Come pick it up!', Icon: Utensils },
];

function statusToStep(status: OrderStatus): number {
  switch (status) {
    case 'pending':   return 0;
    case 'preparing': return 1;
    case 'ready':     return 2;
    case 'completed': return 2;
    case 'cancelled': return -1;
    default:          return 0;
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
                  <p className={[
                    'text-[11px] font-bold leading-tight',
                    isCompleted || isActive ? theme.accent : theme.subtleText,
                  ].join(' ')}>
                    {step.label}
                  </p>
                  <p className={['text-[10px] leading-snug mt-0.5', theme.subtleText].join(' ')}>
                    {step.sub}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className={[
                  'flex-1 h-0.5 mt-6 mx-1 rounded-full transition-colors duration-700',
                  idx < activeIdx ? theme.lineActive : theme.lineInactive,
                ].join(' ')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Digital receipt ──────────────────────────────────────────────────────────
function DigitalReceipt({ order, theme }: { order: Order; theme: Theme }) {
  const items = order.order_items ?? [];
  const timeStr = order.created_at
    ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

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
          {order.dining_table
            ? (
              <>State <strong>Table {String(order.dining_table.table_number).padStart(2, '0')}</strong> &amp; Order <strong>#{order.order_number}</strong> at the cashier when paying.</>
            ) : (
              <>State Order <strong>#{order.order_number}</strong> at the cashier counter when paying.</>
            )
          }
        </p>
      </div>
    </div>
  );
}

// ─── Main page content ────────────────────────────────────────────────────────
function CustomerStatusContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order') ?? '';
  const brandParam = searchParams.get('brand') as Brand | null;

  const dayOfWeek = new Date().getDay();
  const systemBrand: Brand = dayOfWeek === 0 ? 'batchoy-shop' : 'kyles-eatery';
  const brand: Brand =
    brandParam === 'batchoy-shop' || brandParam === 'kyles-eatery' ? brandParam : systemBrand;
  const theme = BRAND_THEME[brand];

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) { setNotFound(true); setLoading(false); return; }
    const res = await getOrderByIdAction(orderId);
    if (res.success && res.data) {
      setOrder(res.data);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  // Live status updates scoped to this single order
  useEffect(() => {
    if (!orderId) return;
    return subscribeToCustomerOrder(orderId, {
      onOrderUpdated: (updated) =>
        setOrder((prev) => prev ? { ...prev, ...updated } : prev),
    });
  }, [orderId]);

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

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !order) {
    return (
      <div className={['min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center', theme.bg].join(' ')}>
        <span className="text-5xl">🧾</span>
        <p className={['text-lg font-bold', theme.text].join(' ')}>Order not found</p>
        <p className={['text-sm', theme.subtext].join(' ')}>
          This link may have expired or the order ID is invalid.
        </p>
        <Link
          href={`/?brand=${brand}`}
          className={['inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition', theme.accentBg].join(' ')}
        >
          <ArrowLeft size={14} />
          Back to Menu
        </Link>
      </div>
    );
  }

  const activeStep = statusToStep(order.status);
  const isDone = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className={['min-h-screen flex flex-col', theme.bg].join(' ')}>

      {/* ── Brand header (no staff Navbar) ──────────────────────────────── */}
      <header className={[
        'sticky top-0 z-40 backdrop-blur-md border-b',
        theme.headerBg,
      ].join(' ')}>
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <Link
            href={`/?brand=${brand}`}
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

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-8 flex flex-col gap-9">

        {/* Status headline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={order.status}
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
                {activeStep === 1 && (
                  <p className={['text-sm', theme.subtext].join(' ')}>
                    Your food is being freshly prepared.
                  </p>
                )}
                {activeStep === 2 && (
                  <p className={['text-sm', theme.subtext].join(' ')}>
                    Please proceed to the counter.
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        {!isCancelled && <ProgressStepper status={order.status} theme={theme} />}

        {/* Divider */}
        <div className={['w-full h-px', theme.dividerBg].join(' ')} />

        {/* Digital receipt */}
        <DigitalReceipt order={order} theme={theme} />

        {/* Back link */}
        <div className="pb-8 text-center">
          <Link
            href={`/?brand=${brand}`}
            className={['inline-flex items-center gap-1.5 text-xs font-semibold transition hover:underline', theme.footerLink].join(' ')}
          >
            <ArrowLeft size={12} />
            Back to {theme.brandName} Menu
          </Link>
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
