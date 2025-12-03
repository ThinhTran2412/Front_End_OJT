import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";


// Pages
import Home from "../pages/General/Home";
import About from "../pages/General/About";
import Login from "../pages/General/Login";
import Register from "../pages/General/Register";
import CreateUser from "../pages/General/CreateUser";
import Profile from "../pages/General/Profile";
import Dashboard from "../pages/General/Dashboard";
import ForgotPassword from "../pages/General/ForgotPassword";
import ResetPassword from "../pages/General/ResetPassword";
import EventLogs from "../components/Event_Logs/EventLogs";
import RoleManagement from "../pages/Role_Management/RoleManagement";
import CreateRolePage from "../pages/Role_Management/CreateRolePage.jsx";
import UpdateRolePage from "../pages/Role_Management/UpdateRolePage.jsx";
import PatientManagementPage from "../pages/Patient/PatientManagementPage";
import PatientMedicalRecordDetailPage from "../pages/Patient/PatientMedicalRecordDetailPage";
import MyPatientPage from "../pages/Patient/MyPatientPage";
import TestOrderPage from "../pages/TestOrder/TestOrderPage";
import CreateTestOrderPage from "../pages/TestOrder/CreateTestOrderPage";
import MedicalRecordListPage from "../pages/MedicalRecord/MedicalRecordListPage";
import FlaggingConfigPage from "../pages/Configuration_Management/FlaggingConfigPage";

import UserManagement from "../pages/General/UserManagementPage";

// Protected route
import ProtectedRoute from "../components/General/ProtectedRoute";

// Router configuration
const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/home" replace /> },
  { path: "/home", element: <Home /> },
  { path: "/about", element: <About /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/create-user", element: <CreateUser /> },
  { path: "/profile", element: <Profile /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },

  {
    path: "/my-patient",
    element: (
      <ProtectedRoute>
        <MyPatientPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute requiredPrivileges={["VIEW_USER"]}>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/event-logs",
    element: (
      <ProtectedRoute requiredPrivileges={["VIEW_EVENT_LOGS"]}>
        <EventLogs />
      </ProtectedRoute>
    ),
  },

  // Role Management - Specific routes must be placed before general routes
  {
    path: "/role-management/create",
    element: (
      <ProtectedRoute>
        <CreateRolePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/role-management/update/:id",
    element: (
      <ProtectedRoute>
        <UpdateRolePage />
      </ProtectedRoute>
    ),
    errorElement: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Update Role Page</h2>
          <p className="text-gray-600 mb-4">Something went wrong. Please try again.</p>
          <button 
            onClick={() => window.location.href = '/role-management'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Role Management
          </button>
        </div>
      </div>
    ),
  },
  {
    path: "/role-management",
    element: (
      <ProtectedRoute requiredPrivileges={["VIEW_ROLE"]}>
        <RoleManagement />
      </ProtectedRoute>
    ),
  },
  
  {
    path: "/role-management/create",
    element: (
      <ProtectedRoute requiredPrivileges={["VIEW_ROLE"]}>
        <CreateRolePage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/users",
    element: (
      <ProtectedRoute requiredPrivileges={["VIEW_USER"]}>
        <UserManagement />
      </ProtectedRoute>
    ),
  },

  {
    path: "/patients",
    element: (
      <ProtectedRoute requiredPrivileges={["VIEW_USER"]}>
        <PatientManagementPage />
      </ProtectedRoute>
    ),
  },
  
  {
    path: "/patients/:patientId/medical-records",
    element: (
      <ProtectedRoute>
        <PatientMedicalRecordDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/medical-records",
    element: (
      <ProtectedRoute>
        <MedicalRecordListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/test-orders",
    element: (
      <ProtectedRoute requiredPrivileges={["VIEW_USER"]}>
        <TestOrderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/test-orders/create",
    element: (
      <ProtectedRoute requiredPrivileges={["CREATE_TEST_ORDER"]}>
        <CreateTestOrderPage />
      </ProtectedRoute>
    ),
    errorElement: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Create Test Order Page</h2>
          <p className="text-gray-600 mb-4">Something went wrong. Please try again.</p>
          <button 
            onClick={() => window.location.href = '/test-orders'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Test Orders
          </button>
        </div>
      </div>
    ),
  },
  {
    path: "/flagging-config",
    element: (
      <ProtectedRoute requiredPrivileges={["VIEW_CONFIGURATION"]}>
        <FlaggingConfigPage />
      </ProtectedRoute>
    ),
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}