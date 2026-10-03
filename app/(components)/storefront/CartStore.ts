"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./data";

export type CartItem = {
  product: Product;
  colorName: string;
  colorHex: string;
  price: number;
  quantity: number;
  stock: number;
  sku: string;
};

const compactCartItem = (item: CartItem): CartItem => {
  return {
    ...item,
    product: {
      id: item.product.id,
      name: item.product.name,
      category: item.product.category,
      price: item.product.price,
      originalPrice: item.product.originalPrice,
      salePercent: item.product.salePercent,
      rating: item.product.rating,
      reviews: item.product.reviews,
      image: item.product.image,
      secondaryImage: item.product.image,
      description: item.product.description,
      badge: item.product.badge,
      colors: [],
    },
  };
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  refreshCartItem: (sku: string, product: Product, colorHex: string, price: number, stock: number) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  removeItem: (sku: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const stock = Math.max(0, Math.floor(item.stock));
          const requestedQuantity = Math.max(0, Math.floor(item.quantity));
          if (stock === 0 || requestedQuantity === 0) return state;

          const existing = state.items.find((entry) => entry.sku === item.sku);
          if (existing) {
            return {
              items: state.items.map((entry) =>
                entry.sku === item.sku
                  ? {
                      ...entry,
                      stock,
                      quantity: Math.min(stock, entry.quantity + requestedQuantity),
                    }
                  : entry
              ),
            };
          }
          return {
            items: [...state.items, { ...item, stock, quantity: Math.min(stock, requestedQuantity) }],
          };
        }),
      refreshCartItem: (sku, product, colorHex, price, stock) =>
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.sku !== sku) return item;

              const current = item.product;
              const unchanged =
                current.name === product.name &&
                current.category === product.category &&
                current.price === product.price &&
                current.originalPrice === product.originalPrice &&
                current.salePercent === product.salePercent &&
                current.rating === product.rating &&
                current.reviews === product.reviews &&
                current.image === product.image &&
                current.description === product.description &&
                current.badge === product.badge &&
                item.colorHex === colorHex &&
                item.price === price &&
                item.stock === stock;

              return unchanged
                ? item
                : { ...item, product, colorHex, price, stock, quantity: Math.min(item.quantity, stock) };
            })
            .filter((item) => item.quantity > 0),
        })),
      updateQuantity: (sku, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.sku === sku && Number.isFinite(item.stock)
                ? { ...item, quantity: Math.min(Math.floor(quantity), item.stock) }
                : item
            )
            .filter((item) => item.quantity > 0),
        })),
      removeItem: (sku) => set((state) => ({ items: state.items.filter((item) => item.sku !== sku) })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "crochet-cart",
      version: 2,
      partialize: (state) => ({
        items: state.items.map(compactCartItem),
      }),
      migrate: (persistedState) => {
        const state = persistedState as CartState;
        return {
          ...state,
          items: Array.isArray(state.items) ? state.items.map(compactCartItem) : [],
        };
      },
    }
  )
);
