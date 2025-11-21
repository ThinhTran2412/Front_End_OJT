// components/General/Header.jsx
import { useAuthStore } from '../../store/authStore';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import logoImg from '../../assets/icons/logo.png';

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { user } = useAuthStore();
  const { role } = useProtectedRoute();

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 fixed top-0 right-0 z-30 ${sidebarOpen ? 'left-64' : 'left-0'}`}>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className={`w-6 h-6 transition-transform duration-300 ${sidebarOpen ? 'rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Logo + Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded flex items-center justify-center">
              <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-xl font-bold text-gray-900">Laboratory Management</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {role && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {role}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
