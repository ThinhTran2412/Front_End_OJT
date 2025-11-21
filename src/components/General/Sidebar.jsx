import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import api from '../../services/api';
import { ClipboardList, FileText } from 'lucide-react';

// Import PNG icons
import user_icon from '../../assets/icons/user_icon.png';
import dashboard_icon from '../../assets/icons/dashboard_icon.png';
import create_user_icon from '../../assets/icons/create_user_icon.png';
import role_management_icon from '../../assets/icons/role_management_icon.png';
import create_role_icon from '../../assets/icons/create_role_icon.png';
import event_logs_icon from '../../assets/icons/event_logs_icon.png';
import user_management_icon from '../../assets/icons/user_management_icon.png';
import patient_management_icon from '../../assets/icons/patient_management.png';
import logout_icon from '../../assets/icons/logout_icon.png';

// Decode JWT function (safe & fallback)
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

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, accessToken, refreshToken } = useAuthStore();
  const { role } = useProtectedRoute();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Decode JWT to get privileges and email
  const tokenPayload =
    accessToken && typeof accessToken === 'string' && accessToken.includes('.')
      ? decodeJWT(accessToken)
      : null;

  const jwtEmail = tokenPayload?.email || tokenPayload?.Email || null;
  const storedUserRaw = localStorage.getItem('user');
  const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  const parsedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  const displayEmail = jwtEmail || user?.email || storedUser?.email || 'No email';

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

  // Logout confirm handler
  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      const token = refreshToken || localStorage.getItem('refreshToken');
      if (token) await api.post('/Auth/logout', { refreshToken: token });
    } catch (e) {
      console.warn('Logout API failed, continuing local logout...');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      logout();
      navigate('/login');
    }
  };

  const handleMenuClick = (menu) => {
    switch (menu) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'create-user':
        navigate('/create-user');
        break;
      case 'create-role':
        navigate('/role-management/create');
        break;
      case 'role-management':
        navigate('/role-management');
        break;
      case 'event-logs':
        navigate('/event-logs');
        break;
      case 'test-orders':
        navigate('/test-orders');
        break;
      case 'create-test-order':
        navigate('/test-orders/create');
        break;
      case 'user-management':
        navigate('/users');
        break;
      case 'patient-management':
        navigate('/patients');
        break;
      default:
        break;
    }
  };

  // Menu items configuration
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: dashboard_icon, path: '/dashboard', requiredPrivilege: null },
    { id: 'profile', label: 'Profile', icon: user_icon, path: '/profile', requiredPrivilege: null },
    { id: 'patient-management', label: 'Patient Management', icon: patient_management_icon, path: '/patients', requiredPrivilege: 'VIEW_USER' },
    { id: 'user-management', label: 'User Management', icon: user_management_icon, path: '/users', requiredPrivilege: 'VIEW_USER' },
    { id: 'create-user', label: 'Create User', icon: create_user_icon, path: '/create-user', requiredPrivilege: 'CREATE_USER' },
    { id: 'medical-records', label: 'Medical Records', isLucideIcon: true, icon: FileText, path: '/medical-records', requiredPrivilege: 'VIEW_USER' },
    { id: 'test-orders', label: 'Test Orders', isLucideIcon: true, icon: ClipboardList, path: '/test-orders', requiredPrivilege: 'VIEW_TEST_ORDER' },
    { id: 'role-management', label: 'Role Management', icon: role_management_icon, path: '/role-management', requiredPrivilege: 'VIEW_ROLE' },
    { id: 'create-role', label: 'Create Role', icon: create_role_icon, path: '/role-management/create', requiredPrivilege: 'CREATE_ROLE' },
    { id: 'event-logs', label: 'Event Logs', icon: event_logs_icon, path: '/event-logs', requiredPrivilege: 'VIEW_EVENT_LOGS' },
  ];

  const menuItems = allMenuItems.filter((item) => {
    // If item should only show for regular users (not admin), check role
    if (item.showOnlyForUsers && isAdmin) {
      return false;
    }
    // If item requires privilege, check if user has it
    if (item.requiredPrivilege) {
      return userPrivileges.includes(item.requiredPrivilege);
    }
    // Otherwise, show the item
    return true;
  });

  const isActive = (path) => location.pathname === path;

  // Render
  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-blue-900 transition-all duration-300 flex flex-col overflow-hidden fixed left-0 top-0 h-screen z-40`}>
      {/* User Info */}
      <div className={`p-6 border-b border-blue-800 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="text-white">
          <div className="w-full rounded-lg bg-white/15 border border-white/30 p-2.5 shadow-sm">
            <div className="flex items-center min-w-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white/20 text-white mr-2.5 flex-shrink-0">
                <img src={user_icon} alt="user" className="w-4 h-4 filter brightness-0 invert" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-blue-100">Signed in</div>
                <div className="mt-0.5 text-white text-base font-semibold leading-tight truncate" title={displayEmail}>
                  {displayEmail}
                </div>
              </div>
            </div>
          </div>
          {role && <div className="text-xs text-blue-300 mt-2">Role: {role}</div>}
        </div>
      </div>

      {/* Menu */}
      <nav className={`flex-1 p-4 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                  isActive(item.path) ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}
              >
                {item.isLucideIcon ? (
                  <item.icon className="w-5 h-5 mr-3" />
                ) : (
                  <img src={item.icon} alt={item.label} className="w-5 h-5 mr-3 filter brightness-0 invert" />
                )}
                <span className={sidebarOpen ? 'block' : 'hidden'}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className={`p-4 border-t border-blue-800 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-left text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm hover:shadow-md hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all duration-200"
        >
          <img src={logout_icon} alt="logout" className="w-5 h-5 mr-3 filter brightness-0 invert" />
          <span className={sidebarOpen ? 'block' : 'hidden'}>Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isLoggingOut && setShowLogoutModal(false)} />
          <div className="relative z-10 w-full max-w-md mx-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-5">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Sign out</h3>
                </div>
                <p className="mt-3 text-sm text-gray-600">Are you sure you want to log out? You will need to sign in again to access your dashboard.</p>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3">
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
    </div>
  );
}
