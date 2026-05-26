import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE_PATH || "/";
  const useHttps = env.VITE_DEV_HTTPS === "true";

  return {
    base,
    plugins: [
      react(),
      ...(useHttps ? [basicSsl()] : []),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["vite.svg", "img/logo.svg"],
        manifest: {
          name: "Battery Life — типы АКБ",
          short_name: "Battery Life",
          description: "Каталог типов аккумуляторов и заявки на расчёт времени работы",
          theme_color: "#0a3141",
          background_color: "#0a3141",
          display: "standalone",
          start_url: base,
          scope: base,
          icons: [
            {
              src: "vite.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          navigateFallback: "index.html",
        },
      }),
    ],
    server: {
      watch: { usePolling: true },
      host: true,
      strictPort: true,
      port: 3000,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
        },
        "/minio": {
          target: env.VITE_MINIO_PROXY_TARGET || "http://localhost:9000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/minio/, "") || "/",
        },
      },
    },
  };
});
