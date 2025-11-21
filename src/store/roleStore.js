import { create } from "zustand";

export const useRoleStore = create((set) => ({
  roles: [],
  selectedRole: null,
  loading: false,
  error: null,

  // Actions
  setRoles: (roles) => set({ roles }),
  setSelectedRole: (role) => set({ selectedRole: role }),
  clearSelected: () => set({ selectedRole: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // CRUD operations
  addRole: (role) => set((state) => ({ 
    roles: [...state.roles, role] 
  })),
  
  updateRole: (id, updatedRole) => set((state) => ({
    roles: state.roles.map(role => 
      role.id === id ? { ...role, ...updatedRole } : role
    )
  })),
  
  deleteRole: (id) => set((state) => ({
    roles: state.roles.filter(role => role.id !== id)
  })),
  
  // Reset store
  reset: () => set({ 
    roles: [], 
    selectedRole: null, 
    loading: false, 
    error: null 
  })
}));
