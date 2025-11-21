import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  role: null,

  login: (user, accessToken, refreshToken, role = null) => set({ 
    user, 
    accessToken, 
    refreshToken, 
    isAuthenticated: true,
    role: role || user?.roleId || user?.role || null
  }),
  logout: () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // no-op
    }
    set({ 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false,
      role: null
    });
  },
  initializeAuth: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const user = localStorage.getItem('user');
    
    if (accessToken && refreshToken) {
      const userData = user ? JSON.parse(user) : null;
      set({ 
        accessToken, 
        refreshToken, 
        isAuthenticated: true,
        user: userData,
        role: userData?.roleId || userData?.role || null
      });
    }
  },
}));
