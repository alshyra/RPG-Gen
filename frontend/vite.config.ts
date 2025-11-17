import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [tailwindcss(), vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 80,
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL || "http://backend:3001",
        changeOrigin: true,
      },
    },
  },
});
