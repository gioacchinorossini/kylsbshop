'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChefHat, Clock, Utensils, ReceiptText, Receipt, ArrowLeft, RefreshCw, ShoppingBag, Armchair, Package, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getOrderByIdAction, getOrdersByTableAction } from '@/app/actions/orders';
import { subscribeToCustomerOrder, subscribeToTableOrders } from '@/lib/realtime/customer-order';
import { Order, OrderStatus } from '@/types/database';

// ─── Theme ────────────────────────────────────────────────────────────────────
type Brand = 'kyles-eatery' | 'batchoy-shop';

const BRAND_THEME = {
  'kyles-eatery': {
    bg: 'bg-white text-zinc-900',
    text: 'text-zinc-900',
    subtext: 'text-zinc-500',
    accent: 'text-orange-500',
    accentBg: 'bg-orange-500 hover:bg-orange-600',
    accentLight: 'bg-orange-50',
    accentBorder: 'border-orange-200',
    tableBadge: 'bg-orange-50 border-orange-200 text-orange-700',
    stepActive: 'bg-orange-500 text-white',
    stepDone: 'bg-orange-100 text-orange-600',
    stepInactive: 'bg-zinc-100 text-zinc-400',
    lineActive: 'bg-orange-400',
    lineInactive: 'bg-zinc-200',
    divider: 'border-zinc-100 text-zinc-800',
    dividerBg: 'bg-zinc-200',
    subtleText: 'text-zinc-400',
    brandName: "Kyle's Eatery",
    loaderColor: 'border-orange-500',
    headerBg: 'bg-white/90 border-zinc-200',
    backBtn: 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100',
    footerLink: 'text-zinc-400 hover:text-zinc-700',
    btnShadow: 'shadow-orange-500/20',
  },
  'batchoy-shop': {
    bg: 'bg-zinc-950 text-white',
    text: 'text-white',
    subtext: 'text-zinc-400',
    accent: 'text-red-600',
    accentBg: 'bg-red-600 hover:bg-red-700',
    accentLight: 'bg-red-950/60',
    accentBorder: 'border-red-800',
    tableBadge: 'bg-red-950/80 border-red-800 text-red-300',
    stepActive: 'bg-red-600 text-white',
    stepDone: 'bg-red-950 text-red-400',
    stepInactive: 'bg-zinc-900 text-zinc-500',
    lineActive: 'bg-red-600',
    lineInactive: 'bg-zinc-800',
    divider: 'border-zinc-800/80 text-zinc-200',
    dividerBg: 'bg-zinc-800',
    subtleText: 'text-zinc-500',
    brandName: 'Batchoy Shop',
    loaderColor: 'border-red-600',
    headerBg: 'bg-zinc-950/90 border-zinc-800',
    backBtn: 'text-zinc-400 hover:text-white hover:bg-zinc-800',
    footerLink: 'text-zinc-500 hover:text-zinc-300',
    btnShadow: 'shadow-red-950/50',
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
function ProgressStepper({
  status,
  theme,
  isBatchoy,
}: {
  status: OrderStatus;
  theme: Theme;
  isBatchoy: boolean;
}) {
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
                    isCompleted
                      ? theme.stepDone
                      : isActive
                      ? (isBatchoy ? 'bg-red-600 text-white' : 'bg-orange-500 text-white')
                      : theme.stepInactive,
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
                    idx < activeIdx
                      ? (isBatchoy ? 'bg-red-600' : 'bg-orange-400')
                      : (isBatchoy ? 'bg-zinc-800' : 'bg-zinc-200'),
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function checkIsTakeOut(order: Order): boolean {
  return (
    order.order_type === 'take_out' ||
    order.order_type === 'takeaway' ||
    (order.order_type as string) === 'take-out' ||
    ((order as unknown as { orderType?: string }).orderType === 'take_out') ||
    ((order as unknown as { orderType?: string }).orderType === 'takeaway') ||
    ((order as unknown as { orderType?: string }).orderType === 'take-out')
  );
}

// ─── Grouped table receipt ───────────────────────────────────────────────────
function GroupedTableReceipt({
  orders,
  tableNumber,
  theme,
  isBatchoy,
}: {
  orders: Order[];
  tableNumber?: string;
  theme: Theme;
  isBatchoy: boolean;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(orders.map((o) => o.id))
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getOrderGrandTotal = (o: Order) => {
    const itemsSubtotal =
      o?.order_items?.reduce((sum, item) => {
        const price = Number((item as any).price ?? item.unit_price ?? 0);
        return sum + price * Number(item.quantity || 1);
      }, 0) || 0;
    const pkgFee = Number(o?.packaging_fee || 0);
    const calculated = itemsSubtotal + pkgFee;
    if (calculated > 0) {
      return Math.max(Number(o?.total_amount || 0), calculated);
    }
    return Number(o?.total_amount || 0) + pkgFee;
  };

  const tableTotal = orders.reduce((sum, o) => sum + getOrderGrandTotal(o), 0);
  const allPaid = orders.length > 0 && orders.every((o) => o.status === 'completed');

  const displayTable =
    orders.find((o) => o.dining_table)?.dining_table?.table_number
      ? String(orders.find((o) => o.dining_table)!.dining_table!.table_number).padStart(2, '0')
      : tableNumber
      ? String(tableNumber).padStart(2, '0')
      : null;

  return (
    <div className="w-full space-y-6">
      {/* Consolidated receipt header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isBatchoy
                  ? 'bg-red-950/80 text-red-400 border border-red-800/80'
                  : 'bg-orange-100 text-orange-700 border border-orange-200'
              }`}
            >
              {displayTable ? `Table ${displayTable}` : 'Consolidated'}
            </span>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${theme.subtleText}`}>
              Grouped Receipt
            </span>
          </div>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight ${isBatchoy ? 'text-white' : 'text-zinc-900'}`}>
            {orders.length} Active Tickets
          </p>
          <p className={`text-xs mt-1 ${theme.subtleText}`}>
            {allPaid
              ? 'All orders for this table are paid and completed.'
              : `All unpaid orders for Table ${displayTable || ''} combined below`}
          </p>
        </div>
        <ReceiptText size={32} strokeWidth={1.3} className={theme.subtleText} />
      </div>

      {/* Stacked ticket list / accordion */}
      <div className="space-y-4">
        {orders.map((order, index) => {
          const isTakeOut = checkIsTakeOut(order);
          const isPaid = order.status === 'completed';
          const isExpanded = expandedIds.has(order.id);
          const items = order.order_items ?? [];
          const timeStr = order.created_at
            ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <div
              key={order.id || index}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isBatchoy
                  ? 'bg-zinc-900/70 border-zinc-800'
                  : 'bg-zinc-50/80 border-zinc-200 shadow-sm'
              }`}
            >
              {/* Ticket header row / accordion trigger */}
              <button
                type="button"
                onClick={() => toggleExpand(order.id)}
                className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors ${
                  isBatchoy ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-100/60'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span
                    className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                      isBatchoy ? 'text-red-500' : 'text-orange-500'
                    }`}
                  >
                    #{order.order_number}
                  </span>

                  {/* Order type pill */}
                  {isTakeOut ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Package className="w-3 h-3" /> Take-Out
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isBatchoy
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          : 'bg-zinc-200 text-zinc-800 border border-zinc-300'
                      }`}
                    >
                      <Utensils className="w-3 h-3" /> Dine-In
                    </span>
                  )}

                  {/* Status badge */}
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3" /> Paid / Completed
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isBatchoy
                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          : 'bg-zinc-200 text-zinc-600 border border-zinc-300'
                      }`}
                    >
                      <Clock className="w-3 h-3" /> Unpaid
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pl-2">
                  <span className={`font-mono font-bold text-sm sm:text-base ${isBatchoy ? 'text-white' : 'text-zinc-900'}`}>
                    ₱{getOrderGrandTotal(order).toFixed(2)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className={theme.subtleText} />
                  ) : (
                    <ChevronDown size={16} className={theme.subtleText} />
                  )}
                </div>
              </button>

              {/* Ticket details (collapsible body) */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`border-t px-4 py-3.5 space-y-3 ${
                      isBatchoy ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    {timeStr && (
                      <p className={`text-[11px] ${theme.subtleText}`}>
                        Ticket placed at {timeStr}
                      </p>
                    )}

                    {/* Itemized food rows */}
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <p className={`text-xs py-1 ${theme.subtleText}`}>No items recorded.</p>
                      ) : (
                        items.map((item, idx) => (
                          <div
                            key={item.id ?? idx}
                            className={`flex justify-between items-center text-xs sm:text-sm py-1.5 border-b last:border-b-0 ${
                              isBatchoy ? 'border-zinc-800/60 text-zinc-200' : 'border-zinc-100 text-zinc-800'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-medium">
                                <span className={`font-mono font-bold mr-1.5 ${isBatchoy ? 'text-red-500' : 'text-orange-500'}`}>
                                  {item.quantity}×
                                </span>
                                {item.menu_item_name}
                              </p>
                              {item.special_instructions && (
                                <p className={`text-[10px] italic mt-0.5 pl-4 ${theme.subtleText}`}>
                                  ↳ {item.special_instructions}
                                </p>
                              )}
                            </div>
                            <span className="font-mono font-semibold shrink-0">
                              ₱{Number(item.subtotal ?? item.unit_price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Packaging fee line item (if take-out) */}
                    {Number(order.packaging_fee || 0) > 0 && (
                      <div
                        className={`flex justify-between items-center py-1.5 border-t text-xs sm:text-sm ${
                          isBatchoy ? 'border-zinc-800 text-zinc-300' : 'border-zinc-100 text-zinc-700'
                        }`}
                      >
                        <span className="font-medium">Packaging Fee (₱10/tub)</span>
                        <span className="font-mono font-semibold">
                          ₱{Number(order.packaging_fee).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Ticket subtotal */}
                    <div
                      className={`flex items-center justify-between pt-2 border-t font-semibold ${
                        isBatchoy ? 'border-zinc-800' : 'border-zinc-200'
                      }`}
                    >
                      <span className={`text-[11px] uppercase tracking-wider font-bold ${theme.subtleText}`}>
                        Ticket Subtotal
                      </span>
                      <span className={`font-mono text-sm sm:text-base font-bold ${isBatchoy ? 'text-white' : 'text-zinc-900'}`}>
                        ₱{getOrderGrandTotal(order).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom consolidated summary */}
      <div
        className={`rounded-2xl border p-4.5 sm:p-5 ${
          isBatchoy
            ? 'bg-zinc-900/90 border-zinc-800 text-white'
            : 'bg-orange-50/70 border-orange-200 text-zinc-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-widest ${theme.subtleText}`}>
              {allPaid ? 'Total Paid at Cashier' : 'Total Due at Cashier'}
            </p>
            <p className={`text-xs mt-0.5 ${isBatchoy ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Combined total for all {orders.length} tickets
            </p>
          </div>
          <p className={`text-3xl font-black font-mono tracking-tight ${isBatchoy ? 'text-white' : 'text-zinc-900'}`}>
            ₱{tableTotal.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Cashier counter note */}
      <div
        className={`rounded-2xl border px-4 py-3.5 text-center ${
          isBatchoy
            ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300'
            : 'bg-orange-50 border-orange-200 text-zinc-800'
        }`}
      >
        <p className="text-[13px] font-medium leading-snug">
          {allPaid ? (
            <>
              All orders for <strong>Table {displayTable || ''}</strong> are marked <strong>Paid &amp; Completed</strong>. Enjoy your meal!
            </>
          ) : (
            <>
              State <strong>Table {displayTable || ''}</strong> at the cashier when paying (consolidates orders{' '}
              {orders.map((o) => `#${o.order_number}`).join(', ')}).
            </>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Digital receipt ──────────────────────────────────────────────────────────
function DigitalReceipt({
  order,
  tableNumber,
  theme,
  isBatchoy,
}: {
  order: Order;
  tableNumber?: string;
  theme: Theme;
  isBatchoy: boolean;
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

  const isTakeOut = checkIsTakeOut(order);
  const isPaid = order.status === 'completed';

  const itemsSubtotal =
    order?.order_items?.reduce(
      (sum, item) =>
        sum +
        Number((item as any).price ?? item.unit_price ?? 0) *
          Number(item.quantity || 1),
      0
    ) || 0;
  const pkgFee = Number(order?.packaging_fee || 0);
  const calculatedGrandTotal =
    itemsSubtotal > 0
      ? itemsSubtotal + pkgFee
      : Math.max(Number(order?.total_amount || 0), pkgFee);

  return (
    <div className="w-full space-y-6">
      {/* Receipt header */}
      <div className="flex items-start justify-between">
        <div>
          <p className={['text-[11px] font-bold uppercase tracking-widest mb-1', theme.subtleText].join(' ')}>
            Order
          </p>
          <p className={`text-4xl font-black font-mono tracking-tight ${isBatchoy ? 'text-red-600' : 'text-orange-500'}`}>
            #{order.order_number}
          </p>
          {/* Order type pill */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isTakeOut ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Package className="w-3.5 h-3.5" /> Take-Out
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                <Utensils className="w-3.5 h-3.5" /> Dine-In
              </span>
            )}
            {isPaid && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="w-3.5 h-3.5" /> Paid / Completed
              </span>
            )}
          </div>
          {timeStr && (
            <p className={['text-xs mt-1.5', theme.subtleText].join(' ')}>Placed at {timeStr}</p>
          )}
        </div>
        <ReceiptText size={30} strokeWidth={1.3} className={theme.subtleText} />
      </div>

      {/* Items list */}
      <div>
        {items.length === 0 ? (
          <p className={['py-4 text-sm', theme.subtleText].join(' ')}>No items available.</p>
        ) : (
          items.map((item, i) => (
            <div
              key={item.id ?? i}
              className={`flex justify-between items-center py-3 border-b ${
                isBatchoy ? 'border-zinc-800/80 text-zinc-200' : 'border-zinc-100 text-zinc-800'
              }`}
            >
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-sm font-medium">
                  <span className={`font-mono font-bold mr-1.5 text-[13px] ${isBatchoy ? 'text-red-600' : 'text-orange-500'}`}>
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
              <p className="text-sm font-mono font-semibold shrink-0">
                ₱{Number(item.subtotal ?? item.unit_price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Packaging Fee breakdown */}
      {Number(order.packaging_fee || 0) > 0 && (
        <div
          className={`flex justify-between items-center py-2.5 border-b text-sm ${
            isBatchoy ? 'border-zinc-800/80 text-zinc-300' : 'border-zinc-100 text-zinc-700'
          }`}
        >
          <span className="font-medium text-xs sm:text-sm">Packaging Fee (₱10/tub)</span>
          <span className="font-mono font-semibold">
            ₱{Number(order.packaging_fee).toFixed(2)}
          </span>
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between pt-1">
        <p className={['text-[11px] font-bold uppercase tracking-widest', theme.subtleText].join(' ')}>
          Total
        </p>
        <span className={`text-3xl font-black font-mono tracking-tight ${isBatchoy ? 'text-white' : 'text-zinc-900'}`}>
          ₱{calculatedGrandTotal.toFixed(2)}
        </span>
      </div>

      {/* Cashier note */}
      <div
        className={`rounded-2xl border px-4 py-3.5 text-center ${
          isBatchoy
            ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300'
            : 'bg-orange-50 border-orange-200 text-zinc-800'
        }`}
      >
        <p className="text-[13px] font-medium leading-snug">
          {isTakeOut ? (
            <>
              State <strong>Take-Out</strong> &amp; Order <strong>#{order.order_number}</strong> at the cashier when paying.
            </>
          ) : displayTable ? (
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
  const brandParam = searchParams.get('brand');

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string>(orderIdParam);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storedBrand, setStoredBrand] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const b = localStorage.getItem('@kyle_pos_brand') || localStorage.getItem('kyles_active_brand');
      if (b) setStoredBrand(b);
    }
  }, []);

  // Load orders for table or single order
  const loadOrders = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);

    try {
      if (rawTableNumber) {
        // Table view: fetch active orders belonging to this table (excluding archived)
        const res = await getOrdersByTableAction(rawTableNumber);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const validOrders = res.data.filter(
            (o) => o.status !== 'Archived' && o.status !== 'archived'
          );
          setOrders(validOrders);
          if (typeof window !== 'undefined') {
            const activeRemaining = validOrders.filter((o) =>
              ['pending', 'preparing', 'ready'].includes(o.status)
            );
            if (activeRemaining.length === 0) {
              try {
                localStorage.removeItem('@kyle_pos_my_orders');
              } catch {}
            }
          }
          if (validOrders.length > 0) {
            // Set active order if not already selected, or if current selection not found
            setActiveOrderId((prev) => {
              if (prev && validOrders.some((o) => o.id === prev)) return prev;
              if (orderIdParam && validOrders.some((o) => o.id === orderIdParam)) return orderIdParam;
              // Prefer first active order, else latest order
              const active = validOrders.find((o) => ['pending', 'preparing', 'ready'].includes(o.status));
              return active ? active.id : validOrders[0].id;
            });
          } else {
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem('@kyle_pos_my_orders');
                localStorage.removeItem('kyles_last_order_id');
              } catch {}
            }
            setOrders([]);
          }
        } else if (orderIdParam) {
          // Fallback to specific orderId if table query returned nothing
          const singleRes = await getOrderByIdAction(orderIdParam);
          if (
            singleRes.success &&
            singleRes.data &&
            singleRes.data.status !== 'Archived' &&
            singleRes.data.status !== 'archived'
          ) {
            setOrders([singleRes.data]);
            setActiveOrderId(singleRes.data.id);
          } else {
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem('@kyle_pos_my_orders');
                localStorage.removeItem('kyles_last_order_id');
              } catch {}
            }
            setOrders([]);
          }
        } else {
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('@kyle_pos_my_orders');
              localStorage.removeItem('kyles_last_order_id');
            } catch {}
          }
          setOrders([]);
        }
      } else if (orderIdParam) {
        // Single order view
        const res = await getOrderByIdAction(orderIdParam);
        if (
          res.success &&
          res.data &&
          res.data.status !== 'Archived' &&
          res.data.status !== 'archived'
        ) {
          setOrders([res.data]);
          setActiveOrderId(res.data.id);

          // If the order has a table, load other orders for this table in the background
          const matchedTable = res.data.dining_table?.table_number
            ? String(res.data.dining_table.table_number)
            : res.data.customer_notes?.replace(/^table\s*/i, '').trim();
          if (matchedTable) {
            getOrdersByTableAction(matchedTable).then((tableRes) => {
              if (tableRes.success && Array.isArray(tableRes.data) && tableRes.data.length > 0) {
                const validTableOrders = tableRes.data.filter(
                  (o) => o.status !== 'Archived' && o.status !== 'archived'
                );
                if (validTableOrders.length > 0) {
                  setOrders(validTableOrders);
                }
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
            const valid = res.data.filter(
              (o) => o.status !== 'Archived' && o.status !== 'archived'
            );
            if (valid.length > 0) {
              setOrders(valid);
              setActiveOrderId(valid[0].id);
              return;
            }
          }
        }

        if (storedId) {
          const res = await getOrderByIdAction(storedId);
          if (
            res.success &&
            res.data &&
            res.data.status !== 'Archived' &&
            res.data.status !== 'archived'
          ) {
            setOrders([res.data]);
            setActiveOrderId(res.data.id);
          } else {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('kyles_last_order_id');
            }
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

  // Brand detection
  const orderBrand =
    (currentOrder as unknown as { brand?: string })?.brand ||
    (orders[0] as unknown as { brand?: string })?.brand;
  const activeBrand =
    brandParam ||
    orderBrand ||
    storedBrand ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('@kyle_pos_brand') || localStorage.getItem('kyles_active_brand')
      : null) ||
    'kyles-eatery';
  const isBatchoy = activeBrand === 'batchoy-shop' || activeBrand === 'batchoy';
  const brand: Brand = isBatchoy ? 'batchoy-shop' : 'kyles-eatery';
  const theme = BRAND_THEME[brand];

  // Table ID for realtime
  const resolvedTableId = useMemo(() => {
    const fromOrder = orders.find((o) => o.table_id)?.table_id;
    return fromOrder || (orders[0]?.dining_table?.id ?? null);
  }, [orders]);

  // Stable key of all order IDs currently in orders
  const orderIdsKey = useMemo(() => {
    return orders.map((o) => o.id).filter(Boolean).sort().join(',');
  }, [orders]);

  // Live status updates
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // 1. Subscribe to each individual order in the table
    const ids = orderIdsKey ? orderIdsKey.split(',') : [];
    if (ids.length === 0 && activeOrderId) {
      ids.push(activeOrderId);
    }

    ids.forEach((id) => {
      const unsub = subscribeToCustomerOrder(id, {
        onOrderUpdated: (updated) => {
          if (updated && Object.keys(updated).length > 0) {
            setOrders((prev) =>
              prev.map((o) => (o.id === id || o.id === updated.id ? { ...o, ...updated } : o))
            );
          }
          loadOrders(true);
        },
      });
      unsubscribes.push(unsub);
    });

    // 2. Subscribe to table events if tableId is known
    if (resolvedTableId) {
      const unsubTable = subscribeToTableOrders(resolvedTableId, {
        onOrderUpdated: (updated) => {
          if (updated && Object.keys(updated).length > 0) {
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
            );
          }
          loadOrders(true);
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
  }, [orderIdsKey, activeOrderId, resolvedTableId, loadOrders]);

  // Resolved table number
  const tableNumber =
    rawTableNumber ||
    (currentOrder?.dining_table?.table_number
      ? String(currentOrder.dining_table.table_number)
      : currentOrder?.customer_notes?.replace(/^table\s*/i, '').trim() || '');

  // Back to menu URL preserves query parameters
  const backToMenuUrl = useMemo(() => {
    return tableNumber
      ? `/?brand=${encodeURIComponent(activeBrand)}&table=${encodeURIComponent(tableNumber)}`
      : `/?brand=${encodeURIComponent(activeBrand)}`;
  }, [tableNumber, activeBrand]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className={`min-h-screen w-full transition-colors flex items-center justify-center ${
          isBatchoy ? 'dark bg-zinc-950 text-white' : 'bg-white text-zinc-900'
        }`}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
          className={`w-10 h-10 border-[3px] border-t-transparent rounded-full ${
            isBatchoy ? 'border-red-600' : 'border-orange-500'
          }`}
        />
      </div>
    );
  }

  // ── No Orders Found ───────────────────────────────────────────────────────
  if (!currentOrder || orders.length === 0) {
    return (
      <div
        className={`min-h-screen w-full transition-colors flex flex-col ${
          isBatchoy ? 'dark bg-zinc-950 text-white' : 'bg-white text-zinc-900'
        }`}
      >
        {/* Brand header */}
        <header
          className={`sticky top-0 z-40 backdrop-blur-md border-b ${
            isBatchoy ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/90 border-zinc-200'
          }`}
        >
          <div className="max-w-lg mx-auto px-5 min-h-[4rem] py-2 flex items-center justify-between w-full">
            <div className="flex-1 flex items-center justify-start">
              <Link
                href={backToMenuUrl}
                aria-label="Back to menu"
                className={`p-2 rounded-full transition-colors -ml-2 ${
                  isBatchoy
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                <ArrowLeft size={18} />
              </Link>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {isBatchoy ? (
                <Image
                  src="/batchoy-logo.png"
                  alt="Batchoy Shop"
                  width={160}
                  height={40}
                  className="h-8 sm:h-9 w-auto object-contain scale-[2.2] origin-center shrink-0"
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
              {tableNumber ? (
                <span
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wide uppercase shadow-sm whitespace-nowrap ${
                    isBatchoy
                      ? 'bg-zinc-900 border-zinc-800 text-white'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-900'
                  }`}
                >
                  <Armchair className="w-3.5 h-3.5 text-zinc-500 shrink-0" strokeWidth={2} />
                  <span>Table {String(tableNumber).padStart(2, '0')}</span>
                </span>
              ) : (
                <div className="w-9" />
              )}
            </div>
          </div>
        </header>

        <main className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <Receipt className={`w-20 h-20 mb-6 ${isBatchoy ? 'text-zinc-800' : 'text-zinc-200'}`} strokeWidth={1} />
          <h2 className={`text-2xl font-black tracking-tight ${isBatchoy ? 'text-white' : 'text-zinc-900'}`}>
            {tableNumber ? `No Active Orders for Table ${String(tableNumber).padStart(2, '0')}` : 'No Orders to Track'}
          </h2>
          <p className={`max-w-sm mx-auto mt-3 leading-relaxed text-sm ${isBatchoy ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {tableNumber
              ? `You haven't placed an order for Table ${String(tableNumber).padStart(2, '0')} yet, or your previous orders are already completed.`
              : 'Scan your table QR code or order from the menu to track your order in real-time.'}
          </p>
          <Link
            href={backToMenuUrl}
            className={`inline-flex items-center gap-2 mt-8 px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg transition active:scale-95 ${
              isBatchoy
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-950/50'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
            }`}
          >
            <ArrowLeft size={15} />
            Browse Menu &amp; Order
          </Link>
        </main>
      </div>
    );
  }

  const isMultiOrder = orders.length > 1;
  const allOrdersCompleted = orders.length > 0 && orders.every((o) => o.status === 'completed');
  const hasPreparing = orders.some((o) => o.status === 'preparing');
  const hasReady = orders.some((o) => o.status === 'ready');
  const allCancelled = orders.length > 0 && orders.every((o) => o.status === 'cancelled');

  const activeStatus: OrderStatus = isMultiOrder
    ? allOrdersCompleted
      ? 'completed'
      : hasReady
      ? 'ready'
      : hasPreparing
      ? 'preparing'
      : allCancelled
      ? 'cancelled'
      : 'pending'
    : currentOrder.status;

  const activeStep = statusToStep(activeStatus);
  const isDone = activeStatus === 'completed';
  const isCancelled = activeStatus === 'cancelled';
  const displayTable =
    currentOrder.dining_table?.table_number ?? (tableNumber ? Number(tableNumber) : null);

  return (
    <div
      className={`min-h-screen w-full transition-colors flex flex-col ${
        isBatchoy ? 'dark bg-zinc-950 text-white' : 'bg-white text-zinc-900'
      }`}
    >
      {/* ── Brand header (Customer facing — no staff Navbar) ─────────────── */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b ${
          isBatchoy ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/90 border-zinc-200'
        }`}
      >
        <div className="max-w-lg mx-auto px-5 min-h-[4rem] py-2 flex items-center justify-between w-full">
          <div className="flex-1 flex items-center justify-start">
            <Link
              href={backToMenuUrl}
              aria-label="Back to menu"
              className={`p-2 rounded-full transition-colors -ml-2 ${
                isBatchoy
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              <ArrowLeft size={18} />
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {isBatchoy ? (
              <Image
                src="/batchoy-logo.png"
                alt="Batchoy Shop"
                width={160}
                height={40}
                className="h-8 sm:h-9 w-auto object-contain scale-[2.2] origin-center shrink-0"
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
              <span
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wide uppercase shadow-sm whitespace-nowrap ${
                  isBatchoy
                    ? 'bg-zinc-900 border-zinc-800 text-white'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-900'
                }`}
              >
                <Armchair className="w-3.5 h-3.5 text-zinc-500 shrink-0" strokeWidth={2} />
                <span>Table {String(displayTable).padStart(2, '0')}</span>
              </span>
            )}
            <button
              onClick={() => loadOrders(true)}
              aria-label="Refresh orders"
              className={`p-1.5 rounded-full transition-colors ${
                isBatchoy
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100'
              }`}
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
            key={(isMultiOrder ? `table-${tableNumber}` : currentOrder.id) + '-' + activeStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="text-center space-y-1.5"
          >
            <p className={`text-[11px] font-bold uppercase tracking-widest ${isBatchoy ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Order Status
            </p>
            {isDone && (
              <p className={`text-2xl font-extrabold ${isBatchoy ? 'text-white' : 'text-zinc-900'}`}>
                Paid &amp; Completed
              </p>
            )}
            {isCancelled && (
              <p className="text-2xl font-extrabold text-red-500">Order Cancelled</p>
            )}
            {!isDone && !isCancelled && (
              <>
                <p className={`text-2xl font-extrabold ${isBatchoy ? 'text-white' : 'text-zinc-900'}`}>
                  {activeStep === 0 && 'Sent to Cashier'}
                  {activeStep === 1 && 'Kitchen is Preparing...'}
                  {activeStep === 2 && 'Ready for Pickup'}
                </p>
                {activeStep === 0 && (
                  <p className={`text-sm ${isBatchoy ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isMultiOrder
                      ? `Please proceed to the cashier counter to confirm payment for all ${orders.length} tickets.`
                      : 'Please proceed to the cashier counter to confirm payment.'}
                  </p>
                )}
                {activeStep === 1 && (
                  <p className={`text-sm ${isBatchoy ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Your food is being freshly prepared in the kitchen.
                  </p>
                )}
                {activeStep === 2 && (
                  <p className={`text-sm ${isBatchoy ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Your order is ready! Please collect it at the counter.
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        {!isCancelled && <ProgressStepper status={activeStatus} theme={theme} isBatchoy={isBatchoy} />}

        {/* Divider */}
        <div className={`w-full h-px ${isBatchoy ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        {/* Receipt section: single ticket or grouped table receipt */}
        {isMultiOrder ? (
          <GroupedTableReceipt
            orders={orders}
            tableNumber={tableNumber || rawTableNumber || undefined}
            theme={theme}
            isBatchoy={isBatchoy}
          />
        ) : (
          <DigitalReceipt
            order={currentOrder}
            tableNumber={tableNumber || rawTableNumber || undefined}
            theme={theme}
            isBatchoy={isBatchoy}
          />
        )}

        {/* Actions / Order More */}
        <div className="space-y-3 pt-2 pb-8 text-center">
          <Link
            href={backToMenuUrl}
            className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-98 ${
              isBatchoy
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-950/50'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
            }`}
          >
            <ShoppingBag size={16} />
            Order More Food
          </Link>

          <div>
            <Link
              href={backToMenuUrl}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold transition hover:underline ${
                isBatchoy ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
              }`}
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
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CustomerStatusContent />
    </Suspense>
  );
}
