import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react(), tsconfigPaths()],
    build: {
      // Tăng chunk size warning limit (từ 500KB mặc định)
      chunkSizeWarningLimit: 1500,
      // Manual chunks để tối ưu bundle size
      rollupOptions: {
        output: {
          manualChunks: {
            // Tách vendor libraries thành chunks riêng
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'antd-vendor': ['antd'],
            'utils-vendor': ['axios', 'zustand', 'uuid', 'lucide-react'],
          },
        },
      },
    },
    server: {
      proxy: {
        // API chính (Auth, User, Role, etc.) - Port 7155
        "/api/Auth": {
          target: env.VITE_AUTH_API_URL || "https://localhost:7155",
          changeOrigin: true,
          secure: false,
        },
        "/api/User": {
          target: env.VITE_AUTH_API_URL || "https://localhost:7155",
          changeOrigin: true,
          secure: false,
        },
        "/api/Role": {
          target: env.VITE_AUTH_API_URL || "https://localhost:7155",
          changeOrigin: true,
          secure: false,
        },
          // API MedicalRecord - Port 7157
          "/api/MedicalRecord": {
            target: "https://localhost:7157",
            changeOrigin: true,
            secure: false,
          },
        "/api/EventLog": {
          target: env.VITE_AUTH_API_URL || "https://localhost:7155",
          changeOrigin: true,
          secure: false,
        },
        
        // API PatientInfo - Port 7155
        "/api/PatientInfo": {
          target: env.VITE_AUTH_API_URL || "https://localhost:7155",
          changeOrigin: true,
          secure: false,
        },

        // API Patient - Port 7157
        "/api/Patient": {
          target: "https://localhost:7157",
          changeOrigin: true,
          secure: false,
        },

        // API TestOrder - Port 7157
        "/api/TestOrder": {
          target: env.VITE_PATIENT_API_URL || "https://localhost:7157",
          changeOrigin: true,
          secure: false,
        },

        // API TestResult - Port 7157
        "/api/TestResult": {
          target: env.VITE_PATIENT_API_URL || "https://localhost:7157",
          changeOrigin: true,
          secure: false,
        },

        // API AI Review - Port 7157 (same as TestOrder)
        "/api/ai-review": {
          target: env.VITE_PATIENT_API_URL || "https://localhost:7157",
          changeOrigin: true,
          secure: false,
        },

        // Fallback cho các API còn lại - Port 7155
        "/api": {
          target: env.VITE_AUTH_API_URL || "https://localhost:7155",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});