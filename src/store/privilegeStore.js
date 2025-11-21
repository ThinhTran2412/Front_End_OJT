import { create } from "zustand";

export const usePrivilegeStore = create((set) => ({
  privileges: [],
  loading: false,
  error: null,

  // Actions
  setPrivileges: (privileges) => set({ privileges }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Reset store
  reset: () => set({ 
    privileges: [], 
    loading: false, 
    error: null 
  })
}));
