"use client";

import { Suspense, useEffect, useTransition, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Minus, X, ShoppingCart, Loader2, ReceiptText
} from "lucide-react";
import { MenuItem } from "@/types/database";
import { getMenuItemsAction } from "@/app/actions/menu";
import { getTablesAction } from "@/app/actions/tables";
import { createOrderAction, getOrdersByTableAction } from "@/app/actions/orders";
import { useCartStore, Brand } from "@/lib/store/cart";

function cn(...inputs: (string | undefined | null | false | 0 | Record<string, boolean>)[]): string {
  return twMerge(clsx(...inputs));
}

// ─── Dual-Brand Menu Items ──────────────────────────────────────────────────
const ORIGINAL_MENU: MenuItem[] = [
  // Kyle's Eatery Items (Mon-Sat)
  { id: "chori-sandwich", category_id: "cat-kyles", name: "Chori Sandwich", description: "Grilled savory chorizo patty in soft toasted bun with special sauce", price: 199, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, brand_schedule: "kyles-eatery", created_at: "", updated_at: "" },
  { id: "backribs", category_id: "cat-kyles", name: "Backribs", description: "Tender slow-cooked pork backribs in savory barbecue glaze served with rice", price: 160, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, brand_schedule: "kyles-eatery", created_at: "", updated_at: "" },
  { id: "hungarian", category_id: "cat-kyles", name: "Hungarian", description: "Juicy grilled Hungarian sausage served with garlic rice and egg", price: 120, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 1, brand_schedule: "kyles-eatery", created_at: "", updated_at: "" },
  { id: "sisig", category_id: "cat-kyles", name: "Sisig", description: "Sizzling crispy seasoned pork sisig topped with chili and calamansi", price: 160, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 1, brand_schedule: "kyles-eatery", created_at: "", updated_at: "" },
  { id: "palabok", category_id: "cat-kyles", name: "Palabok", description: "Traditional rice noodles with rich savory sauce, chicharon, and egg toppings", price: 50, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, brand_schedule: "kyles-eatery", created_at: "", updated_at: "" },
  { id: "tocino", category_id: "cat-kyles", name: "Tocino", description: "Sweet cured caramelized pork tocino served with garlic rice", price: 85, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, brand_schedule: "kyles-eatery", created_at: "", updated_at: "" },
  { id: "chicken-ala-king", category_id: "cat-kyles", name: "Chicken Ala King", description: "Creamy chicken ala king with bell peppers and mushrooms over rice", price: 99, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, brand_schedule: "kyles-eatery", created_at: "", updated_at: "" },
  { id: "fried-inasal", category_id: "cat-kyles", name: "Fried Inasal", description: "Crispy fried chicken inasal marinated in calamansi and lemongrass", price: 85, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, brand_schedule: "kyles-eatery", created_at: "", updated_at: "" },

  // Batchoy Shop Items (Sunday)
  { id: "batchoy-special", category_id: "cat-batchoy", name: "Batchoy Special", description: "Authentic Iloilo noodle soup with pork cracklings, liver, egg, bone marrow broth", price: 150, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, brand_schedule: "batchoy-shop", created_at: "", updated_at: "" },
  { id: "caesar-salad", category_id: "cat-batchoy", name: "Caesar Salad", description: "Fresh crisp romaine lettuce, parmesan shavings, croutons, classic dressing", price: 199, image_url: null, is_available: true, is_vegetarian: true, spiciness_level: 0, brand_schedule: "batchoy-shop", created_at: "", updated_at: "" },
  { id: "chicken-tempura", category_id: "cat-batchoy", name: "Chicken Tempura", description: "Crispy golden Japanese-style battered chicken strips with dip", price: 120, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, brand_schedule: "batchoy-shop", created_at: "", updated_at: "" },
  { id: "chorizo-sandwich", category_id: "cat-batchoy", name: "Chorizo Sandwich", description: "Grilled savory garlic chorizo patty in soft toasted bun", price: 95, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, brand_schedule: "batchoy-shop", created_at: "", updated_at: "" },
  { id: "egg-fried-rice", category_id: "cat-batchoy", name: "Egg Fried Rice", description: "Fragrant wok-fried rice with fluffy eggs and green onions", price: 45, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, brand_schedule: "batchoy-shop", created_at: "", updated_at: "" },
  { id: "ordinary-batchoy", category_id: "cat-batchoy", name: "Ordinary Batchoy", description: "Classic comforting Iloilo miki noodle soup with savory broth and chicharon", price: 100, image_url: null, is_available: true, is_vegetarian: false, spiciness_level: 0, brand_schedule: "batchoy-shop", created_at: "", updated_at: "" },
];

const BASE_PATTERN_NAMES = ["sakura", "seigaiha", "asanoha", "kasuri", "shippo"];

const PLACEHOLDER_IMAGES = [
  "/images/sushi/salmon_avocado_roll.png",
  "/images/sushi/california_roll.png",
  "/images/sushi/dragon_roll.png",
  "/images/sushi/rainbow_roll.png",
  "/images/sushi/salmon_roll.png",
];

const BATCHOY_ITEM_ORDER = [
  "batchoy special",
  "caesar salad",
  "chicken tempura",
  "chorizo sandwich",
  "egg fried rice",
  "ordinary batchoy",
];

const KYLES_ITEM_ORDER = [
  "chori sandwich",
  "backribs",
  "hungarian",
  "sisig",
  "palabok",
  "tocino",
  "chicken ala king",
  "fried inasal",
];

