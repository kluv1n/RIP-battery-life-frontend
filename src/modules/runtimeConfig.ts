/** Ключи localStorage (на защите / GitHub Pages / Tauri без пересборки). */
const LS_API_ORIGIN_KEYS = [
  "rip.apiOrigin",
  "apiOrigin",
  "VITE_API_ORIGIN",
  "runtime_api_origin",
] as const;

const LS_MINIO_ORIGIN_KEYS = ["rip.minioOrigin", "minioOrigin", "VITE_MINIO_PUBLIC_BASE"] as const;

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

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function getFirstFromLocalStorage(keys: readonly string[]): string {
  if (typeof window === "undefined") return "";
  for (const key of keys) {
    const value = normalizeOrigin(window.localStorage.getItem(key) ?? undefined);
    if (isHttpUrl(value)) return value;
  }
  return "";
}

function getApiOriginFromLocalStorage(): string {
  return getFirstFromLocalStorage(LS_API_ORIGIN_KEYS);
}

function getMinioOriginFromLocalStorage(): string {
  return getFirstFromLocalStorage(LS_MINIO_ORIGIN_KEYS);
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

function minioOriginFromApiOrigin(api: string): string {
  try {
    const u = new URL(api);
    return `${u.protocol}//${u.hostname}:9000`;
  } catch {
    return "";
  }
}

function minioBaseFromOrigin(origin: string): string {
  const o = normalizeOrigin(origin);
  if (!o) return "";
  if (o.endsWith("/batteries")) return o;
  return `${o}/batteries`;
}

/**
 * GitHub Pages / Tauri release: IP бэкенда через localStorage.
 * В `npm run dev` localStorage игнорируется — иначе ломается прокси Vite → localhost:8080.
 */
const localStorageApiOrigin = import.meta.env.DEV ? "" : getApiOriginFromLocalStorage();
const localStorageMinioOrigin = import.meta.env.DEV ? "" : getMinioOriginFromLocalStorage();

/** Tauri на том же Mac: 127.0.0.1 обходит блокировку LAN в WebView (192.168.x.x). */
function guestPreferLoopbackOrigin(origin: string): string {
  if (!origin || import.meta.env.VITE_GUEST_APP !== "true" || import.meta.env.DEV) return origin;
  if (import.meta.env.VITE_TAURI_USE_LAN_IP === "true") return origin;
  try {
    const u = new URL(origin);
    const port = u.port || (u.protocol === "https:" ? "443" : "80");
    const isPrivate =
      isLoopbackHost(u.hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(u.hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(u.hostname);
    if (isPrivate) return `${u.protocol}//127.0.0.1:${port}`;
  } catch {
    /* ignore */
  }
  return origin;
}

function guestPreferLoopbackHttpUrl(url: string): string {
  if (!url.startsWith("http") || import.meta.env.VITE_GUEST_APP !== "true" || import.meta.env.DEV) {
    return url;
  }
  if (import.meta.env.VITE_TAURI_USE_LAN_IP === "true") return url;
  try {
    const u = new URL(url);
    const port = u.port || (u.protocol === "https:" ? "443" : "80");
    const isPrivate =
      isLoopbackHost(u.hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(u.hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(u.hostname);
    if (isPrivate) return `${u.protocol}//127.0.0.1:${port}${u.pathname}${u.search}`;
  } catch {
    /* ignore */
  }
  return url;
}

const rawApiOrigin = localStorageApiOrigin || envApiOrigin();
export const apiOrigin = guestPreferLoopbackOrigin(rawApiOrigin);

/** Сборка/хост GitHub Pages: только локальный mock (HTTPS не тянет HTTP MinIO с LAN). */
export function isGitHubPagesDeploy(): boolean {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  if (import.meta.env.VITE_GUEST_APP === "true") return false;
  if (base === "/RIP-battery-life-frontend" || base.endsWith("/RIP-battery-life-frontend")) {
    return true;
  }
  if (typeof window !== "undefined") {
    return /(^|\.)github\.io$/i.test(window.location.hostname);
  }
  return import.meta.env.MODE === "pages";
}

/**
 * false на GitHub Pages — mock с `public/mock/battery-default.*`.
 * В `npm run dev` (не guest) — `/api` через прокси Vite.
 * Tauri release: `VITE_API_ORIGIN` в `.env.tauri`.
 */
export const hasRemoteApi =
  !isGitHubPagesDeploy() &&
  (Boolean(apiOrigin) ||
    (import.meta.env.DEV && import.meta.env.VITE_GUEST_APP !== "true"));

export const apiBaseUrl = apiOrigin ? `${apiOrigin}/api` : "/api";

function resolveMinioPublicBase(): string {
  const envMinio =
    normalizeOrigin(import.meta.env.VITE_MINIO_PUBLIC_BASE as string | undefined) ||
    normalizeOrigin(import.meta.env.VITE_MINIO_BASE as string | undefined);

  if (envMinio) {
    if (envMinio.startsWith("/")) return envMinio;
    try {
      const u = new URL(envMinio);
      if (!isLoopbackHost(u.hostname)) {
        return guestPreferLoopbackHttpUrl(minioBaseFromOrigin(u.origin));
      }
    } catch {
      return guestPreferLoopbackHttpUrl(envMinio);
    }
  }

  const lsMinio = localStorageMinioOrigin;
  if (lsMinio) return guestPreferLoopbackHttpUrl(minioBaseFromOrigin(lsMinio));

  if (apiOrigin) {
    const fromApi = minioOriginFromApiOrigin(apiOrigin);
    if (fromApi) return guestPreferLoopbackHttpUrl(minioBaseFromOrigin(fromApi));
  }

  if (import.meta.env.DEV) return "/minio/batteries";

  return "http://localhost:9000/batteries";
}

export const minioPublicBase = resolveMinioPublicBase();

/** Origin MinIO (без пути бакета) для подмены localhost:9000 в URL из API. */
export function minioAbsoluteOrigin(): string {
  const lsMinio = localStorageMinioOrigin;
  if (lsMinio) {
    try {
      return new URL(lsMinio).origin;
    } catch {
      /* ignore */
    }
  }

  if (apiOrigin) {
    const fromApi = minioOriginFromApiOrigin(apiOrigin);
    if (fromApi) return fromApi;
  }

  const base = minioPublicBase;
  if (base.startsWith("http://") || base.startsWith("https://")) {
    try {
      const u = new URL(base);
      if (!isLoopbackHost(u.hostname)) return u.origin;
    } catch {
      /* ignore */
    }
  }

  if (base.startsWith("/minio")) {
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }
    return "";
  }

  return "http://localhost:9000";
}

export const runtimeConfigKeys = {
  apiOriginLocalStorage: LS_API_ORIGIN_KEYS,
  minioOriginLocalStorage: LS_MINIO_ORIGIN_KEYS,
} as const;
