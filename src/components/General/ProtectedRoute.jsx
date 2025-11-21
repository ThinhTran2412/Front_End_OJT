// src/components/General/ProtectedRoute.jsx
import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function ProtectedRoute({
  children,
  isAllowed = null,
  redirectPath = "/login",
  requiredPrivileges = [],
  requireAll = false,
}) {
  const navigate = useNavigate();
  const { isAuthenticated, initializeAuth } = useAuthStore();

  // helper decode JWT
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  // Initialize auth once when route mounts
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Check token first
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!accessToken || !refreshToken) {
    return <Navigate to={redirectPath} replace />;
  }

  // If parent component passes isAllowed
  if (isAllowed !== null && !isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            You don’t have permission to access this page.
          </h2>
          <button
            onClick={() => navigate(redirectPath)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // If store hasn't finished authentication then show loading
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Check privileges if route requires them
  if (Array.isArray(requiredPrivileges) && requiredPrivileges.length > 0) {
    const payload = accessToken ? decodeJWT(accessToken) : null;

    let jwtPrivileges =
      payload?.privilege ||
      payload?.privileges ||
      payload?.Privilege ||
      payload?.Privileges ||
      payload?.claims?.privilege ||
      payload?.claims?.privileges ||
      [];

    if (typeof jwtPrivileges === "string") jwtPrivileges = [jwtPrivileges];
    if (!Array.isArray(jwtPrivileges)) jwtPrivileges = [];

    const hasAccess = requireAll
      ? requiredPrivileges.every((p) => jwtPrivileges.includes(p))
      : requiredPrivileges.some((p) => jwtPrivileges.includes(p));

    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              You don’t have permission to access this page.
            </h2>
            <p className="text-gray-600 mb-4">
              Please contact an administrator if you think this is an error.
            </p>
            <button
              onClick={() => navigate(redirectPath)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // All conditions met → render
  return children;
}
