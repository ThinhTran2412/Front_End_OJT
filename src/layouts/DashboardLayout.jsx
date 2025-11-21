// layouts/DashboardLayout.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../components/General/Sidebar';
import Header from '../components/General/header';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Ensure sidebar is opened by default on every mount
  useEffect(() => {
    setSidebarOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto pt-20">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
