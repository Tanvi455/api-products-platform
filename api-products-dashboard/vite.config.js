
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/api-products-platform/",
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/rate-limit-api": {
        target: "http://127.0.0.1:5002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rate-limit-api/, ""),
      },
      "/grpc-api": {
        target: "http://127.0.0.1:5003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/grpc-api/, ""),
      },
    },
  },
});
