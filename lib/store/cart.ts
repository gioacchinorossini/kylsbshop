import { create } from "zustand";
import { MenuItem } from "@/types/database";

export type Brand = "kyles-eatery" | "batchoy-shop";

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions: string;
}

interface CartStore {
  activeBrand: Brand;
  todayBrand: Brand;
  setActiveBrand: (brand: Brand) => void;
  setTodayBrand: (brand: Brand) => void;
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number, specialInstructions?: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  updateInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  totalCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  activeBrand: "kyles-eatery",
  todayBrand: "kyles-eatery",
  setActiveBrand: (brand) => set({ activeBrand: brand }),
  setTodayBrand: (brand) => set({ todayBrand: brand }),

  items: [],

  addItem: (menuItem, quantity = 1, specialInstructions = "") =>
    set((state) => {
      const existing = state.items.find((c) => c.menuItem.id === menuItem.id);
      if (existing) {
        return {
          items: state.items.map((c) =>
            c.menuItem.id === menuItem.id
              ? {
                  ...c,
                  quantity: c.quantity + quantity,
                  specialInstructions: specialInstructions || c.specialInstructions,
                }
              : c
          ),
        };
      }
      return { items: [...state.items, { menuItem, quantity, specialInstructions }] };
    }),

  updateQuantity: (itemId, delta) =>
    set((state) => ({
      items: state.items
        .map((c) => {
          if (c.menuItem.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[],
    })),

  updateInstructions: (itemId, instructions) =>
    set((state) => ({
      items: state.items.map((c) =>
        c.menuItem.id === itemId ? { ...c, specialInstructions: instructions } : c
      ),
    })),

  clearCart: () => set({ items: [] }),
  isCartOpen: false,
  setCartOpen: (open) => set({ isCartOpen: open }),
  totalCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
  subtotal: () => get().items.reduce((acc, i) => acc + Number(i.menuItem.price) * i.quantity, 0),
}));
