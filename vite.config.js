import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), tailwind()],
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    server: env.VITE_FIREBASE_EMULATORS === "true"
      ? { proxy: { "/api": { target: "http://127.0.0.1:5500", changeOrigin: true } } }
      : undefined,
  };
});
