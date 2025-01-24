/**
 * @file vite.config.ts
 * Last updated: 2025-01-24 07:35:46
 * Author: jake1318
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: {
    // If you want any specific CSS options
    devSourcemap: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@mysten/dapp-kit",
          ],
          utils: ["./src/utils"],
          components: ["./src/components"],
        },
      },
    },
  },
});
