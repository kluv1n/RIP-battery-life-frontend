/** Ключи localStorage, которые могут дать на защите (в эталоне tauri — основной `rip.apiOrigin`). */
const LS_API_ORIGIN_KEYS = [
  "rip.apiOrigin",
  "apiOrigin",
  "VITE_API_ORIGIN",
  "runtime_api_origin",
] as const;

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeOrigin(value: string | undefined): string {
  if (!value) return "";
  return trimSlash(value.trim());
}

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function getApiOriginFromLocalStorage(): string {
  if (typeof window === "undefined") return "";
  for (const key of LS_API_ORIGIN_KEYS) {
    const origin = normalizeOrigin(window.localStorage.getItem(key) ?? undefined);
    if (isHttpUrl(origin)) return origin;
  }
  return "";
}

/** VITE_API_ORIGIN=http://host:8080 или VITE_API_BASE_URL=http://host:8080/api */
function envApiOrigin(): string {
  const direct = normalizeOrigin(import.meta.env.VITE_API_ORIGIN);
  if (direct) return direct;
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
  if (!base) return "";
  if (base.endsWith("/api")) return normalizeOrigin(base.slice(0, -4));
  return normalizeOrigin(base);
}

/**
 * GitHub Pages: в консоли браузера задают IP бэкенда через localStorage, без пересборки.
 * В `npm run dev` localStorage игнорируется — иначе ломается прокси Vite → localhost:8080.
 */
const localStorageApiOrigin = import.meta.env.DEV ? "" : getApiOriginFromLocalStorage();

export const apiOrigin = localStorageApiOrigin || envApiOrigin();

export const apiBaseUrl = apiOrigin ? `${apiOrigin}/api` : "/api";

export const minioPublicBase =
  normalizeOrigin(import.meta.env.VITE_MINIO_PUBLIC_BASE as string | undefined) ||
  normalizeOrigin(import.meta.env.VITE_MINIO_BASE as string | undefined) ||
  (import.meta.env.DEV ? "/minio/test" : "http://localhost:9000/test");

export const runtimeConfigKeys = {
  apiOriginLocalStorage: LS_API_ORIGIN_KEYS,
} as const;
