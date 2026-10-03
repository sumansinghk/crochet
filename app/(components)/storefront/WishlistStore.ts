"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./data";
import type { CartItem } from "./CartStore";

export type WishlistItem = {
  product: Product;
  cartItem?: CartItem;
};

type WishlistState = {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  saveCartItem: (item: CartItem) => void;
  removeItem: (id: number | string) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: state.items.some((entry) => String(entry.product.id) === String(item.product.id)) ? state.items : [...state.items, item] })),
      saveCartItem: (item) => set((state) => {
        const existingIndex = state.items.findIndex((entry) => String(entry.product.id) === String(item.product.id));
        const savedItem: WishlistItem = { product: item.product, cartItem: item };
        if (existingIndex === -1) return { items: [...state.items, savedItem] };

        return {
          items: state.items.map((entry, index) =>
            index === existingIndex ? savedItem : entry
          ),
        };
      }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((entry) => String(entry.product.id) !== String(id)) })),
    }),
    { name: "crochet-wishlist" }
  )
);
