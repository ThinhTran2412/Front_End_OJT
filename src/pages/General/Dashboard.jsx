import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { FileText } from 'lucide-react';

// Import PNG icons
import user_management from '../../assets/icons/user_management.png';
import patient_management from '../../assets/icons/patient_management.png';
import test_orders from '../../assets/icons/test_orders.png';
import reports from '../../assets/icons/reports.png';
import role_management from '../../assets/icons/role_management.png';
import event_logs from '../../assets/icons/event_logs.png';

export default function Dashboard() {
  const navigate = useNavigate();

  const menuItems = [
    { title: 'User Management', description: 'Manage system users', icon: user_management, path: '/users' },
    { title: 'Patient Management', description: 'Manage patients and records', icon: patient_management, path: '/patients' },
    { title: 'Medical Records', description: 'Browse all medical records', iconComponent: FileText, path: '/medical-records' },
    { title: 'Test Orders', description: 'Manage test orders', icon: test_orders, path: '/test-orders' },
    { title: 'Reports', description: 'View system reports', icon: reports, path: '/reports' },
    { title: 'Role Management', description: 'Manage user roles', icon: role_management, path: '/role-management' },
    { title: 'Event Logs', description: 'View system activity logs', icon: event_logs, path: '/event-logs' }
  ];

  const handleNavigate = (path) => navigate(path);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome to Laboratory Management System</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <div
                key={index}
                onClick={() => handleNavigate(item.path)}
                className={`
                  bg-blue-50
                  border border-blue-200 hover:border-blue-300
                  hover:bg-blue-100
                  rounded-lg p-6
                  transition-all duration-200
                  cursor-pointer
                  shadow-sm hover:shadow-md
                  hover:scale-[1.02]
                `}
              >
                <div className="flex items-center">
                  <div className="rounded-lg p-3 bg-white shadow-inner border border-black-100">
                    {item.iconComponent ? (
                      <item.iconComponent className="w-10 h-10 text-blue-600" />
                    ) : (
                      <img
                        src={item.icon}
                        alt={item.title}
                        className="w-10 h-10 object-contain"
                      />
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
