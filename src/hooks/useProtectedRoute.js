// hooks/useProtectedRoute.js
// EXTENSION POINTS:
// 1. Add convenience methods for specific roles (isAdmin, isManager, etc.)
// 2. Add permission checking (checkPermission, hasPermission)
// 3. Add role hierarchy support (isHigherThan, canAccess)
// 4. Add department/team based access control

import { useAuthStore } from '../store/authStore';

export const useProtectedRoute = () => {
  const { isAuthenticated, role } = useAuthStore();

  const checkRole = (requiredRole) => {
    if (!isAuthenticated || !role) return false;
    return role === requiredRole;
  };

  const checkAnyRole = (requiredRoles) => {
    if (!isAuthenticated || !role) return false;
    return requiredRoles.includes(role);
  };

  // TODO: Add convenience methods when specific roles are available
  // const isAdmin = checkRole('admin');
  // const isManager = checkRole('manager');
  // const isStaff = checkRole('staff');

  // TODO: Add permission checking
  // const checkPermission = (permission) => { ... };
  // const hasPermission = (permission) => { ... };

  return {
    isAuthenticated,
    role,
    checkRole,
    checkAnyRole
    // TODO: Add new methods here
  };
};
