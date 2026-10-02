"use client";

import { Suspense, useEffect, useTransition, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import {
  ShoppingCart, Plus, Minus, X, Flame, Leaf, ChevronDown, CheckCircle, ReceiptText,
} from "lucide-react";
import { Category, MenuItem, Order } from "@/types/database";
import { getCategoriesAction, getMenuItemsAction } from "@/app/actions/menu";
import { getTablesAction } from "@/app/actions/tables";
import { createOrderAction, getOrdersByTableAction } from "@/app/actions/orders";
import { useCartStore, Brand } from "@/lib/store/cart";

// ??? Utility ??????????????????????????????????????????????????????????????
function cn(...inputs: (string | undefined | null | false | 0 | Record<string, boolean>)[]): string {
  return twMerge(clsx(...inputs));
}

// ??? Dual-Brand Fallback Data ??????????????????????????????????????????????
const DUAL_BRAND_CATEGORIES: Category[] = [
  { id: "cat-kyles", name: "Kyle's Eatery (Mon-Sat)", slug: "kyles-eatery", description: "Mon-Sat Schedule", display_order: 1, created_at: "" },
  { id: "cat-batchoy", name: "Batchoy Shop (Sunday)", slug: "batchoy-shop", description: "Sunday Schedule", display_order: 2, created_at: "" },
];

const DUAL_BRAND_MENU: MenuItem[] = [
  { id: "chori-sandwich", category_id: "cat-kyles", name: "Chori Sandwich", description: "Grilled savory chorizo patty in soft toasted bun with special sauce", price: 199, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, created_at: "", updated_at: "" },
  { id: "backribs", category_id: "cat-kyles", name: "Backribs", description: "Tender slow-cooked pork backribs in savory barbecue glaze served with rice", price: 160, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, created_at: "", updated_at: "" },
  { id: "hungarian", category_id: "cat-kyles", name: "Hungarian", description: "Juicy grilled Hungarian sausage served with garlic rice and egg", price: 120, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 1, created_at: "", updated_at: "" },
  { id: "sisig", category_id: "cat-kyles", name: "Sisig", description: "Sizzling crispy seasoned pork sisig topped with chili and calamansi", price: 160, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 1, created_at: "", updated_at: "" },
  { id: "palabok", category_id: "cat-kyles", name: "Palabok", description: "Traditional rice noodles with rich savory sauce, chicharon, and egg toppings", price: 50, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, created_at: "", updated_at: "" },
  { id: "tocino", category_id: "cat-kyles", name: "Tocino", description: "Sweet cured caramelized pork tocino served with garlic rice", price: 85, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, created_at: "", updated_at: "" },
  { id: "chicken-ala-king", category_id: "cat-kyles", name: "Chicken Ala King", description: "Creamy chicken ala king with bell peppers and mushrooms over rice", price: 99, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, created_at: "", updated_at: "" },
  { id: "fried-inasal", category_id: "cat-kyles", name: "Fried Inasal", description: "Crispy fried chicken inasal marinated in calamansi and lemongrass", price: 85, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, created_at: "", updated_at: "" },
  { id: "batchoy-special", category_id: "cat-batchoy", name: "Batchoy Special", description: "Authentic Iloilo noodle soup with pork cracklings, liver, egg, bone marrow broth", price: 150, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, created_at: "", updated_at: "" },
  { id: "ordinary-batchoy", category_id: "cat-batchoy", name: "Ordinary Batchoy", description: "Classic comforting Iloilo miki noodle soup with savory broth and chicharon", price: 100, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, created_at: "", updated_at: "" },
  { id: "chicken-tempura", category_id: "cat-batchoy", name: "Chicken Tempura", description: "Crispy golden Japanese-style battered chicken strips with dip", price: 120, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, created_at: "", updated_at: "" },
  { id: "egg-fried-rice", category_id: "cat-batchoy", name: "Egg Fried Rice", description: "Fragrant wok-fried rice with fluffy eggs and green onions", price: 45, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, created_at: "", updated_at: "" },
  { id: "caesar-salad", category_id: "cat-batchoy", name: "Caesar Salad", description: "Fresh crisp romaine lettuce, parmesan shavings, croutons, classic dressing", price: 199, image_url: null, is_available: true, is_vegetarian: true, spiciness_level: 0, created_at: "", updated_at: "" },
  { id: "chorizo-sandwich", category_id: "cat-batchoy", name: "Chorizo Sandwich", description: "Grilled savory garlic chorizo patty in soft toasted bun", price: 95, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, created_at: "", updated_at: "" },
];

// ??? Theme tokens ??????????????????????????????????????????????????????????
const THEME = {
  "kyles-eatery": {
    bg: "bg-white", surface: "bg-zinc-50",
    card: "bg-white border border-zinc-100",
    cardHover: "hover:border-orange-200 hover:shadow-sm",
    text: "text-zinc-900", subtext: "text-zinc-500",
    price: "text-orange-500",
    accent: "bg-orange-500 hover:bg-orange-600 text-white",
    accentRing: "ring-orange-300",
    tab: "bg-orange-500 text-white", tabInactive: "text-zinc-500 hover:text-zinc-800",
    badge: "bg-orange-50 text-orange-600 border border-orange-100",
    readOnly: "bg-zinc-50 border-b border-zinc-200 text-zinc-600",
    activeTable: "bg-emerald-50 border-b border-emerald-200 text-emerald-700",
    dot: "bg-emerald-500",
    drawer: "bg-white border-t border-zinc-200",
    drawerSurface: "bg-zinc-50 border border-zinc-100",
    input: "bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:border-orange-400",
    successBg: "bg-white border border-emerald-200",
    brandName: "Kyle's Eatery", brandTagline: "Filipino comfort food, served fresh. (Mon-Sat)",
    floatBtn: "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200/80",
    qty: "bg-zinc-100 hover:bg-zinc-200 text-zinc-700",
    qtyCount: "text-orange-500 font-mono font-bold",
    cartFooter: "border-t border-zinc-100 bg-zinc-50",
    submitBtn: "bg-orange-500 hover:bg-orange-600 text-white",
    cancelBtn: "bg-zinc-100 hover:bg-zinc-200 text-zinc-700",
    headerBg: "bg-white/90 border-zinc-100",
    tableBadge: "bg-zinc-100 text-zinc-800 border-zinc-200",
  },
  "batchoy-shop": {
    bg: "bg-zinc-950", surface: "bg-zinc-900",
    card: "bg-zinc-900 border border-zinc-800",
    cardHover: "hover:border-red-800",
    text: "text-white", subtext: "text-zinc-400",
    price: "text-red-400",
    accent: "bg-red-600 hover:bg-red-700 text-white",
    accentRing: "ring-red-700",
    tab: "bg-red-600 text-white", tabInactive: "text-zinc-500 hover:text-zinc-200",
    badge: "bg-red-950 text-red-400 border border-red-900",
    readOnly: "bg-zinc-900 border-b border-zinc-800 text-zinc-400",
    activeTable: "bg-emerald-950 border-b border-emerald-800 text-emerald-400",
    dot: "bg-emerald-500",
    drawer: "bg-zinc-900 border-t border-zinc-800",
    drawerSurface: "bg-zinc-950 border border-zinc-800",
    input: "bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-red-700",
    successBg: "bg-zinc-900 border border-emerald-800",
    brandName: "Batchoy Shop", brandTagline: "Authentic Iloilo batchoy & Sunday specials.",
    floatBtn: "bg-red-600 hover:bg-red-700 text-white shadow-red-900/60",
    qty: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200",
    qtyCount: "text-red-400 font-mono font-bold",
    cartFooter: "border-t border-zinc-800 bg-zinc-950",
    submitBtn: "bg-red-600 hover:bg-red-700 text-white",
    cancelBtn: "bg-zinc-800 hover:bg-zinc-700 text-zinc-300",
    headerBg: "bg-zinc-950/90 border-zinc-800",
    tableBadge: "bg-zinc-900 text-zinc-200 border-zinc-700",
  },
} as const;

type Theme = typeof THEME[keyof typeof THEME];

// ??? Menu Card ?????????????????????????????????????????????????????????????
function MenuCard({
  item, theme, inCart, qty, isOrderingEnabled, onAdd, onInc, onDec,
}: {
  item: MenuItem; theme: Theme; inCart: boolean; qty: number;
  isOrderingEnabled: boolean; onAdd: () => void; onInc: () => void; onDec: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200",
        theme.card, isOrderingEnabled && theme.cardHover
      )}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn("font-semibold text-[15px] leading-snug", theme.text)}>{item.name}</h3>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {item.spiciness_level > 0 && <Flame size={13} className="text-orange-400" aria-label="Spicy" />}
            {item.is_vegetarian && <Leaf size={13} className="text-emerald-500" aria-label="Vegetarian" />}
          </div>
        </div>
        <p className={cn("text-xs leading-relaxed line-clamp-2", theme.subtext)}>{item.description}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className={cn("text-lg font-bold font-mono tracking-tight", theme.price)}>
          ₱{Number(item.price).toFixed(0)}
        </span>

        {isOrderingEnabled && (
          inCart ? (
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.88 }} onClick={onDec}
                className={cn("w-7 h-7 rounded-full flex items-center justify-center transition", theme.qty)}>
                <Minus size={12} />
              </motion.button>
              <motion.span key={qty} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                transition={{ duration: 0.15 }} className={cn("w-5 text-center text-sm", theme.qtyCount)}>
                {qty}
              </motion.span>
              <motion.button whileTap={{ scale: 0.88 }} onClick={onInc}
                className={cn("w-7 h-7 rounded-full flex items-center justify-center transition", theme.qty)}>
                <Plus size={12} />
              </motion.button>
            </div>
          ) : (
            <motion.button whileTap={{ scale: 0.93 }} onClick={onAdd}
              className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition", theme.accent)}>
              <Plus size={12} />Add
            </motion.button>
          )
        )}
      </div>
    </motion.div>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({
  theme, rawTableNumber,
  onSubmit, isPending, errorMessage, onClose,
}: {
  theme: Theme; rawTableNumber: string;
  onSubmit: () => void; isPending: boolean; errorMessage: string | null; onClose: () => void;
}) {
  const { items, updateQuantity, updateInstructions, totalCount, subtotal } = useCartStore();

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
        className={cn(
          "w-full sm:max-w-md flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden",
          "max-h-[90dvh]",
          theme.drawer
        )}
      >
        {/* Fixed Header */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b border-inherit">
          <div>
            <h2 className={cn("text-base font-bold flex items-center gap-2", theme.text)}>
              <ShoppingCart size={16} />Your Order
              {rawTableNumber && (
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", theme.badge)}>
                  Table {rawTableNumber}
                </span>
              )}
            </h2>
            <p className={cn("text-xs mt-0.5", theme.subtext)}>
              {totalCount()} item{totalCount() !== 1 ? "s" : ""} · ₱{subtotal().toFixed(2)}
            </p>
          </div>
          <button onClick={onClose}
            className={cn("w-8 h-8 rounded-full flex items-center justify-center transition", theme.qty)}>
            <X size={14} />
          </button>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <AnimatePresence initial={false}>
            {items.map((c) => (
              <motion.div key={c.menuItem.id} layout
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                className={cn("rounded-xl p-3.5 space-y-2.5", theme.drawerSurface)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold truncate", theme.text)}>{c.menuItem.name}</p>
                    <p className={cn("text-xs font-mono", theme.price)}>
                      ₱{(Number(c.menuItem.price) * c.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => updateQuantity(c.menuItem.id, -1)}
                      className={cn("w-7 h-7 rounded-full flex items-center justify-center transition", theme.qty)}>
                      <Minus size={11} />
                    </button>
                    <span className={cn("w-5 text-center text-sm", theme.qtyCount)}>{c.quantity}</span>
                    <button onClick={() => updateQuantity(c.menuItem.id, 1)}
                      className={cn("w-7 h-7 rounded-full flex items-center justify-center transition", theme.qty)}>
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
                <input type="text" placeholder="Special instructions..."
                  value={c.specialInstructions}
                  onChange={(e) => updateInstructions(c.menuItem.id, e.target.value)}
                  className={cn("w-full text-xs rounded-lg px-3 py-2 outline-none transition", theme.input)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className={cn("py-16 text-center text-sm", theme.subtext)}>
              Your cart is empty.<br />Add items from the menu.
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        {items.length > 0 && (
          <div className={cn("shrink-0 px-5 pt-4 pb-8 safe-bottom", theme.cartFooter)}>
            {errorMessage && (
              <p className="mb-3 text-xs text-red-500 bg-red-50 dark:bg-red-950 rounded-xl px-3 py-2 border border-red-200 dark:border-red-900">
                {errorMessage}
              </p>
            )}
            <div className={cn("flex justify-between items-baseline mb-4", theme.text)}>
              <span className="text-sm font-medium">Total</span>
              <span className={cn("text-2xl font-bold font-mono tracking-tight", theme.price)}>
                ₱{subtotal().toFixed(2)}
              </span>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={onSubmit} disabled={isPending}
              className={cn("w-full py-3.5 rounded-2xl text-sm font-bold transition disabled:opacity-50", theme.submitBtn)}>
              {isPending ? "Sending to Cashier..." : "Place Order →"}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Success Modal ─────────────────────────────────────────────────────────
function SuccessModal({
  order, theme, brand = "kyles-eatery", rawTableNumber, onClose,
}: {
  order: Order; theme: Theme; brand?: string; rawTableNumber: string; onClose: () => void;
}) {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const items = order.order_items ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={cn("w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl", theme.successBg)}
      >
        {/* Top section */}
        <div className="p-8 text-center space-y-5">
          {/* Check icon */}
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800"
          >
            <CheckCircle size={28} />
          </motion.div>

          {/* Title */}
          <div>
            <h3 className={cn("text-xl font-bold", theme.text)}>Order Received!</h3>
            <p className={cn("text-xs mt-1", theme.subtext)}>Your order has been sent to the cashier.</p>
          </div>

          {/* Order number + total */}
          <div className={cn("rounded-2xl p-4 space-y-0.5", theme.surface)}>
            <p className={cn("text-xs", theme.subtext)}>Order Number</p>
            <p className={cn("text-2xl font-bold font-mono tracking-wider", theme.price)}>
              #{order.order_number}
            </p>
            <p className={cn("text-base font-semibold font-mono", theme.text)}>
              ₱{Number(order.total_amount).toFixed(2)}
            </p>
          </div>

          {/* Cashier instruction */}
          <div className="rounded-2xl border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-center">
            <p className="text-[13px] font-medium text-amber-800 dark:text-amber-300 leading-snug">
              Please state{rawTableNumber ? ` Table ${rawTableNumber} and` : ""}{" "}
              Order <span className="font-bold">#{order.order_number}</span> at the
              cashier counter when paying.
            </p>
          </div>

          {/* Receipt accordion toggle */}
          {items.length > 0 && (
            <button
              onClick={() => setReceiptOpen((o) => !o)}
              className={cn(
                "w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-xl transition",
                theme.qty
              )}
            >
              <span>{receiptOpen ? "Hide" : "View"} itemized receipt</span>
              <motion.span
                animate={{ rotate: receiptOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={14} />
              </motion.span>
            </button>
          )}

          {/* Accordion receipt body */}
          <AnimatePresence initial={false}>
            {receiptOpen && items.length > 0 && (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className={cn("rounded-2xl divide-y text-left", theme.drawerSurface)}>
                  {items.map((item, i) => (
                    <div key={item.id ?? i} className="flex items-baseline justify-between gap-2 px-3.5 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold truncate", theme.text)}>
                          {item.quantity}× {item.menu_item_name}
                        </p>
                        {item.special_instructions && (
                          <p className={cn("text-[10px] italic truncate mt-0.5", theme.subtext)}>
                            {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <p className={cn("text-xs font-mono shrink-0", theme.price)}>
                        ₱{Number(item.subtotal).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <div className={cn("flex justify-between items-center px-3.5 py-2.5", theme.text)}>
                    <span className="text-xs font-bold">Total</span>
                    <span className={cn("text-sm font-bold font-mono", theme.price)}>
                      ₱{Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Buttons */}
          <div className="space-y-2.5 pt-1">
            <Link
              href={`/status?order=${order.id}&brand=${brand}${rawTableNumber ? `&table=${encodeURIComponent(rawTableNumber)}` : ""}`}
              className={cn(
                "w-full py-3.5 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm",
                theme.submitBtn
              )}
            >
              <ReceiptText size={16} />
              Track My Order
            </Link>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className={cn("w-full py-3 rounded-2xl text-sm font-semibold transition", theme.cancelBtn)}
            >
              Order More
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ??? Root Page ???????????????????????????????????????????????????????????????
export default function CustomerHomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
            className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
          />
        </div>
      }
    >
      <CustomerMenuContent />
    </Suspense>
  );
}

// ─── Main Content Component ───────────────────────────────────────────────────
function CustomerMenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableParam = searchParams.get("table");
  const isOrderingEnabled = Boolean(tableParam && tableParam.trim().length > 0);
  const rawTableNumber = tableParam ? tableParam.replace(/^table\s*/i, "").trim() : "";

  const brandParam = searchParams.get("brand");
  const dayOfWeek = new Date().getDay();
  const systemBrand: Brand = dayOfWeek === 0 ? "batchoy-shop" : "kyles-eatery";
  const effectiveBrand: Brand =
    brandParam === "batchoy-shop" || brandParam === "kyles-eatery"
      ? brandParam
      : systemBrand;

  const {
    setActiveBrand, setTodayBrand,
    isCartOpen, setCartOpen, items: cartItems, addItem, updateQuantity, clearCart,
    totalCount, subtotal,
  } = useCartStore();

  const theme = THEME[effectiveBrand];

  const [categories, setCategories] = useState<Category[]>(DUAL_BRAND_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DUAL_BRAND_MENU);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [hasActiveOrder, setHasActiveOrder] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveBrand(effectiveBrand);
    setTodayBrand(systemBrand);

    async function loadData() {
      const [catRes, itemRes, tableRes] = await Promise.all([
        getCategoriesAction(), getMenuItemsAction(), getTablesAction(),
      ]);
      if (catRes.success && catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (itemRes.success && itemRes.data && itemRes.data.length > 0) setMenuItems(itemRes.data);
      if (tableRes.success && tableRes.data && tableRes.data.length > 0) {
        if (rawTableNumber) {
          const matched = tableRes.data.find(
            (t) => String(t.table_number) === rawTableNumber || t.id === tableParam || t.qr_code_token === tableParam
          );
          setSelectedTableId(matched ? matched.id : tableRes.data[0].id);
        } else {
          setSelectedTableId(tableRes.data[0].id);
        }
      }
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawTableNumber, tableParam, effectiveBrand]);

  // Save table number to localStorage whenever detected
  useEffect(() => {
    if (rawTableNumber && typeof window !== "undefined") {
      try {
        localStorage.setItem("kyles_current_table", rawTableNumber);
      } catch {}
    }
  }, [rawTableNumber]);

  // Check if this table or session has active orders to show notification indicator
  useEffect(() => {
    async function checkTableOrders() {
      const tableToCheck =
        rawTableNumber ||
        (typeof window !== "undefined" ? localStorage.getItem("kyles_current_table") || "" : "");

      if (tableToCheck) {
        const res = await getOrdersByTableAction(tableToCheck);
        if (res.success && res.data && res.data.length > 0) {
          const active = res.data.some((o) =>
            ["pending", "preparing", "ready"].includes(o.status)
          );
          if (active) setHasActiveOrder(true);
          setLastPlacedOrder(res.data[0]);
          return;
        }
      }

      if (typeof window !== "undefined") {
        const storedId = localStorage.getItem("kyles_last_order_id");
        if (storedId) {
          setHasActiveOrder(true);
        }
      }
    }
    checkTableOrders();
  }, [rawTableNumber]);

  const kylesCatId = categories.find((c) => c.slug === "kyles-eatery")?.id || "cat-kyles";
  const batchoyCatId = categories.find((c) => c.slug === "batchoy-shop")?.id || "cat-batchoy";

  const filteredItems = menuItems.filter((i) =>
    effectiveBrand === "kyles-eatery"
      ? i.category_id === kylesCatId || i.category_id === "cat-kyles"
      : i.category_id === batchoyCatId || i.category_id === "cat-batchoy"
  );

  const handlePlaceOrder = () => {
    if (!isOrderingEnabled || cartItems.length === 0) return;
    setErrorMessage(null);
    startTransition(async () => {
      const payload = {
        table_id: selectedTableId || undefined,
        customer_name: rawTableNumber ? "Table " + rawTableNumber + " Guest" : "Kiosk Guest",
        customer_notes: rawTableNumber ? "Table " + rawTableNumber : "",
        items: cartItems.map((c) => ({
          menu_item_id: c.menuItem.id,
          quantity: c.quantity,
          special_instructions: c.specialInstructions,
        })),
      };
      const result = await createOrderAction(payload);
      if (result.success && result.data) {
        const placedOrder = result.data;
        setLastPlacedOrder(placedOrder);
        setHasActiveOrder(true);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("kyles_last_order_id", placedOrder.id);
            if (rawTableNumber) {
              localStorage.setItem(`kyles_table_${rawTableNumber}_last_order`, placedOrder.id);
            }
          } catch {}
        }
        clearCart();
        setCartOpen(false);
        // Redirect customer to their personal order status page
        router.push(
          `/status?order=${placedOrder.id}&brand=${effectiveBrand}${rawTableNumber ? `&table=${encodeURIComponent(rawTableNumber)}` : ""}`
        );
      } else {
        setErrorMessage(result.error || "Failed to place order.");
      }
    });
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-300", theme.bg)}>
      {/* Minimalist Sticky Header */}
      <header className={cn("sticky top-0 z-50 backdrop-blur-md border-b", theme.headerBg)}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between relative">
          {/* Left spacer – mirrors the right side width to keep title perfectly centred */}
          <div className="w-20" />

          <h1 className={cn("absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight whitespace-nowrap", theme.text)}>
            {theme.brandName}
          </h1>

          {/* Right side: table badge + icon-only orders button */}
          <div className="w-20 flex items-center justify-end gap-1.5">
            {rawTableNumber ? (
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", theme.tableBadge)}>
                Table {rawTableNumber}
              </span>
            ) : null}

            {/* Icon-only Check Orders button — links to /status passing table ID */}
            <Link
              href={
                rawTableNumber
                  ? `/status?table=${encodeURIComponent(rawTableNumber)}`
                  : lastPlacedOrder
                  ? `/status?order=${lastPlacedOrder.id}`
                  : `/status`
              }
              onClick={(e) => {
                if (!rawTableNumber && typeof window !== "undefined") {
                  const storedTable = localStorage.getItem("kyles_current_table");
                  if (storedTable) {
                    e.preventDefault();
                    router.push(`/status?table=${encodeURIComponent(storedTable)}&brand=${effectiveBrand}`);
                    return;
                  }
                  const storedOrder = localStorage.getItem("kyles_last_order_id");
                  if (storedOrder) {
                    e.preventDefault();
                    router.push(`/status?order=${encodeURIComponent(storedOrder)}&brand=${effectiveBrand}`);
                    return;
                  }
                }
              }}
              aria-label="Check Orders"
              className={cn(
                "relative p-2 rounded-full transition-colors",
                effectiveBrand === "kyles-eatery"
                  ? "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <ReceiptText size={20} strokeWidth={1.8} />
              {/* Notification dot – shown when there's an active or previously placed order */}
              {(hasActiveOrder || lastPlacedOrder) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Read-Only Mode Banner */}
      {!isOrderingEnabled && (
        <div className={cn("px-4 py-2.5 text-center border-b", theme.readOnly)}>
          <p className="text-xs font-medium">
            Read-only mode &mdash; scan the QR code on your table to order
          </p>
        </div>
      )}

      {/* Menu Subtitle */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
        <p className={cn("text-[11px] font-bold uppercase tracking-widest", theme.subtext)}>
          Daily Menu
        </p>
        <p className={cn("text-xs mt-0.5", theme.subtext)}>
          {theme.brandTagline}
        </p>
      </div>

      {/* Menu Grid */}
      <div className="max-w-3xl mx-auto px-4 pb-36">
        <AnimatePresence mode="wait">
          <motion.div key={effectiveBrand + "-grid"}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const cartEntry = cartItems.find((c) => c.menuItem.id === item.id);
              return (
                <MenuCard key={item.id} item={item} theme={theme}
                  inCart={!!cartEntry} qty={cartEntry?.quantity || 0}
                  isOrderingEnabled={isOrderingEnabled}
                  onAdd={() => addItem(item)}
                  onInc={() => updateQuantity(item.id, 1)}
                  onDec={() => updateQuantity(item.id, -1)}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Cart Bubble (FAB) */}
      <AnimatePresence>
        {isOrderingEnabled && totalCount() > 0 && !isCartOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCartOpen(true)}
            aria-label="View Cart"
            className={cn(
              "fixed bottom-6 right-6 w-16 h-16 z-50 rounded-full shadow-xl shadow-black/20 flex items-center justify-center transition-colors",
              effectiveBrand === "kyles-eatery"
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            )}
          >
            <ShoppingCart size={26} strokeWidth={2.2} />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-zinc-900 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm font-mono">
              {totalCount()}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && isOrderingEnabled && (
          <CartDrawer
            theme={theme} rawTableNumber={rawTableNumber}
            onSubmit={handlePlaceOrder} isPending={isPending}
            errorMessage={errorMessage} onClose={() => setCartOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {orderSuccess && (
          <SuccessModal order={orderSuccess} theme={theme} brand={effectiveBrand} rawTableNumber={rawTableNumber} onClose={() => setOrderSuccess(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
