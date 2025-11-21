import { create } from "zustand";

export const useTestOrderStore = create((set) => ({
  orders: [],
  loading: false,

  setOrders: (orders) => set({ orders }),
  setLoading: (loading) => set({ loading }),
}));