// ─── Dual-Brand Theme Configurations ────────────────────────────────────────
const THEMES = {
  "batchoy-shop": {
    brandName: "Batchoy Shop",
    title: "BATCHOY SHOP",
    bgPattern: "",
    bgColor: "#09090b",
    accent: "#ef4444",
    accentHover: "#dc2626",
    accentBg: "bg-red-600",
    accentHoverBg: "hover:bg-red-700",
    accentText: "text-red-500",
    accentBorder: "border-red-500",
    accentShadow: "shadow-red-500/30",
    patternSuffix: "-red",
  },
  "kyles-eatery": {
    brandName: "Kyle's Eatery",
    title: "KYLE'S EATERY",
    bgPattern: "",
    bgColor: "#ffffff",
    accent: "#ea580c",
    accentHover: "#c2410c",
    accentBg: "bg-[#ea580c]",
    accentHoverBg: "hover:bg-[#c2410c]",
    accentText: "text-[#ea580c]",
    accentBorder: "border-[#ea580c]",
    accentShadow: "shadow-[#ea580c]/30",
    patternSuffix: "-orange",
  },
} as const;

// ─── SVG Medallion Pattern Definitions (Red & Orange/White) ─────────────────
function JapanesePatternDefs() {
  return (
    <svg width="0" height="0" className="absolute">
      <defs>
        {/* ─── RED PATTERNS (Batchoy Shop: #6b0f16 base with #8d2d2b subtle pattern) ─ */}
        <pattern id="pat-sakura-red" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="#6b0f16" />
          <circle cx="16" cy="16" r="2.2" fill="#8d2d2b" />
          <circle cx="16" cy="9.5" r="3.4" fill="#8d2d2b" />
          <circle cx="22" cy="13.5" r="3.4" fill="#8d2d2b" />
          <circle cx="20" cy="21" r="3.4" fill="#8d2d2b" />
          <circle cx="12" cy="21" r="3.4" fill="#8d2d2b" />
          <circle cx="10" cy="13.5" r="3.4" fill="#8d2d2b" />
          <circle cx="0" cy="0" r="2" fill="#8d2d2b" />
          <circle cx="32" cy="0" r="2" fill="#8d2d2b" />
          <circle cx="0" cy="32" r="2" fill="#8d2d2b" />
          <circle cx="32" cy="32" r="2" fill="#8d2d2b" />
        </pattern>

        <pattern id="pat-seigaiha-red" width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="40" height="20" fill="#6b0f16" />
          <circle cx="0" cy="0" r="18" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="0" cy="0" r="14" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="0" cy="0" r="10" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="0" cy="0" r="6" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="0" cy="0" r="2" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />

          <circle cx="40" cy="0" r="18" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="40" cy="0" r="14" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="40" cy="0" r="10" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="40" cy="0" r="6" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="40" cy="0" r="2" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />

          <circle cx="0" cy="20" r="18" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="0" cy="20" r="14" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="0" cy="20" r="10" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="0" cy="20" r="6" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="0" cy="20" r="2" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />

          <circle cx="40" cy="20" r="18" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="40" cy="20" r="14" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="40" cy="20" r="10" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="40" cy="20" r="6" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="40" cy="20" r="2" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />

          <circle cx="20" cy="10" r="18" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="20" cy="10" r="14" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="20" cy="10" r="10" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="20" cy="10" r="6" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="20" cy="10" r="2" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />

          <circle cx="-20" cy="10" r="18" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="-20" cy="10" r="14" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="60" cy="10" r="18" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
          <circle cx="60" cy="10" r="14" fill="none" stroke="#8d2d2b" strokeWidth="1.8" />
        </pattern>

        <pattern id="pat-asanoha-red" width="22" height="38.1" patternUnits="userSpaceOnUse">
          <rect width="22" height="38.1" fill="#6b0f16" />
          <path
            d="M 11,0 L 22,19.05 L 11,38.1 L 0,19.05 Z M 0,0 L 11,19.05 L 0,38.1 M 22,0 L 11,19.05 L 22,38.1 M 0,19.05 L 22,19.05 M 11,0 L 11,38.1"
            stroke="#8d2d2b"
            strokeWidth="1"
            fill="none"
          />
        </pattern>

        <pattern id="pat-kasuri-red" width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#6b0f16" />
          <line x1="13" y1="0" x2="13" y2="26" stroke="#8d2d2b" strokeDasharray="3,3" strokeWidth="1" />
          <circle cx="13" cy="13" r="3.6" fill="#8d2d2b" />
          <circle cx="0" cy="0" r="2.2" fill="#8d2d2b" />
          <circle cx="26" cy="26" r="2.2" fill="#8d2d2b" />
        </pattern>

        <pattern id="pat-shippo-red" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#6b0f16" />
          <circle cx="0" cy="0" r="14" stroke="#8d2d2b" strokeWidth="1.1" fill="none" />
          <circle cx="28" cy="0" r="14" stroke="#8d2d2b" strokeWidth="1.1" fill="none" />
          <circle cx="0" cy="28" r="14" stroke="#8d2d2b" strokeWidth="1.1" fill="none" />
          <circle cx="28" cy="28" r="14" stroke="#8d2d2b" strokeWidth="1.1" fill="none" />
          <circle cx="14" cy="14" r="14" stroke="#8d2d2b" strokeWidth="1.1" fill="none" />
          <circle cx="14" cy="14" r="1.9" fill="#8d2d2b" />
        </pattern>

        {/* ─── ORANGE & WHITE PATTERNS (Kyle's Eatery: #ea580c base with light transparent white pattern) ─── */}
        <pattern id="pat-sakura-orange" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="#ea580c" />
          <circle cx="16" cy="16" r="2.2" fill="#ffffff" opacity="0.32" />
          <circle cx="16" cy="9.5" r="3.4" fill="#ffffff" opacity="0.3" />
          <circle cx="22" cy="13.5" r="3.4" fill="#ffffff" opacity="0.3" />
          <circle cx="20" cy="21" r="3.4" fill="#ffffff" opacity="0.3" />
          <circle cx="12" cy="21" r="3.4" fill="#ffffff" opacity="0.3" />
          <circle cx="10" cy="13.5" r="3.4" fill="#ffffff" opacity="0.3" />
          <circle cx="0" cy="0" r="2" fill="#ffffff" opacity="0.25" />
          <circle cx="32" cy="0" r="2" fill="#ffffff" opacity="0.25" />
          <circle cx="0" cy="32" r="2" fill="#ffffff" opacity="0.25" />
          <circle cx="32" cy="32" r="2" fill="#ffffff" opacity="0.25" />
        </pattern>

        <pattern id="pat-seigaiha-orange" width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="40" height="20" fill="#ea580c" />
          <circle cx="0" cy="0" r="18" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="0" cy="0" r="14" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="0" cy="0" r="10" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="0" cy="0" r="6" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="0" cy="0" r="2" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />

          <circle cx="40" cy="0" r="18" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="40" cy="0" r="14" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="40" cy="0" r="10" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="40" cy="0" r="6" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="40" cy="0" r="2" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />

          <circle cx="0" cy="20" r="18" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="0" cy="20" r="14" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="0" cy="20" r="10" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="0" cy="20" r="6" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="0" cy="20" r="2" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />

          <circle cx="40" cy="20" r="18" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="40" cy="20" r="14" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="40" cy="20" r="10" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="40" cy="20" r="6" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="40" cy="20" r="2" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />

          <circle cx="20" cy="10" r="18" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="20" cy="10" r="14" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="20" cy="10" r="10" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="20" cy="10" r="6" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="20" cy="10" r="2" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />

          <circle cx="-20" cy="10" r="18" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="-20" cy="10" r="14" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="60" cy="10" r="18" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
          <circle cx="60" cy="10" r="14" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.3" />
        </pattern>

        <pattern id="pat-asanoha-orange" width="22" height="38.1" patternUnits="userSpaceOnUse">
          <rect width="22" height="38.1" fill="#ea580c" />
          <path
            d="M 11,0 L 22,19.05 L 11,38.1 L 0,19.05 Z M 0,0 L 11,19.05 L 0,38.1 M 22,0 L 11,19.05 L 22,38.1 M 0,19.05 L 22,19.05 M 11,0 L 11,38.1"
            stroke="#ffffff"
            strokeWidth="1"
            fill="none"
            opacity="0.3"
          />
        </pattern>

        <pattern id="pat-kasuri-orange" width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#ea580c" />
          <line x1="13" y1="0" x2="13" y2="26" stroke="#ffffff" strokeDasharray="3,3" strokeWidth="1" opacity="0.3" />
          <circle cx="13" cy="13" r="3.8" fill="#ffffff" opacity="0.3" />
          <circle cx="0" cy="0" r="2.4" fill="#ffffff" opacity="0.25" />
          <circle cx="26" cy="26" r="2.4" fill="#ffffff" opacity="0.25" />
        </pattern>

        <pattern id="pat-shippo-orange" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#ea580c" />
          <circle cx="0" cy="0" r="14" stroke="#ffffff" strokeWidth="1.1" fill="none" opacity="0.3" />
          <circle cx="28" cy="0" r="14" stroke="#ffffff" strokeWidth="1.1" fill="none" opacity="0.3" />
          <circle cx="0" cy="28" r="14" stroke="#ffffff" strokeWidth="1.1" fill="none" opacity="0.3" />
          <circle cx="28" cy="28" r="14" stroke="#ffffff" strokeWidth="1.1" fill="none" opacity="0.3" />
          <circle cx="14" cy="14" r="14" stroke="#ffffff" strokeWidth="1.1" fill="none" opacity="0.3" />
          <circle cx="14" cy="14" r="2" fill="#ffffff" opacity="0.32" />
        </pattern>
      </defs>
    </svg>
  );
}

