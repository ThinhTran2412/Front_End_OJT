import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import api from '../../services/api';
import { ChevronRight, User, LogOut, Menu } from 'lucide-react';
import logoImg from '../../assets/icons/logo.png';
import user_icon from '../../assets/icons/user_icon.png';
import avatarImg from '../../assets/images/Avatar.png';

// Decode JWT function
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export function AppSidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, accessToken, refreshToken } = useAuthStore();
  const { role } = useProtectedRoute();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userPanelOpen, setUserPanelOpen] = useState(false);

  // Decode JWT to get privileges and email
  const tokenPayload =
    accessToken && typeof accessToken === 'string' && accessToken.includes('.')
      ? decodeJWT(accessToken)
      : null;

  // Debug JWT payload
  console.log('Sidebar JWT Debug:');
  console.log('Token payload:', tokenPayload);
  console.log('JWT name field:', tokenPayload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']);
  console.log('JWT email:', tokenPayload?.email);

  const jwtEmail = tokenPayload?.email || tokenPayload?.Email || null;
  
  // Get name from JWT - it's in the claims field
  const jwtName = tokenPayload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
                  tokenPayload?.name || 
                  tokenPayload?.Name || 
                  null;
  
  const storedUserRaw = localStorage.getItem('user');
  const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  const parsedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  const displayEmail = jwtEmail || user?.email || storedUser?.email || 'No email';
  const displayName = jwtName || user?.name || storedUser?.name || parsedUser?.name || 'User';

  // Get role ID to check if user is admin (roleId = 1)
  const roleId = tokenPayload?.roleId || 
                 tokenPayload?.RoleId || 
                 parsedUser?.roleId || 
                 parsedUser?.RoleId || 
                 user?.roleId || 
                 user?.RoleId || 
                 null;
  const isAdmin = roleId === 1 || roleId === '1';

  const jwtPrivileges =
    tokenPayload?.privilege ||
    tokenPayload?.privileges ||
    tokenPayload?.Privilege ||
    tokenPayload?.Privileges ||
    [];

  const localStoragePrivileges = parsedUser?.privileges || [];

  let userPrivileges =
    jwtPrivileges && jwtPrivileges.length > 0 ? jwtPrivileges : localStoragePrivileges;

  if (typeof userPrivileges === 'string') userPrivileges = [userPrivileges];
  if (!Array.isArray(userPrivileges)) userPrivileges = [];

  const hasViewUserPrivilege = userPrivileges.includes('VIEW_USER');
  const hasManagementPrivilege = [
    'VIEW_ROLE',
    'VIEW_CONFIGURATION',
    'VIEW_EVENT_LOGS',
    'CREATE_TEST_ORDER'
  ].some((p) => userPrivileges.includes(p));

  // Default user: no management/view privileges -> only see own medical records (readonly)
  const isDefaultUser = !hasViewUserPrivilege && !hasManagementPrivilege;

  // Logout confirm handler
  const handleLogout = () => setShowLogoutModal(true);
  
  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Lấy refreshToken từ localStorage (nguồn chính thống)
      const token = localStorage.getItem('refreshToken');
      
      if (token) {
        // Gọi API logout với refreshToken
        await api.post('/Auth/logout', { refreshToken: token });
      }
    } catch (e) {
      console.warn('Logout API failed, continuing local logout...', e);
    } finally {
      // Dù API có lỗi hay không, vẫn clear local state
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      setUserPanelOpen(false);
      
      // Clear localStorage trước
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear Zustand store
      logout();
      
      // Navigate về login
      navigate('/login');
    }
  };

  // Menu items configuration
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', requiredPrivilege: null },
    { id: 'patient-management', label: 'Patient Management', path: '/patients', requiredPrivilege: 'VIEW_USER' },
    { id: 'user-management', label: 'User Management', path: '/users', requiredPrivilege: 'VIEW_USER' },
    { id: 'medical-records', label: 'Medical Records', path: '/medical-records', requiredPrivilege: 'VIEW_USER' },
    { id: 'test-orders', label: 'Test Order Management', path: '/test-orders', requiredPrivilege: 'VIEW_USER' },
    { id: 'flagging-config', label: 'Flagging Configuration', path: '/flagging-config', requiredPrivilege: 'VIEW_CONFIGURATION' },
    { id: 'role-management', label: 'Role Management', path: '/role-management', requiredPrivilege: 'VIEW_ROLE' },
    { id: 'event-logs', label: 'Event Logs', path: '/event-logs', requiredPrivilege: 'VIEW_EVENT_LOGS' },
  ];

  // Filter menu items based on privileges
  const menuItems = isDefaultUser
    ? allMenuItems.filter((item) => item.id === 'medical-records')
    : allMenuItems.filter((item) => {
        if (item.showOnlyForUsers && isAdmin) {
          return false;
        }
        if (item.requiredPrivilege) {
          return userPrivileges.includes(item.requiredPrivilege);
        }
        return true;
      });

  // Check if path is active
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen z-40
          bg-white/80 backdrop-blur-xl border-r border-gray-200
          text-gray-900
          transition-all duration-300 ease-in-out
          flex flex-col
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'}
          overflow-visible
          shadow-lg
        `}
      >
        {/* Header with Laboratory name and logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 min-h-[64px]">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img 
              src={logoImg} 
              alt="Laboratory" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold text-gray-900">
              Laboratory
            </span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Content */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
              Main Menu
            </div>
            <div className="space-y-0.5">
              {menuItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-md
                      transition-all duration-200
                      text-left
                      ${active 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <span className="text-sm">{item.label}</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer with User Panel */}
        <div className="border-t border-gray-200 relative z-50 overflow-visible">
          {/* User Panel Toggle */}
          <button
            onClick={() => setUserPanelOpen(!userPanelOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 mb-[10px] hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-[10px] overflow-hidden flex-shrink-0 shadow-sm">
              <img 
                src={avatarImg} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 truncate" title={displayEmail}>
                {displayEmail}
              </div>
            </div>
            <ChevronRight 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                userPanelOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Expanded User Panel - Opens to the right */}
          {userPanelOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-[45] bg-transparent"
                onClick={() => setUserPanelOpen(false)}
              />
              
              {/* Panel */}
              <div 
                className="
                  absolute left-full bottom-0 mb-[10px] ml-2 w-64
                  bg-white/95 backdrop-blur-xl 
                  border border-gray-200 
                  shadow-2xl 
                  rounded-lg 
                  overflow-hidden
                  z-[60]
                "
                style={{
                  animation: 'slideInLeft 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* User Info in Panel */}
                <div className="px-4 py-3 border-b border-gray-200 bg-white/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] overflow-hidden flex-shrink-0 shadow-sm">
                      <img 
                        src={avatarImg} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {displayName}
                      </div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-1.5" title={displayEmail}>
                        {displayEmail}
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel Menu Items */}
                <div className="py-1 bg-white/50">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setUserPanelOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-left group"
                  >
                    <User className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 text-left group"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Log out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => !isLoggingOut && setShowLogoutModal(false)} 
          />
          <div className="relative z-10 w-full max-w-md mx-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-5">
                <h3 className="text-lg font-semibold text-gray-900">Sign out</h3>
                <p className="mt-3 text-sm text-gray-600">
                  Are you sure you want to log out? You will need to sign in again to access your dashboard.
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? 'Logging out...' : 'Log out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}