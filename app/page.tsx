"use client";

import { Suspense, useEffect, useTransition, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, Plus, Minus, X, ShoppingCart, CheckCircle,
  ReceiptText, LayoutGrid, Rows3
} from "lucide-react";
import { MenuItem, Order } from "@/types/database";
import { getMenuItemsAction } from "@/app/actions/menu";
import { getTablesAction } from "@/app/actions/tables";
import { createOrderAction } from "@/app/actions/orders";
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
    bgPattern: "/images/sushi/japanese_pattern.jpg",
    bgColor: "#560c12",
    accent: "#8d2d2b",
    accentHover: "#762423",
    accentBg: "bg-[#8d2d2b]",
    accentHoverBg: "hover:bg-[#762423]",
    accentText: "text-[#8d2d2b]",
    accentBorder: "border-[#8d2d2b]",
    accentShadow: "shadow-[#8d2d2b]/30",
    patternSuffix: "-red",
  },
  "kyles-eatery": {
    brandName: "Kyle's Eatery",
    title: "KYLE'S EATERY",
    bgPattern: "/images/sushi/japanese_pattern_orange.jpg",
    bgColor: "#852d05",
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

// ─── Exact List Row Component (Matching user image) ─────────────────────────
function SushiListRow({
  item,
  imageUrl,
  patternId,
  theme,
  qtyInCart,
  onClick,
  onAddClick,
}: {
  item: MenuItem;
  imageUrl: string;
  patternId: string;
  theme: typeof THEMES[Brand];
  qtyInCart: number;
  onClick: () => void;
  onAddClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group relative flex items-center justify-between py-2 sm:py-3 px-1 sm:px-2 cursor-pointer select-none transition-all active:opacity-85"
    >
      {/* Left: Medallion with Dish Overlap */}
      <div className="relative flex items-center shrink-0 w-[84px] h-[84px] sm:w-[92px] sm:h-[92px] -ml-1 sm:ml-0">
        {/* Japanese Patterned Circle */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          className="rounded-full shadow-inner shrink-0 sm:w-[88px] sm:h-[88px]"
        >
          <circle cx="40" cy="40" r="40" fill={`url(#${patternId})`} />
        </svg>

        {/* Food image floating in front, slightly offset to the right and bottom */}
        <div
          className="absolute -right-1 top-2 w-[74px] h-[74px] sm:w-[82px] sm:h-[82px] pointer-events-none transition-transform duration-300 group-hover:scale-105"
          style={{
            filter: "drop-shadow(4px 8px 12px rgba(0, 0, 0, 0.28))",
          }}
        >
          <Image
            src={imageUrl}
            alt={item.name}
            width={88}
            height={88}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      </div>

      {/* Middle: Name & Price */}
      <div className="flex-1 min-w-0 pl-4 sm:pl-5 pr-2 flex flex-col justify-center">
        {/* Title in soft slate gray matching mockup */}
        <h3 className="text-[16px] sm:text-[17px] font-medium text-[#52525b] tracking-normal leading-snug truncate">
          {item.name}
        </h3>

        {/* Price in Brand Accent Color */}
        <span
          className="text-[18px] sm:text-[19px] font-bold tracking-tight leading-none mt-1 font-sans transition-colors"
          style={{ color: theme.accent }}
        >
          {formatPrice(item.price)}
        </span>
      </div>

      {/* Right: Circular Plus (+) Button in Brand Accent */}
      <div className="flex items-center gap-2 shrink-0 pr-1 sm:pr-2">
        {qtyInCart > 0 && (
          <span
            className="w-5 h-5 text-white text-[11px] font-bold rounded-full flex items-center justify-center font-mono shadow-xs transition-colors"
            style={{ backgroundColor: theme.accent }}
          >
            {qtyInCart}
          </span>
        )}

        <MockupPlusButton
          onClick={onAddClick}
          color={theme.accent}
          ariaLabel={`Add ${item.name} to cart`}
          size={36}
        />
      </div>
    </div>
  );
}

// ─── Exact Staggered Card View Component (Matching user image) ──────────────
function SushiCardItem({
  item,
  imageUrl,
  patternId,
  theme,
  qtyInCart,
  onClick,
  onAddClick,
}: {
  item: MenuItem;
  imageUrl: string;
  patternId: string;
  theme: typeof THEMES[Brand];
  qtyInCart: number;
  onClick: () => void;
  onAddClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-[26px] shadow-[0_12px_28px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 border border-stone-100/70 pt-[72px] sm:pt-[78px] pb-4 sm:pb-5 px-3 sm:px-4 flex flex-col items-center cursor-pointer select-none transition-all duration-300 active:scale-[0.98]"
    >
      {/* Overflowing Japanese Pattern Medallion */}
      <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 w-[84px] h-[84px] sm:w-[92px] sm:h-[92px] rounded-full overflow-hidden shadow-xs pointer-events-none transition-transform duration-300 group-hover:scale-105">
        <svg className="w-full h-full" viewBox="0 0 84 84">
          <circle cx="42" cy="42" r="42" fill={`url(#${patternId})`} />
        </svg>
      </div>

      {/* Overflowing Food Cutout Image with Realistic Drop Shadow */}
      <div
        className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 w-[80px] h-[80px] sm:w-[88px] sm:h-[88px] pointer-events-none transition-transform duration-300 group-hover:scale-110 flex items-center justify-center"
        style={{
          filter: "drop-shadow(4px 10px 10px rgba(0, 0, 0, 0.32))",
        }}
      >
        <Image
          src={imageUrl}
          alt={item.name}
          width={92}
          height={92}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {/* Cart quantity badge if already in cart */}
      {qtyInCart > 0 && (
        <span
          className="absolute top-2.5 right-2.5 w-5 h-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono shadow-xs transition-colors"
          style={{ backgroundColor: theme.accent }}
        >
          {qtyInCart}
        </span>
      )}

      {/* Item Title */}
      <h3 className="text-[14px] sm:text-[15px] font-medium text-[#52525b] text-center truncate w-full px-1 mt-1 leading-snug">
        {item.name}
      </h3>

      {/* Item Price */}
      <p
        className="text-[15px] sm:text-[16px] font-bold text-center mt-0.5 tracking-tight font-sans transition-colors"
        style={{ color: theme.accent }}
      >
        {formatPrice(item.price)}
      </p>

      {/* Circular Plus (+) Button matching mockup */}
      <MockupPlusButton
        onClick={onAddClick}
        color={theme.accent}
        ariaLabel={`Add ${item.name} to cart`}
        size={36}
        className="mt-2.5 mb-0.5"
      />
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
    onAddToCart(item, qty, instructions);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="w-full max-w-[340px] sm:max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-stone-700 flex items-center justify-center shadow-md backdrop-blur-sm transition-transform active:scale-90"
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        {/* Top Japanese Arch Graphic with Dish Image */}
        <div className="relative pt-6 pb-2 px-6 flex flex-col items-center justify-center w-full">
          {/* Circular/Arch patterned backdrop */}
          <div className="relative w-44 h-44 rounded-full overflow-hidden shadow-lg border-2 border-stone-200/50 flex items-center justify-center">
            <svg width="176" height="176" viewBox="0 0 176 176" className="w-full h-full">
              <circle cx="88" cy="88" r="88" fill={`url(#${patternId})`} />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
          </div>

          {/* Food image floating directly above arch */}
          <div
            className="absolute top-8 w-36 h-36 flex items-center justify-center pointer-events-none"
            style={{
              filter: "drop-shadow(4px 8px 16px rgba(0, 0, 0, 0.32))",
            }}
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
            <h3 className="text-xl font-bold text-stone-900 tracking-tight">
              {item.name}
            </h3>
            <p
              className="text-sm font-bold mt-0.5 font-sans"
              style={{ color: theme.accent }}
            >
              {formatPrice(item.price)}
            </p>
            {item.description && (
              <p className="text-xs text-stone-500 mt-2 max-w-[280px] leading-relaxed line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          {/* Quantity Controls: [-] [ 1 ] [+] (Exact matching reference in Red theme.accent) */}
          <div className="w-full flex items-center justify-center gap-3.5 pt-1">
            <MockupMinusButton
              onClick={handleDec}
              ariaLabel="Decrease quantity"
              color={theme.accent}
              size={38}
            />

            <div
              className="w-24 h-[38px] rounded-xl flex items-center justify-center bg-white shadow-xs border-[1.8px]"
              style={{ borderColor: theme.accent }}
            >
              <span
                className="text-lg font-bold font-mono"
                style={{ color: theme.accent }}
              >
                {qty}
              </span>
            </div>

            <MockupPlusButton
              onClick={handleInc}
              ariaLabel="Increase quantity"
              color={theme.accent}
              size={38}
            />
          </div>

          {/* Optional Special Instructions */}
          <div className="w-full pt-1">
            <input
              type="text"
              placeholder="Add special instructions..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-stone-800 placeholder:text-stone-400 focus:outline-none transition-colors"
              style={{ borderColor: theme.accent }}
            />
          </div>

          {/* Large Pill Add to Cart Button (Themed) */}
          <button
            onClick={handleSubmit}
            className="w-full py-3.5 px-6 rounded-full text-white font-medium text-sm sm:text-base tracking-wide shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.accent }}
          >
            <span>Add to Cart</span>
            <span className="opacity-80 font-mono text-xs">
              • {formatPrice(Number(item.price) * qty)}
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
  onSubmit,
  isPending,
  errorMessage,
  onClose,
}: {
  tableNumber: string;
  theme: typeof THEMES[Brand];
  onSubmit: () => void;
  isPending: boolean;
  errorMessage: string | null;
  onClose: () => void;
}) {
  const { items, updateQuantity, updateInstructions, totalCount, subtotal } = useCartStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full sm:max-w-md flex flex-col bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShoppingCart size={18} style={{ color: theme.accent }} />
              Your Order
              {tableNumber && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                  Table {tableNumber}
                </span>
              )}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {totalCount()} item{totalCount() !== 1 ? "s" : ""} · {formatPrice(subtotal())}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <AnimatePresence initial={false}>
            {items.map((c) => (
              <motion.div
                key={c.menuItem.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl p-3.5 bg-stone-50 border border-stone-100 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">
                      {c.menuItem.name}
                    </p>
                    <p
                      className="text-xs font-mono font-medium"
                      style={{ color: theme.accent }}
                    >
                      {formatPrice(Number(c.menuItem.price) * c.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <MockupMinusButton
                      onClick={() => updateQuantity(c.menuItem.id, -1)}
                      ariaLabel="Decrease quantity"
                      color={theme.accent}
                      size={28}
                    />
                    <span
                      className="w-5 text-center text-sm font-bold font-mono"
                      style={{ color: theme.accent }}
                    >
                      {c.quantity}
                    </span>
                    <MockupPlusButton
                      onClick={() => updateQuantity(c.menuItem.id, 1)}
                      ariaLabel="Increase quantity"
                      color={theme.accent}
                      size={28}
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Special instructions..."
                  value={c.specialInstructions}
                  onChange={(e) => updateInstructions(c.menuItem.id, e.target.value)}
                  className="w-full text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 outline-none text-stone-800 placeholder:text-stone-400 transition"
                  style={{ borderColor: theme.accent }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="py-16 text-center text-sm text-stone-400">
              Your cart is empty.<br />Select items from the menu to get started.
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        {items.length > 0 && (
          <div className="shrink-0 px-6 pt-4 pb-8 bg-stone-50 border-t border-stone-100">
            {errorMessage && (
              <p className="mb-3 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-200">
                {errorMessage}
              </p>
            )}
            <div className="flex justify-between items-baseline mb-4 text-stone-900">
              <span className="text-sm font-medium text-stone-500">Subtotal</span>
              <span
                className="text-2xl font-bold font-mono tracking-tight"
                style={{ color: theme.accent }}
              >
                {formatPrice(subtotal())}
              </span>
            </div>
            <button
              onClick={onSubmit}
              disabled={isPending}
              className="w-full py-3.5 rounded-full text-white font-bold text-sm tracking-wide shadow-lg transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.accent }}
            >
              {isPending ? "Sending to Kitchen..." : "Place Order →"}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Order Success Modal ─────────────────────────────────────────────────────
function OrderSuccessModal({
  order,
  tableNumber,
  theme,
  onClose,
}: {
  order: Order;
  tableNumber: string;
  theme: typeof THEMES[Brand];
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-sm rounded-[32px] bg-white overflow-hidden shadow-2xl p-7 text-center space-y-4"
      >
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle size={28} />
        </div>

        <div>
          <h3 className="text-xl font-bold text-stone-900">Order Received!</h3>
          <p className="text-xs text-stone-500 mt-1">Your order has been sent to the kitchen.</p>
        </div>

        <div className="rounded-2xl bg-stone-50 border border-stone-100 p-4 space-y-1">
          <p className="text-xs text-stone-400">Order Number</p>
          <p
            className="text-2xl font-bold font-mono tracking-wider"
            style={{ color: theme.accent }}
          >
            #{order.order_number}
          </p>
          <p className="text-sm font-semibold font-mono text-stone-700">
            {formatPrice(order.total_amount)}
          </p>
        </div>

        {tableNumber && (
          <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 px-4 py-2.5 text-center">
            <p className="text-xs text-amber-800">
              Assigned to <span className="font-bold">Table {tableNumber}</span>
            </p>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="space-y-2.5 pt-2">
          <Link
            href={`/status?order=${order.id}${tableNumber ? `&table=${encodeURIComponent(tableNumber)}` : ""}`}
            className="w-full py-3.5 rounded-full text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md"
            style={{ backgroundColor: theme.accent }}
          >
            <ReceiptText size={16} />
            Track Order Status
          </Link>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition"
          >
            Order More
          </button>
        </div>
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

  // View mode: 'cards' (staggered 2-column masonry matching mockup) or 'list'
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("kyles_view_mode");
      if (savedMode === "list" || savedMode === "cards") {
        setViewMode(savedMode);
      }
    }
  }, []);

  const handleSetViewMode = (mode: "cards" | "list") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("kyles_view_mode", mode);
    }
  };

  const {
    setActiveBrand, setTodayBrand,
    isCartOpen, setCartOpen, items: cartItems, addItem, clearCart,
    totalCount, subtotal,
  } = useCartStore();

  const [menuItems, setMenuItems] = useState<MenuItem[]>(ORIGINAL_MENU);
  const [selectedTableId, setSelectedTableId] = useState<string>("");

  // Selected item for Add-to-Cart Modal
  const [modalItem, setModalItem] = useState<{ item: MenuItem; imageUrl: string; patternId: string } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
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

  // Check active orders in localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("@kyle_pos_my_orders");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setHasActiveOrders(true);
      }
    } catch {}
  }, []);

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

  const itemsToRender =
    sortedItems.length > 0
      ? sortedItems
      : ORIGINAL_MENU.filter((i) =>
          currentBrand === "batchoy-shop"
            ? i.brand_schedule === "batchoy-shop"
            : i.brand_schedule === "kyles-eatery"
        );

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;
    setErrorMessage(null);
    startTransition(async () => {
      const payload = {
        table_id: selectedTableId || undefined,
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
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("kyles_last_order_id", placed.id);
            if (rawTableNumber) {
              localStorage.setItem(`kyles_table_${rawTableNumber}_last_order`, placed.id);
            }
            const rawMyOrders = localStorage.getItem("@kyle_pos_my_orders");
            const parsedMyOrders = rawMyOrders ? JSON.parse(rawMyOrders) : [];
            const updatedMyOrders = Array.isArray(parsedMyOrders)
              ? [...parsedMyOrders, placed.id]
              : [placed.id];
            localStorage.setItem("@kyle_pos_my_orders", JSON.stringify(updatedMyOrders));
            setHasActiveOrders(true);
          } catch {}
        }
        clearCart();
        setCartOpen(false);
        setOrderSuccess(placed);
      } else {
        setErrorMessage(result.error || "Failed to place order. Please try again.");
      }
    });
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center items-center py-0 sm:py-6 relative transition-colors duration-500"
      style={{
        backgroundImage: `url('${theme.bgPattern}')`,
        backgroundSize: "400px",
        backgroundRepeat: "repeat",
        backgroundColor: theme.bgColor,
      }}
    >
      {/* Pattern definitions */}
      <JapanesePatternDefs />

      {/* Vignette / dark overlay on large screens */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Responsive Screen Container */}
      <main className="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl min-h-screen sm:min-h-[92vh] sm:my-6 md:my-8 bg-white sm:rounded-[36px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] flex flex-col relative z-10 overflow-hidden border-0 sm:border border-white/20 transition-all duration-300">
        
        {/* Top App Header (Responsive matching mobile & desktop) */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-5 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-stone-100">
          {/* Left: Back chevron button + Brand & Table indicator */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-700 hover:bg-stone-100 active:scale-90 transition-transform -ml-1"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[13px] sm:text-base font-bold tracking-wide text-stone-800 uppercase block">
                {theme.brandName}
              </span>
              {rawTableNumber && (
                <span
                  className="text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ color: theme.accent, backgroundColor: `${theme.accent}15` }}
                >
                  Table {rawTableNumber}
                </span>
              )}
            </div>
          </div>

          {/* Center (Desktop only): Section subtitle */}
          <div className="hidden md:block text-center">
            <span className="text-xs font-semibold tracking-[0.2em] text-stone-400 uppercase">
              {theme.title}
            </span>
          </div>

          {/* Right: Cart link with count badge & desktop subtotal */}
          <button
            onClick={() => setCartOpen(true)}
            aria-label="View Cart"
            className="relative flex items-center gap-2 py-1.5 px-3 sm:px-4 rounded-full border border-stone-200/80 hover:bg-stone-50 active:scale-95 transition shadow-xs"
          >
            <ShoppingCart size={16} style={{ color: theme.accent }} />
            <span className="text-xs sm:text-sm font-semibold text-stone-800 tracking-tight">
              Cart
            </span>
            {totalCount() > 0 && (
              <span
                className="w-5 h-5 text-white text-[11px] font-bold rounded-full flex items-center justify-center font-mono shadow-xs transition-colors"
                style={{ backgroundColor: theme.accent }}
              >
                {totalCount()}
              </span>
            )}
            {totalCount() > 0 && (
              <span
                className="hidden sm:inline font-mono text-xs font-bold pl-1.5 border-l border-stone-200"
                style={{ color: theme.accent }}
              >
                {formatPrice(subtotal())}
              </span>
            )}
          </button>
        </header>

        {/* Section Heading & View Switcher */}
        <div className="relative px-4 sm:px-8 pt-4 pb-3 flex items-center justify-between">
          <div className="w-16 sm:w-24 shrink-0" />
          <div className="text-center flex-1">
            <h1 className="text-base sm:text-lg md:text-xl font-medium tracking-[0.22em] text-[#374151] uppercase font-sans">
              {theme.title}
            </h1>
          </div>
          {/* Subtle View Switcher */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => handleSetViewMode("cards")}
              aria-label="Card View"
              title="Card View"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "cards" ? "bg-white text-stone-900 shadow-xs" : "text-stone-400 hover:text-stone-700"
              )}
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => handleSetViewMode("list")}
              aria-label="List View"
              title="List View"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "list" ? "bg-white text-stone-900 shadow-xs" : "text-stone-400 hover:text-stone-700"
              )}
            >
              <Rows3 size={15} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* The Exact Card View (matching user's attached staggered mockup) OR List View */}
        {viewMode === "cards" ? (
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-28 pt-8 sm:pt-10">
            {/* Mobile (2-column staggered masonry matching user's photo) */}
            <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:hidden">
              <div className="flex flex-col gap-9 sm:gap-10">
                {itemsToRender
                  .filter((_, idx) => idx % 2 === 0)
                  .map((item) => {
                    const originalIdx = itemsToRender.findIndex((i) => i.id === item.id);
                    const inCart = cartItems.find((c) => c.menuItem.id === item.id);
                    const qty = inCart?.quantity || 0;
                    const basePattern = BASE_PATTERN_NAMES[originalIdx % BASE_PATTERN_NAMES.length];
                    const patternId = `pat-${basePattern}${theme.patternSuffix}`;
                    const imageUrl = item.image_url || PLACEHOLDER_IMAGES[originalIdx % PLACEHOLDER_IMAGES.length];

                    return (
                      <SushiCardItem
                        key={item.id}
                        item={item}
                        imageUrl={imageUrl}
                        patternId={patternId}
                        theme={theme}
                        qtyInCart={qty}
                        onClick={() => setModalItem({ item, imageUrl, patternId })}
                        onAddClick={(e) => {
                          e.stopPropagation();
                          addItem(item, 1);
                        }}
                      />
                    );
                  })}
              </div>

              <div className="flex flex-col gap-9 sm:gap-10 pt-11 sm:pt-12">
                {itemsToRender
                  .filter((_, idx) => idx % 2 === 1)
                  .map((item) => {
                    const originalIdx = itemsToRender.findIndex((i) => i.id === item.id);
                    const inCart = cartItems.find((c) => c.menuItem.id === item.id);
                    const qty = inCart?.quantity || 0;
                    const basePattern = BASE_PATTERN_NAMES[originalIdx % BASE_PATTERN_NAMES.length];
                    const patternId = `pat-${basePattern}${theme.patternSuffix}`;
                    const imageUrl = item.image_url || PLACEHOLDER_IMAGES[originalIdx % PLACEHOLDER_IMAGES.length];

                    return (
                      <SushiCardItem
                        key={item.id}
                        item={item}
                        imageUrl={imageUrl}
                        patternId={patternId}
                        theme={theme}
                        qtyInCart={qty}
                        onClick={() => setModalItem({ item, imageUrl, patternId })}
                        onAddClick={(e) => {
                          e.stopPropagation();
                          addItem(item, 1);
                        }}
                      />
                    );
                  })}
              </div>
            </div>

            {/* Tablet (3-column staggered masonry) */}
            <div className="hidden md:grid lg:hidden md:grid-cols-3 md:gap-5">
              <div className="flex flex-col gap-10">
                {itemsToRender
                  .filter((_, idx) => idx % 3 === 0)
                  .map((item) => {
                    const originalIdx = itemsToRender.findIndex((i) => i.id === item.id);
                    const inCart = cartItems.find((c) => c.menuItem.id === item.id);
                    const qty = inCart?.quantity || 0;
                    const basePattern = BASE_PATTERN_NAMES[originalIdx % BASE_PATTERN_NAMES.length];
                    const patternId = `pat-${basePattern}${theme.patternSuffix}`;
                    const imageUrl = item.image_url || PLACEHOLDER_IMAGES[originalIdx % PLACEHOLDER_IMAGES.length];

                    return (
                      <SushiCardItem
                        key={item.id}
                        item={item}
                        imageUrl={imageUrl}
                        patternId={patternId}
                        theme={theme}
                        qtyInCart={qty}
                        onClick={() => setModalItem({ item, imageUrl, patternId })}
                        onAddClick={(e) => {
                          e.stopPropagation();
                          addItem(item, 1);
                        }}
                      />
                    );
                  })}
              </div>
              <div className="flex flex-col gap-10 pt-8">
                {itemsToRender
                  .filter((_, idx) => idx % 3 === 1)
                  .map((item) => {
                    const originalIdx = itemsToRender.findIndex((i) => i.id === item.id);
                    const inCart = cartItems.find((c) => c.menuItem.id === item.id);
                    const qty = inCart?.quantity || 0;
                    const basePattern = BASE_PATTERN_NAMES[originalIdx % BASE_PATTERN_NAMES.length];
                    const patternId = `pat-${basePattern}${theme.patternSuffix}`;
                    const imageUrl = item.image_url || PLACEHOLDER_IMAGES[originalIdx % PLACEHOLDER_IMAGES.length];

                    return (
                      <SushiCardItem
                        key={item.id}
                        item={item}
                        imageUrl={imageUrl}
                        patternId={patternId}
                        theme={theme}
                        qtyInCart={qty}
                        onClick={() => setModalItem({ item, imageUrl, patternId })}
                        onAddClick={(e) => {
                          e.stopPropagation();
                          addItem(item, 1);
                        }}
                      />
                    );
                  })}
              </div>
              <div className="flex flex-col gap-10 pt-14">
                {itemsToRender
                  .filter((_, idx) => idx % 3 === 2)
                  .map((item) => {
                    const originalIdx = itemsToRender.findIndex((i) => i.id === item.id);
                    const inCart = cartItems.find((c) => c.menuItem.id === item.id);
                    const qty = inCart?.quantity || 0;
                    const basePattern = BASE_PATTERN_NAMES[originalIdx % BASE_PATTERN_NAMES.length];
                    const patternId = `pat-${basePattern}${theme.patternSuffix}`;
                    const imageUrl = item.image_url || PLACEHOLDER_IMAGES[originalIdx % PLACEHOLDER_IMAGES.length];

                    return (
                      <SushiCardItem
                        key={item.id}
                        item={item}
                        imageUrl={imageUrl}
                        patternId={patternId}
                        theme={theme}
                        qtyInCart={qty}
                        onClick={() => setModalItem({ item, imageUrl, patternId })}
                        onAddClick={(e) => {
                          e.stopPropagation();
                          addItem(item, 1);
                        }}
                      />
                    );
                  })}
              </div>
            </div>

            {/* Desktop & Widescreen (4-column staggered masonry) */}
            <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
              <div className="flex flex-col gap-10">
                {itemsToRender
                  .filter((_, idx) => idx % 4 === 0)
                  .map((item) => {
                    const originalIdx = itemsToRender.findIndex((i) => i.id === item.id);
                    const inCart = cartItems.find((c) => c.menuItem.id === item.id);
                    const qty = inCart?.quantity || 0;
                    const basePattern = BASE_PATTERN_NAMES[originalIdx % BASE_PATTERN_NAMES.length];
                    const patternId = `pat-${basePattern}${theme.patternSuffix}`;
                    const imageUrl = item.image_url || PLACEHOLDER_IMAGES[originalIdx % PLACEHOLDER_IMAGES.length];

                    return (
                      <SushiCardItem
                        key={item.id}
                        item={item}
                        imageUrl={imageUrl}
                        patternId={patternId}
                        theme={theme}
                        qtyInCart={qty}
                        onClick={() => setModalItem({ item, imageUrl, patternId })}
                        onAddClick={(e) => {
                          e.stopPropagation();
                          addItem(item, 1);
                        }}
                      />
                    );
                  })}
              </div>
              <div className="flex flex-col gap-10 pt-7">
                {itemsToRender
                  .filter((_, idx) => idx % 4 === 1)
                  .map((item) => {
                    const originalIdx = itemsToRender.findIndex((i) => i.id === item.id);
                    const inCart = cartItems.find((c) => c.menuItem.id === item.id);
                    const qty = inCart?.quantity || 0;
                    const basePattern = BASE_PATTERN_NAMES[originalIdx % BASE_PATTERN_NAMES.length];
                    const patternId = `pat-${basePattern}${theme.patternSuffix}`;
                    const imageUrl = item.image_url || PLACEHOLDER_IMAGES[originalIdx % PLACEHOLDER_IMAGES.length];

                    return (
                      <SushiCardItem
                        key={item.id}
                        item={item}
                        imageUrl={imageUrl}
                        patternId={patternId}
                        theme={theme}
                        qtyInCart={qty}
                        onClick={() => setModalItem({ item, imageUrl, patternId })}
                        onAddClick={(e) => {
                          e.stopPropagation();
                          addItem(item, 1);
                        }}
                      />
                    );
                  })}
              </div>
              <div className="flex flex-col gap-10 pt-14">
                {itemsToRender
                  .filter((_, idx) => idx % 4 === 2)
                  .map((item) => {
                    const originalIdx = itemsToRender.findIndex((i) => i.id === item.id);
                    const inCart = cartItems.find((c) => c.menuItem.id === item.id);
                    const qty = inCart?.quantity || 0;
                    const basePattern = BASE_PATTERN_NAMES[originalIdx % BASE_PATTERN_NAMES.length];
                    const patternId = `pat-${basePattern}${theme.patternSuffix}`;
                    const imageUrl = item.image_url || PLACEHOLDER_IMAGES[originalIdx % PLACEHOLDER_IMAGES.length];

                    return (
                      <SushiCardItem
                        key={item.id}
                        item={item}
                        imageUrl={imageUrl}
                        patternId={patternId}
                        theme={theme}
                        qtyInCart={qty}
                        onClick={() => setModalItem({ item, imageUrl, patternId })}
                        onAddClick={(e) => {
                          e.stopPropagation();
                          addItem(item, 1);
                        }}
                      />
                    );
                  })}
              </div>
              <div className="flex flex-col gap-10 pt-7">
                {itemsToRender
                  .filter((_, idx) => idx % 4 === 3)
                  .map((item) => {
                    const originalIdx = itemsToRender.findIndex((i) => i.id === item.id);
                    const inCart = cartItems.find((c) => c.menuItem.id === item.id);
                    const qty = inCart?.quantity || 0;
                    const basePattern = BASE_PATTERN_NAMES[originalIdx % BASE_PATTERN_NAMES.length];
                    const patternId = `pat-${basePattern}${theme.patternSuffix}`;
                    const imageUrl = item.image_url || PLACEHOLDER_IMAGES[originalIdx % PLACEHOLDER_IMAGES.length];

                    return (
                      <SushiCardItem
                        key={item.id}
                        item={item}
                        imageUrl={imageUrl}
                        patternId={patternId}
                        theme={theme}
                        qtyInCart={qty}
                        onClick={() => setModalItem({ item, imageUrl, patternId })}
                        onAddClick={(e) => {
                          e.stopPropagation();
                          addItem(item, 1);
                        }}
                      />
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          /* List View (Exact matching mockup: pristine white, no card box, exact spacing) */
          <div className="flex-1 overflow-y-auto px-2 sm:px-6 lg:px-10 pb-28 pt-2 sm:pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-7 max-w-5xl mx-auto">
              {itemsToRender.map((item, idx) => {
                const inCart = cartItems.find((c) => c.menuItem.id === item.id);
                const qty = inCart?.quantity || 0;
                const basePattern = BASE_PATTERN_NAMES[idx % BASE_PATTERN_NAMES.length];
                const patternId = `pat-${basePattern}${theme.patternSuffix}`;
                const imageUrl = item.image_url || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];

                return (
                  <SushiListRow
                    key={item.id}
                    item={item}
                    imageUrl={imageUrl}
                    patternId={patternId}
                    theme={theme}
                    qtyInCart={qty}
                    onClick={() => setModalItem({ item, imageUrl, patternId })}
                    onAddClick={(e) => {
                      e.stopPropagation();
                      addItem(item, 1);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Circular Floating Cart Button (FAB) */}
        <AnimatePresence>
          {totalCount() > 0 && !isCartOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              onClick={() => setCartOpen(true)}
              aria-label="View Cart"
              className="fixed bottom-6 right-6 w-16 h-16 z-50 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `0 12px 30px -4px ${theme.accent}66, 0 6px 16px rgba(0,0,0,0.25)`,
              }}
            >
              <ShoppingCart size={26} strokeWidth={2.3} />
              {/* Notification Badge with Live Count */}
              <span className="absolute -top-1 -right-1 min-w-[24px] h-6 px-1.5 bg-stone-900 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md font-mono">
                {totalCount()}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Active orders indicator */}
        {hasActiveOrders && (
          <div className="absolute top-16 right-4 z-30">
            <Link
              href={`/status${rawTableNumber ? `?table=${encodeURIComponent(rawTableNumber)}` : ""}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/90 text-white text-[11px] font-medium shadow-lg backdrop-blur-sm hover:bg-stone-900 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Track Orders</span>
            </Link>
          </div>
        )}

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
              onSubmit={handlePlaceOrder}
              isPending={isPending}
              errorMessage={errorMessage}
              onClose={() => setCartOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Success Modal */}
        <AnimatePresence>
          {orderSuccess && (
            <OrderSuccessModal
              order={orderSuccess}
              tableNumber={rawTableNumber}
              theme={theme}
              onClose={() => setOrderSuccess(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
