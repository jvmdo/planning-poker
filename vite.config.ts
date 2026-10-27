import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src/client", import.meta.url)) },
  },
  build: { outDir: "dist/client" },
  server: {
    proxy: {
      "/socket.io": { target: "http://localhost:3000", ws: true },
    },
  },
});