function formatPrice(val: number | string): string {
  const num = Number(val);
  return `₱${num.toFixed(0)}`;
}

// ─── Exact Circular Plus & Minus Buttons Matching Reference Crop ─────────────
function MockupPlusButton({
  onClick,
  color,
  ariaLabel,
  className = "",
  size = 36,
}: {
  onClick: (e: React.MouseEvent) => void;
  color: string;
  ariaLabel?: string;
  className?: string;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "relative rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 hover:scale-105 shrink-0 select-none shadow-xs",
        className
      )}
      style={{ width: size, height: size, color }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Exact outer ring with 2.5px stroke matching crop */}
        <circle
          cx="18"
          cy="18"
          r="16.5"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        {/* Exact plus cross with 3.0px bold stroke and rounded tips */}
        <line
          x1="18"
          y1="9.5"
          x2="18"
          y2="26.5"
          stroke="currentColor"
          strokeWidth="3.0"
          strokeLinecap="round"
        />
        <line
          x1="9.5"
          y1="18"
          x2="26.5"
          y2="18"
          stroke="currentColor"
          strokeWidth="3.0"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

function MockupMinusButton({
  onClick,
  color,
  ariaLabel,
  className = "",
  size = 36,
}: {
  onClick: (e: React.MouseEvent) => void;
  color: string;
  ariaLabel?: string;
  className?: string;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "relative rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 hover:scale-105 shrink-0 select-none shadow-xs",
        className
      )}
      style={{ width: size, height: size, color }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <circle
          cx="18"
          cy="18"
          r="16.5"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <line
          x1="9.5"
          y1="18"
          x2="26.5"
          y2="18"
          stroke="currentColor"
          strokeWidth="3.0"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

// ─── Modern Food Card with In-Card Quantity Stepper ──────────────────────────
function ModernFoodCardItem({
  item,
  imageUrl,
  isDark = false,
  qtyInCart,
  onIncrement,
  onDecrement,
  onClick,
}: {
  item: MenuItem;
  imageUrl: string;
  isDark?: boolean;
  qtyInCart: number;
  onIncrement: (e: React.MouseEvent) => void;
  onDecrement: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md"
    >
      {/* Top Image Area: Rounded rectangular banner */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center p-3">
        <Image
          src={imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2 transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>

      {/* Card Body & Footer */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-2.5">
        <div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1 leading-snug">
            {item.name}
          </h3>
          <p className="font-semibold text-sm text-orange-600 dark:text-red-500 mt-0.5">
            {formatPrice(item.price)}
          </p>
        </div>

        {/* Footer: Stepper or Plus Button */}
        <div className="flex items-center justify-end pt-1" onClick={(e) => e.stopPropagation()}>
          {qtyInCart === 0 ? (
            <button
              onClick={onIncrement}
              aria-label={`Add ${item.name} to cart`}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white transition-colors shrink-0 active:scale-90"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full shrink-0">
              <button
                onClick={onDecrement}
                aria-label={`Decrease quantity of ${item.name}`}
                className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-90 transition-transform"
              >
                <Minus className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" />
              </button>
              <span className="text-xs font-bold text-zinc-900 dark:text-white px-1 font-mono">
                {qtyInCart}
              </span>
              <button
                onClick={onIncrement}
                aria-label={`Increase quantity of ${item.name}`}
                className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-90 transition-transform"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Item Detail / Add-to-Cart Modal (Exact bottom mockups) ───────────────────
function ItemDetailModal({
  item,
  imageUrl,
  patternId,
  theme,
  initialQty = 1,
  onClose,
  onAddToCart,
}: {
  item: MenuItem;
  imageUrl: string;
  patternId: string;
  theme: typeof THEMES[Brand];
  initialQty?: number;
  onClose: () => void;
  onAddToCart: (item: MenuItem, qty: number, instructions: string) => void;
}) {
  const [qty, setQty] = useState(initialQty > 0 ? initialQty : 1);
  const [instructions, setInstructions] = useState("");

  const handleDec = () => {
    if (qty > 1) setQty(qty - 1);
  };

  const handleInc = () => {
    setQty(qty + 1);
  };

  const handleSubmit = () => {
    onAddToCart(item, qty, instructions.trim());
    onClose();
  };

  const totalPrice = Number(item.price) * qty;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl relative flex flex-col border border-zinc-200 dark:border-zinc-800 max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Japanese Arch Graphic with Dish Image */}
        <div className="relative pt-6 pb-2 px-6 flex flex-col items-center justify-center w-full">
          {/* Circular/Arch patterned backdrop */}
          <div className="relative w-44 h-44 rounded-full overflow-hidden shadow-lg border-2 border-stone-200/50 dark:border-zinc-800 flex items-center justify-center">
            <svg width="176" height="176" viewBox="0 0 176 176" className="w-full h-full">
              <circle cx="88" cy="88" r="88" fill={`url(#${patternId})`} />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
          </div>

          {/* Food image floating directly above arch */}
          <div
            className="absolute top-8 w-36 h-36 flex items-center justify-center pointer-events-none"
            style={{ filter: "drop-shadow(4px 8px 16px rgba(0, 0, 0, 0.32))" }}
          >
            <Image
              src={imageUrl}
              alt={item.name}
              width={160}
              height={160}
              className="w-36 h-36 object-contain"
              priority
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="w-full px-6 pt-3 pb-8 flex flex-col items-center text-center space-y-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {item.name}
            </h3>
            <p className="text-sm font-bold mt-0.5" style={{ color: theme.accent }}>
              {formatPrice(item.price)}
            </p>
            {item.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-[280px] leading-relaxed line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          {/* Quantity Controls: Single unified pill */}
          <div className="flex items-center justify-center gap-4 bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2 rounded-full w-fit mx-auto">
            <button
              onClick={handleDec}
              aria-label="Decrease quantity"
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors active:scale-90"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-base px-2 text-zinc-900 dark:text-white font-mono min-w-[1.5rem] text-center">
              {qty}
            </span>
            <button
              onClick={handleInc}
              aria-label="Increase quantity"
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors active:scale-90"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Special Instructions */}
          <div className="w-full">
            <input 
              type="text" 
              placeholder="Add special instructions..." 
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full text-xs px-3.5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
            />
          </div>

          {/* Large Pill Add to Cart Button (Themed, dynamic total) */}
          <button
            onClick={handleSubmit}
            className="w-full py-3.5 px-6 rounded-full text-white font-semibold text-sm tracking-wide shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            style={{ backgroundColor: theme.accent }}
          >
            <ShoppingCart className="w-4 h-4 opacity-90" />
            <span>Add to Cart</span>
            <span className="opacity-80 font-mono text-xs ml-0.5">
              • {formatPrice(totalPrice)}
            </span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Cart Drawer ─────────────────────────────────────────────────────────────
function CartDrawer({
  tableNumber,
  theme,
  currentBrand,
  onSubmit,
  isPending,
  errorMessage,
  onClose,
}: {
  tableNumber: string;
  theme: typeof THEMES[Brand];
  currentBrand: Brand;
  onSubmit: (orderType: "dine_in" | "take_out", packagingFee: number, totalAmount: number) => void;
  isPending: boolean;
  errorMessage: string | null;
  onClose: () => void;
}) {
  const { items, updateQuantity, updateInstructions, totalCount, subtotal } = useCartStore();
  const [orderType, setOrderType] = useState<"dine_in" | "take_out">("dine_in");

  const isDark = currentBrand === "batchoy-shop";
  const totalTubs = items.reduce((sum, item) => sum + item.quantity, 0);
  const packagingFee = orderType === "take_out" ? totalTubs * 10 : 0;
  const currentSubtotal = subtotal();
  const totalAmount = currentSubtotal + packagingFee;

  const drawerBg = isDark ? "bg-zinc-950 text-white" : "bg-white text-zinc-900";
  const borderColor = isDark ? "border-zinc-800" : "border-zinc-200";
  const itemBg = isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-100";
  const inputBg = isDark
    ? "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
    : "bg-white border-zinc-200 text-zinc-800 placeholder:text-zinc-400";
  const emptyTextColor = isDark ? "text-zinc-500" : "text-zinc-400";
  const footerBg = isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-100";
  const subtotalLabel = isDark ? "text-zinc-400" : "text-zinc-500";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className={cn(
          "w-full sm:max-w-md flex flex-col rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl max-h-[90dvh] border",
          drawerBg,
          borderColor
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className={cn("w-10 h-1 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0", isDark ? "bg-zinc-700" : "bg-zinc-200")} />

        {/* Header */}
        <div className={cn("shrink-0 flex items-center justify-between px-6 pt-4 pb-4 border-b", borderColor)}>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <ShoppingCart size={18} style={{ color: theme.accent }} />
              Your Order
              {tableNumber && (
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${theme.accent}18`,
                    color: theme.accent,
                    borderColor: `${theme.accent}30`,
                  }}
                >
                  Table {tableNumber}
                </span>
              )}
            </h2>
            <p className={cn("text-xs mt-0.5", subtotalLabel)}>
              {totalCount()} item{totalCount() !== 1 ? "s" : ""} · {formatPrice(subtotal())}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition",
              isDark
                ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
            )}
          >
            <X size={15} />
          </button>
        </div>

        {/* Dine-In / Take-Out toggle */}
        <div className={cn("shrink-0 px-6 pt-4 pb-2")}>
          <div className={cn("flex rounded-xl p-1 gap-1", isDark ? "bg-zinc-900" : "bg-zinc-100")}>
            {(["dine_in", "take_out"] as const).map((type) => {
              const isActive = orderType === type;
              const label = type === "dine_in" ? "Dine In" : "Take Out";
              return (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                    isActive
                      ? "text-white shadow-sm"
                      : isDark
                      ? "text-zinc-400 hover:text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-700"
                  )}
                  style={isActive ? { backgroundColor: theme.accent } : {}}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
          <AnimatePresence initial={false}>
            {items.map((c) => (
              <motion.div
                key={c.menuItem.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("rounded-2xl p-3.5 border space-y-2.5", itemBg)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {c.menuItem.name}
                    </p>
                    <p className="text-xs font-mono font-medium mt-0.5" style={{ color: theme.accent }}>
                      {formatPrice(Number(c.menuItem.price))} ea
                    </p>
                    {c.specialInstructions && (
                      <p className={cn("text-[11px] italic mt-1", subtotalLabel)}>
                        {c.specialInstructions}
                      </p>
                    )}
                  </div>

                  {/* Inline stepper — minus at qty 1 removes the item */}
                  <div className={cn(
                    "flex items-center gap-2 shrink-0 rounded-full px-2 py-1",
                    isDark ? "bg-zinc-800" : "bg-zinc-200/70"
                  )}>
                    <button
                      onClick={() => updateQuantity(c.menuItem.id, -1)}
                      aria-label="Decrease quantity"
                      className="p-0.5 rounded-full transition active:scale-90"
                      style={{ color: theme.accent }}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className="w-5 text-center text-sm font-bold font-mono"
                      style={{ color: theme.accent }}
                    >
                      {c.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(c.menuItem.id, 1)}
                      aria-label="Increase quantity"
                      className="p-0.5 rounded-full transition active:scale-90"
                      style={{ color: theme.accent }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notes input */}
                <input
                  type="text"
                  placeholder="Special instructions..."
                  value={c.specialInstructions}
                  onChange={(e) => updateInstructions(c.menuItem.id, e.target.value)}
                  className={cn(
                    "w-full text-xs rounded-lg px-3 py-2 outline-none border transition",
                    inputBg
                  )}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className={cn("py-16 text-center text-sm", emptyTextColor)}>
              Your cart is empty.<br />Select items from the menu to get started.
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        {items.length > 0 && (
          <div className={cn("shrink-0 px-6 pt-4 pb-8 border-t", footerBg, borderColor)}>
            {errorMessage && (
              <p className="mb-3 text-xs text-red-500 bg-red-500/10 rounded-xl px-3 py-2 border border-red-500/20">
                {errorMessage}
              </p>
            )}

            {/* Summary */}
            <div className={cn("space-y-1.5 mb-4")}>
              <div className="flex justify-between items-baseline">
                <span className={cn("text-sm font-medium", subtotalLabel)}>Subtotal</span>
                <span className="text-sm font-mono font-semibold">{formatPrice(currentSubtotal)}</span>
              </div>

              {orderType === "take_out" && (
                <div className="flex justify-between items-baseline text-amber-500">
                  <span className="text-xs font-semibold">
                    Packaging Fee (₱10/tub · {totalTubs} {totalTubs === 1 ? "tub" : "tubs"})
                  </span>
                  <span className="text-sm font-mono font-bold">+{formatPrice(packagingFee)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-1 border-t border-dashed border-zinc-700/50">
                <span className="text-sm font-bold">Total</span>
                <span
                  className="text-2xl font-black font-mono tracking-tight"
                  style={{ color: theme.accent }}
                >
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSubmit(orderType, packagingFee, totalAmount)}
              disabled={isPending}
              className="w-full py-3.5 rounded-full text-white font-bold text-sm tracking-wide shadow-lg transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.accent }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending to Kitchen...
                </>
              ) : (
                "Confirm & Send to Kitchen"
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Customer Order Page ────────────────────────────────────────────────
export default function CustomerOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#560c12] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-8 h-8 border-2 border-white/60 border-t-transparent rounded-full"
          />
        </div>
      }
    >
      <CustomerMenuContent />
    </Suspense>
  );
}

function CustomerMenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableParam = searchParams.get("table");
  const rawTableNumber = tableParam ? tableParam.replace(/^table\s*/i, "").trim() : "";

  const brandParam = searchParams.get("brand");
  const dayOfWeek = new Date().getDay();
  // Sunday = Batchoy Shop (Red); Mon-Sat = Kyle's Eatery (Orange & White)
  const systemBrand: Brand = dayOfWeek === 0 ? "batchoy-shop" : "kyles-eatery";
  const initialBrand: Brand =
    brandParam === "batchoy-shop" || brandParam === "kyles-eatery"
      ? brandParam
      : systemBrand;

  const [currentBrand, setCurrentBrand] = useState<Brand>(initialBrand);
  const theme = THEMES[currentBrand];
  const isDark = currentBrand === "batchoy-shop";

  // Sync brand with Settings stored in localStorage & listen for admin changes
  useEffect(() => {
    if (brandParam === "batchoy-shop" || brandParam === "kyles-eatery") {
      setCurrentBrand(brandParam);
      return;
    }
    if (typeof window !== "undefined") {
      const savedBrand = localStorage.getItem("kyles_active_brand");
      if (savedBrand === "batchoy-shop" || savedBrand === "kyles-eatery") {
        setCurrentBrand(savedBrand);
      } else {
        setCurrentBrand(systemBrand);
      }
    }
  }, [brandParam, systemBrand]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "kyles_active_brand") {
        if (brandParam === "batchoy-shop" || brandParam === "kyles-eatery") return;
        const newBrand = e.newValue;
        if (newBrand === "batchoy-shop" || newBrand === "kyles-eatery") {
          setCurrentBrand(newBrand);
        } else {
          setCurrentBrand(systemBrand);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [brandParam, systemBrand]);

  const {
    setActiveBrand, setTodayBrand,
    isCartOpen, setCartOpen, items: cartItems, addItem, updateQuantity, clearCart,
    totalCount, subtotal,
  } = useCartStore();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [menuItems, setMenuItems] = useState<MenuItem[]>(ORIGINAL_MENU);
  const [selectedTableId, setSelectedTableId] = useState<string>("");

  // Selected item for Add-to-Cart Modal
  const [modalItem, setModalItem] = useState<{ item: MenuItem; imageUrl: string; patternId: string } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasActiveOrders, setHasActiveOrders] = useState<boolean>(false);

  // Sync brand with Zustand store
  useEffect(() => {
    setActiveBrand(currentBrand);
    setTodayBrand(systemBrand);
  }, [currentBrand, systemBrand, setActiveBrand, setTodayBrand]);

  // Load backend items and table
  useEffect(() => {
    async function loadData() {
      const [itemRes, tableRes] = await Promise.all([
        getMenuItemsAction(),
        getTablesAction(),
      ]);

      if (itemRes.success && itemRes.data && itemRes.data.length > 0) {
        setMenuItems(itemRes.data);
      }

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
  }, [rawTableNumber, tableParam]);

  // Check active orders in table and localStorage
  useEffect(() => {
    async function checkActive() {
      if (rawTableNumber) {
        try {
          const res = await getOrdersByTableAction(rawTableNumber);
          if (res.success && res.data && res.data.length > 0) {
            const hasActive = res.data.some((o) =>
              ["pending", "preparing", "ready"].includes(o.status)
            );
            if (hasActive) {
              setHasActiveOrders(true);
              return;
            }
          }
        } catch {}
      }

      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("@kyle_pos_my_orders");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHasActiveOrders(true);
              return;
            }
          }
          const lastOrder = localStorage.getItem("kyles_last_order_id");
          if (lastOrder) {
            setHasActiveOrders(true);
          }
        } catch {}
      }
    }
    checkActive();
  }, [rawTableNumber]);

  // Filter items by brand
  const filteredItems = menuItems.filter((i) => {
    const nameLower = i.name.trim().toLowerCase();
    if (currentBrand === "batchoy-shop") {
      if (i.brand_schedule === "batchoy-shop") return true;
      if (i.category_id === "cat-batchoy" || i.category_id === "1f0a6358-1f78-49ea-b8ce-4c6dcbf84548") return true;
      return BATCHOY_ITEM_ORDER.includes(nameLower);
    } else {
      if (i.brand_schedule === "kyles-eatery") return true;
      if (i.category_id === "cat-kyles" || i.category_id === "41fb8b16-c957-4776-a310-adbc11a650a9") return true;
      return KYLES_ITEM_ORDER.includes(nameLower);
    }
  });

  // Sort items in the exact canonical order requested for each brand
  const sortedItems = [...filteredItems].sort((a, b) => {
    const nameA = a.name.trim().toLowerCase();
    const nameB = b.name.trim().toLowerCase();
    if (currentBrand === "batchoy-shop") {
      const idxA = BATCHOY_ITEM_ORDER.indexOf(nameA);
      const idxB = BATCHOY_ITEM_ORDER.indexOf(nameB);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    } else {
      const idxA = KYLES_ITEM_ORDER.indexOf(nameA);
      const idxB = KYLES_ITEM_ORDER.indexOf(nameB);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    }
  });

  const baseItems =
    sortedItems.length > 0
      ? sortedItems
      : ORIGINAL_MENU.filter((i) =>
          currentBrand === "batchoy-shop"
            ? i.brand_schedule === "batchoy-shop"
            : i.brand_schedule === "kyles-eatery"
        );

  const itemsToRender = baseItems.filter((item) => {
    if (selectedCategory === "All") return true;
    const name = item.name.toLowerCase();
    const desc = (item.description || "").toLowerCase();

    if (selectedCategory === "Drinks") {
      return (
        name.includes("drink") ||
        name.includes("beverage") ||
        name.includes("juice") ||
        name.includes("tea") ||
        name.includes("soda") ||
        name.includes("water") ||
        name.includes("coke") ||
        name.includes("sprite") ||
        name.includes("coffee")
      );
    }

    if (selectedCategory === "Sides & Rice") {
      return (
        name.includes("rice") ||
        name.includes("side") ||
        name.includes("salad") ||
        desc.includes("rice") ||
        name.includes("egg fried rice") ||
        name.includes("caesar salad")
      );
    }

    if (selectedCategory === "Mains") {
      const isSideOrRice =
        name.includes("rice") ||
        name.includes("salad") ||
        desc.includes("rice");
      const isDrink =
        name.includes("drink") ||
        name.includes("beverage") ||
        name.includes("juice") ||
        name.includes("tea") ||
        name.includes("soda") ||
        name.includes("water");
      return !isSideOrRice && !isDrink;
    }

    return true;
  });

  const handlePlaceOrder = (
    orderType: "dine_in" | "take_out" = "dine_in",
    _packagingFee: number = 0,
    _totalAmount?: number
  ) => {
    if (cartItems.length === 0) return;
    setErrorMessage(null);
    startTransition(async () => {
      const itemsSubtotal = cartItems.reduce(
        (sum, item) => sum + Number(item.menuItem.price) * Number(item.quantity),
        0
      );
      const totalItemCount = cartItems.reduce(
        (sum, item) => sum + Number(item.quantity),
        0
      );
      const packagingFee = orderType === "take_out" ? totalItemCount * 10 : 0;
      const grandTotal = itemsSubtotal + packagingFee;

      const payload = {
        table_id: selectedTableId || undefined,
        table_number: rawTableNumber ? parseInt(rawTableNumber, 10) : undefined,
        brand: currentBrand,
        order_type: orderType,
        packaging_fee: packagingFee,
        subtotal: itemsSubtotal,
        total_amount: grandTotal,
        customer_name: rawTableNumber ? "Table " + rawTableNumber + " Guest" : "Guest",
        customer_notes: rawTableNumber ? "Table " + rawTableNumber : "",
        items: cartItems.map((c) => ({
          menu_item_id: c.menuItem.id,
          quantity: c.quantity,
          special_instructions: c.specialInstructions,
        })),
      };

      const result = await createOrderAction(payload);
      if (result.success && result.data) {
        const placed = result.data;

        // Persist order references locally
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("kyles_last_order_id", placed.id);
            if (rawTableNumber) {
              localStorage.setItem(`kyles_table_${rawTableNumber}_last_order`, placed.id);
              localStorage.setItem("kyles_current_table", rawTableNumber);
            }
            const rawMyOrders = localStorage.getItem("@kyle_pos_my_orders");
            const parsedMyOrders = rawMyOrders ? JSON.parse(rawMyOrders) : [];
            const updatedMyOrders = Array.isArray(parsedMyOrders)
              ? [...parsedMyOrders, placed.id]
              : [placed.id];
            localStorage.setItem("@kyle_pos_my_orders", JSON.stringify(updatedMyOrders));
          } catch {}
        }

        // Clear cart ONLY after successful insert, then redirect
        clearCart();
        setCartOpen(false);
        setHasActiveOrders(true);

        const tableParam = rawTableNumber ? `&table=${encodeURIComponent(rawTableNumber)}` : "";
        router.push(`/status?order=${placed.id}&brand=${currentBrand}${tableParam}`);
      } else {
        setErrorMessage(result.error || "Failed to place order. Please try again.");
      }
    });
  };

  return (
    <div
      className={cn(
        "min-h-screen w-full flex flex-col transition-colors duration-300",
        isDark ? "dark bg-zinc-950 text-white" : "bg-white text-stone-900"
      )}
    >
      {/* Pattern definitions for medallions */}
      <JapanesePatternDefs />

      {/* Main Full-Viewport App Container */}
      <div className="w-full flex-1 flex flex-col">
        {/* Top App Header */}
        <header
          className={cn(
            "sticky top-0 z-40 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between backdrop-blur-md transition-colors",
            isDark
              ? "bg-zinc-950/90 border-b border-zinc-800 text-white"
              : "bg-white/95 border-b border-stone-100 text-stone-900"
          )}
        >
          {/* Left: Brand Logo */}
          <div className="flex items-center shrink-0 overflow-visible">
            {currentBrand === "batchoy-shop" ? (
              <Image
                src="/batchoy-logo.png"
                alt="Batchoy Shop"
                width={160}
                height={40}
                className="h-8 w-auto object-contain scale-150 origin-left ml-1"
                priority
              />
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Image
                  src="/kyles-logo.jpg"
                  alt="Kyle's Eatery"
                  width={34}
                  height={34}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full shadow-xs object-cover border border-stone-200 shrink-0"
                  priority
                />
                <span className="text-[13px] sm:text-base font-bold tracking-wide text-stone-800 uppercase block">
                  Kyle&apos;s Eatery
                </span>
              </div>
            )}
          </div>

          {/* Middle: Table Pill */}
          <div className="flex items-center justify-center">
            {rawTableNumber ? (
              <span
                className="text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider border shadow-xs"
                style={{
                  color: theme.accent,
                  backgroundColor: `${theme.accent}18`,
                  borderColor: `${theme.accent}30`,
                }}
              >
                Table {rawTableNumber}
              </span>
            ) : null}
          </div>

          {/* Right: Receipt / Order Tracker Icon */}
          <div className="flex items-center justify-end shrink-0">
            <Link
              href={
                rawTableNumber
                  ? `/status?table=${encodeURIComponent(rawTableNumber)}&brand=${currentBrand}`
                  : `/status?brand=${currentBrand}`
              }
              aria-label="Order Receipt & Status"
              title="View Digital Receipt"
              className={cn(
                "relative p-2 rounded-full shrink-0 active:scale-90 transition border",
                isDark
                  ? "text-zinc-200 hover:bg-zinc-800 border-zinc-800"
                  : "text-stone-700 hover:bg-stone-100 border-stone-200/80"
              )}
            >
              <ReceiptText size={19} strokeWidth={1.8} />
              {hasActiveOrders && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-zinc-950 animate-pulse" />
              )}
            </Link>
          </div>
        </header>

        {/* Sticky Category Filter Bar */}
        <div
          className={cn(
            "sticky top-[61px] sm:top-[69px] z-30 px-4 sm:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar backdrop-blur-md transition-colors border-b",
            isDark
              ? "bg-zinc-950/80 border-zinc-800 text-white"
              : "bg-white/80 border-zinc-100 text-zinc-900"
          )}
        >
          {(["All", "Mains", "Sides & Rice", "Drinks"] as const).map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "shrink-0 transition-all active:scale-95",
                  isActive
                    ? currentBrand === "batchoy-shop"
                      ? "bg-red-600 text-white font-semibold text-xs px-3.5 py-1.5 rounded-full shadow-xs"
                      : "bg-orange-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-full shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Responsive Food Card Grid with pb-28 bottom scroll clearance */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-28 pt-4 sm:pt-6">
          {itemsToRender.length === 0 ? (
            <div className="py-20 text-center text-zinc-400 text-sm">
              No items available in this category.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {itemsToRender.map((item, idx) => {
                const inCart = cartItems.find((c) => c.menuItem.id === item.id);
                const qty = inCart?.quantity || 0;
                const imageUrl =
                  item.image_url ||
                  PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
                const basePattern =
                  BASE_PATTERN_NAMES[idx % BASE_PATTERN_NAMES.length];
                const patternId = `pat-${basePattern}${theme.patternSuffix}`;

                return (
                  <ModernFoodCardItem
                    key={item.id}
                    item={item}
                    imageUrl={imageUrl}
                    isDark={isDark}
                    qtyInCart={qty}
                    onIncrement={(e) => {
                      e.stopPropagation();
                      addItem(item, 1);
                    }}
                    onDecrement={(e) => {
                      e.stopPropagation();
                      updateQuantity(item.id, -1);
                    }}
                    onClick={() =>
                      setModalItem({ item, imageUrl, patternId })
                    }
                  />
                );
              })}
            </div>
          )}
        </main>

        {/* Floating Cart Bar */}
        <AnimatePresence>
          {totalCount() > 0 && !isCartOpen && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-5 inset-x-4 max-w-lg mx-auto left-0 right-0 z-40 pointer-events-auto"
            >
              <button
                onClick={() => setCartOpen(true)}
                className={cn(
                  "w-full py-3.5 px-6 rounded-full text-white font-semibold text-sm flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer",
                  currentBrand === "batchoy-shop"
                    ? "bg-red-600 hover:bg-red-700 shadow-xl shadow-red-950/50"
                    : "bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/25"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center font-mono text-xs font-bold">
                    {totalCount()}
                  </span>
                  <span>View Order</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-base font-bold">
                  <span>{formatPrice(subtotal())}</span>
                  <ShoppingCart size={18} />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Item Detail / Add to Cart Modal (Bottom sheet) */}
        <AnimatePresence>
          {modalItem && (
            <ItemDetailModal
              item={modalItem.item}
              imageUrl={modalItem.imageUrl}
              patternId={modalItem.patternId}
              theme={theme}
              initialQty={
                cartItems.find((c) => c.menuItem.id === modalItem.item.id)?.quantity || 1
              }
              onClose={() => setModalItem(null)}
              onAddToCart={(item, qty, instructions) => {
                addItem(item, qty, instructions);
              }}
            />
          )}
        </AnimatePresence>

        {/* Cart Drawer */}
        <AnimatePresence>
          {isCartOpen && (
            <CartDrawer
              tableNumber={rawTableNumber}
              theme={theme}
              currentBrand={currentBrand}
              onSubmit={handlePlaceOrder}
              isPending={isPending}
              errorMessage={errorMessage}
              onClose={() => setCartOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
