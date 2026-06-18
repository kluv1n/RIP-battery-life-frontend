import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const onnxDist = path.join(rootDir, "node_modules/onnxruntime-web/dist");

function onnxRuntimeStatic(): Plugin {
  const prefix = "/onnx-runtime/";
  const handler = (req: { url?: string }, res: { setHeader: (k: string, v: string) => void; end: (b?: string) => void } & NodeJS.WritableStream, next: () => void) => {
    if (!req.url?.startsWith(prefix)) return next();
    const name = decodeURIComponent(req.url.slice(prefix.length).split("?")[0]);
    if (!/^ort-wasm[\w.-]+\.(wasm|mjs)$/.test(name)) return next();
    const file = path.join(onnxDist, name);
    if (!file.startsWith(onnxDist) || !fs.existsSync(file)) return next();
    if (name.endsWith(".wasm")) res.setHeader("Content-Type", "application/wasm");
    else if (name.endsWith(".mjs")) res.setHeader("Content-Type", "application/javascript");
    fs.createReadStream(file).pipe(res);
  };
  return {
    name: "onnx-runtime-static",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), onnxRuntimeStatic()],
  optimizeDeps: {
    exclude: ["@huggingface/transformers"],
  },
  server: {
    watch: {
      usePolling: true,
    },
    host: true,
    strictPort: true,
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      /** Обратный прокси к MinIO: в Network картинки идут с origin dev-сервера, не с :9000. */
      "/minio": {
        target: "http://localhost:9000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/minio/, "") || "/",
      },
    },
  },
});
