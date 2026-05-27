import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import basicSsl from "@vitejs/plugin-basic-ssl";

/** GitHub Pages: только web manifest, без service worker (иначе кэш и падение на ort-wasm). */
function pagesManifestOnlyPlugin(
  manifest: Record<string, unknown>,
  basePath: string,
): Plugin {
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const manifestHref = `${base}manifest.webmanifest`;
  return {
    name: "pages-manifest-only",
    apply: "build",
    transformIndexHtml(html) {
      if (html.includes('rel="manifest"')) return html;
      return html.replace(
        "</head>",
        `  <link rel="manifest" href="${manifestHref}" />\n  </head>`,
      );
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "manifest.webmanifest",
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isGuestApp = env.VITE_GUEST_APP === "true";
  const isPagesBuild = mode === "pages";
  /** Tauri и dev:guest всегда корень `/`. Pages — VITE_BASE_PATH из .env */
  const base = isGuestApp ? "/" : env.VITE_BASE_PATH || "/";
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`;
  const useHttps = env.VITE_DEV_HTTPS === "true";

  const pwaManifest = {
    name: "Battery Life — типы АКБ",
    short_name: "Battery Life",
    description: "Каталог типов аккумуляторов и заявки на расчёт времени работы",
    theme_color: "#0a3141",
    background_color: "#0a3141",
    display: "standalone" as const,
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
  };

  return {
    base,
    plugins: [
      react(),
      ...(useHttps ? [basicSsl()] : []),
      ...(isGuestApp
        ? []
        : isPagesBuild
          ? [pagesManifestOnlyPlugin(pwaManifest, base)]
          : [
              VitePWA({
                registerType: "autoUpdate",
                includeAssets: ["vite.svg", "img/logo.svg"],
                manifest: pwaManifest,
                workbox: {
                  globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
                  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                  navigateFallback: `${baseWithSlash}index.html`,
                  navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
                },
              }),
            ]),
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
