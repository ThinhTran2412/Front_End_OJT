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
        // Proxy tất cả API requests qua Nginx (localhost:80)
        // Nginx sẽ route đến đúng service dựa trên path
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // Keep /api prefix
        },
      },
    },
  };
});