"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Store, UtensilsCrossed, LayoutDashboard, ShoppingBag, Monitor } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
type Brand = "kyles-eatery" | "batchoy-shop";
type TablePreset = { label: string; value: string | null };

const TABLE_PRESETS: TablePreset[] = [
  { label: "Table 1",    value: "1"    },
  { label: "Table 5",    value: "5"    },
  { label: "Table 12",   value: "12"   },
  { label: "Read-Only",  value: null   },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function cn(...cls: (string | false | null | undefined)[]): string {
  return cls.filter(Boolean).join(" ");
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 px-0.5">
      {children}
    </p>
  );
}

// ─── Widget ──────────────────────────────────────────────────────────────────
export default function DemoControlWidget() {
  const [open, setOpen] = useState(false);
  const [activeBrand, setActiveBrand] = useState<Brand>("kyles-eatery");
  const [activeTable, setActiveTable] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  /** Navigate to `/` with the selected brand + table params */
  function applyParams(brand: Brand, table: string | null) {
    const params = new URLSearchParams();
    params.set("brand", brand);
    if (table) params.set("table", table);
    router.push(`/?${params.toString()}`);
  }

  function handleBrand(brand: Brand) {
    setActiveBrand(brand);
    applyParams(brand, activeTable);
  }

  function handleTable(table: string | null) {
    setActiveTable(table);
    applyParams(activeBrand, table);
  }

  const isMenu = pathname === "/";
  const isPos  = pathname === "/pos";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Open demo controls"
        className={cn(
          "fixed bottom-5 left-5 z-[100] w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 transition-colors",
          open
            ? "bg-zinc-900 text-white"
            : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close"
              initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }}
            >
              <X size={16} />
            </motion.span>
          ) : (
            <motion.span key="open"
              initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.15 }}
            >
              <Settings size={16} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[4.5rem] left-5 z-[100] w-60 rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-black/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-3.5 pb-3 border-b border-zinc-100">
              <Monitor size={13} className="text-zinc-400 shrink-0" />
              <p className="text-xs font-bold text-zinc-800 tracking-tight">Demo Controls</p>
              <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">
                Dev
              </span>
            </div>

            <div className="px-3.5 py-3 space-y-4">

              {/* ── Brand Switcher ─────────────────────────────── */}
              <div>
                <SectionLabel>Brand</SectionLabel>
                <div className="flex rounded-xl overflow-hidden border border-zinc-200 text-xs font-semibold">
                  <button
                    onClick={() => handleBrand("kyles-eatery")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 transition",
                      activeBrand === "kyles-eatery"
                        ? "bg-orange-500 text-white"
                        : "bg-white text-zinc-500 hover:bg-zinc-50"
                    )}
                  >
                    <Store size={11} />Kyle&apos;s
                  </button>
                  <div className="w-px bg-zinc-200" />
                  <button
                    onClick={() => handleBrand("batchoy-shop")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 transition",
                      activeBrand === "batchoy-shop"
                        ? "bg-red-600 text-white"
                        : "bg-white text-zinc-500 hover:bg-zinc-50"
                    )}
                  >
                    <UtensilsCrossed size={11} />Batchoy
                  </button>
                </div>
              </div>

              {/* ── Table Simulator ────────────────────────────── */}
              <div>
                <SectionLabel>Table Simulator</SectionLabel>
                <div className="grid grid-cols-2 gap-1.5">
                  {TABLE_PRESETS.map(({ label, value }) => {
                    const active = activeTable === value;
                    return (
                      <motion.button
                        key={label}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTable(value)}
                        className={cn(
                          "rounded-xl py-2 text-xs font-semibold transition border",
                          active
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : value === null
                              ? "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300"
                              : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300"
                        )}
                      >
                        {label}
                      </motion.button>
                    );
                  })}
                </div>
                {activeTable && (
                  <p className="mt-1.5 text-[10px] text-zinc-400 text-center">
                    URL: <span className="font-mono text-zinc-600">?table={activeTable}</span>
                  </p>
                )}
              </div>

              {/* ── Quick Nav ──────────────────────────────────── */}
              <div>
                <SectionLabel>Quick Nav</SectionLabel>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => applyParams(activeBrand, activeTable)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold border transition",
                      isMenu
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <ShoppingBag size={11} />Menu
                  </button>
                  <button
                    onClick={() => router.push("/pos")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold border transition",
                      isPos
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <LayoutDashboard size={11} />Cashier
                  </button>
                  <button
                    onClick={() => router.push("/admin")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold border transition",
                      isAdmin
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <Settings size={11} />Admin
                  </button>
                </div>
              </div>

            </div>

            {/* Footer note */}
            <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50">
              <p className="text-[9px] text-zinc-400 text-center font-medium">
                Hidden in production — for demo only
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
