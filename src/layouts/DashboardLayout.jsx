// layouts/DashboardLayout.jsx
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AppSidebar } from '../components/General/Sidebar';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div 
        className={`
          flex-1 flex flex-col
          transition-all duration-300
          ${sidebarOpen ? 'ml-64' : 'ml-0'}
        `}
      >
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
