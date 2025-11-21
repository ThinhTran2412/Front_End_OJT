import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // Keep unchanged to not affect old logic
import AppRouter from "./routes/App_Route.jsx"; // Add router
import "./index.css";
import "antd/dist/reset.css";
import { useAuthStore } from "./store/authStore";

// Initialize auth store when app starts
useAuthStore.getState().initializeAuth();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* App still wraps to not affect Context, Layout, Theme... */}
    <App>
      <AppRouter />
    </App>
  </React.StrictMode>
);
