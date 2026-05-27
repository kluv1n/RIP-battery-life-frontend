import axios from "axios";
import { apiBaseUrl, minioAbsoluteOrigin, minioPublicBase } from "./runtimeConfig";
import { shouldUseTauriHttpPlugin, tauriHttpGetJson } from "./tauriHttp";
import type { BatteryServiceMock } from "./batteryApi.types";

export type {
  BatteryLifeCartJSON,
  BatteryLifeDetailResponse,
  BatteryLifeHeaderMock,
  BatteryLifeItemDetailJSON,
  BatteryServiceMock,
} from "./batteryApi.types";

const baseURL = apiBaseUrl;

/** Список и карточка типов АКБ (услуги): только axios, без swagger-клиента. */
export const batteryTypesAxios = axios.create({
  baseURL,
});

batteryTypesAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Ключи MinIO (не http/https/blob/data).
 * В dev — proxy Vite `/minio` → localhost:9000 (см. vite.config.ts).
 */
const MINIO_PUBLIC_BASE =
  (import.meta.env.VITE_MEDIA_BASE?.replace(/\/$/, "") as string | undefined) ?? minioPublicBase;

export function fallbackImageUrl(): string {
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#d2dde4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#0a3141" font-family="Manrope,Onest,sans-serif" font-size="15" font-weight="600">No photo</text></svg>',
    )
  );
}

function encodeStorageKey(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function proxifyMinioDevUrl(url: string): string {
  try {
    const u = new URL(url);
    const port = u.port || (u.protocol === "https:" ? "443" : "80");
    const isLocalMinio =
      (u.hostname === "localhost" || u.hostname === "127.0.0.1") && port === "9000";
    if (!isLocalMinio) return url;

    const pathWithQuery = `${u.pathname}${u.search}`;

    if (import.meta.env.DEV) {
      return `/minio${pathWithQuery}`;
    }

    const origin = minioAbsoluteOrigin();
    if (!origin) return url;
    return `${origin}${pathWithQuery}`;
  } catch {
    /* ignore */
  }
  return url;
}

/** Пути из `public/` (`/mock/...`) — с учётом BASE_URL для GitHub Pages. */
function publicAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalized = path.replace(/^\//, "");
  return `${base}${normalized}`;
}

export function resolveMediaUrl(key: string): string {
  if (!key?.trim()) return fallbackImageUrl();
  if (key.startsWith("blob:") || key.startsWith("data:")) return key;
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return proxifyMinioDevUrl(key);
  }
  if (key.startsWith("/")) {
    return publicAssetUrl(key);
  }
  const normalized = key.replace(/^\//, "");
  return `${MINIO_PUBLIC_BASE}/${encodeStorageKey(normalized)}`;
}

/** Каталог/деталка: фото и видео конкретного типа (API / MinIO / mock). */
export function resolveCatalogPhotoUrl(battery: BatteryServiceMock): string {
  return resolveMediaUrl(battery.photo_url);
}

export function resolveCatalogVideoUrl(battery: BatteryServiceMock): string {
  return resolveMediaUrl(battery.video);
}

function toEnglishClipDescription(input?: string): string {
  const fallback =
    "Rechargeable lithium-based cell or pack with printed safety markings, welded tabs or leads, and clean studio lighting on a neutral background.";
  let text = (input?.trim() || fallback).replace(/\s+/g, " ");
  if (text.length < 80) {
    text = `${text} Visible electrode geometry, shrink-wrap or plastic sleeve, and brand or capacity print typical of OEM battery photography.`;
  }
  if (text.length > 300) {
    text = `${text.slice(0, 297).trimEnd()}...`;
  }
  return text;
}

export function batteryClipDescription(battery: BatteryServiceMock): string {
  const text = battery.short_description?.trim();
  if (text) return toEnglishClipDescription(text);
  return toEnglishClipDescription(
    `${battery.title} battery with ${battery.capacity_mah} mAh nameplate rating; cylindrical or prismatic metal housing and insulated conductor exits suitable for CLIP image–text matching.`,
  );
}

type BatteryListAPIEnvelope = {
  items?: BatteryServiceMock[];
};

function inferDetailMetrics(capacityMah: number): { currentAStr: string; runtimeHStr: string } {
  if (!capacityMah || capacityMah <= 0) return { currentAStr: "0.50", runtimeHStr: "0" };
  const currentMa = Math.min(8000, Math.max(150, Math.round(capacityMah / 7)));
  const hours = capacityMah / currentMa;
  const a = currentMa / 1000;
  return {
    currentAStr: a >= 10 ? a.toFixed(1) : a.toFixed(2),
    runtimeHStr: hours >= 100 ? hours.toFixed(0) : hours.toFixed(2),
  };
}

export function normalizeBattery(
  raw: Partial<BatteryServiceMock> & { id?: number; photo?: string },
): BatteryServiceMock {
  const cap = raw.capacity_mah ?? 0;
  const inferred = inferDetailMetrics(cap);
  const cur = (raw.detail_current_a_str ?? "").trim();
  const run = (raw.detail_runtime_hours_str ?? "").trim();
  return {
    battery_id: raw.battery_id ?? raw.id ?? 0,
    title: raw.title ?? "",
    short_description: raw.short_description ?? "",
    description: raw.description ?? "",
    is_deleted: Boolean(raw.is_deleted),
    photo_url: raw.photo_url ?? raw.photo ?? "",
    video: raw.video ?? "",
    capacity_mah: cap,
    voltage_v: raw.voltage_v ?? 0,
    price_rub: raw.price_rub ?? 0,
    listed_at: raw.listed_at ?? "",
    detail_current_a_str: cur || inferred.currentAStr,
    detail_runtime_hours_str: run || inferred.runtimeHStr,
  };
}

function unwrapBatteryTypePayload(
  json: unknown,
): Partial<BatteryServiceMock> & { id?: number; photo?: string } {
  if (!json || typeof json !== "object") return { id: 0 };
  const o = json as Record<string, unknown>;
  const inner = o.battery_type;
  if (inner != null && typeof inner === "object") {
    return inner as Partial<BatteryServiceMock> & { id?: number; photo?: string };
  }
  return json as Partial<BatteryServiceMock> & { id?: number; photo?: string };
}

function mapListResponse(data: BatteryServiceMock[] | BatteryListAPIEnvelope | undefined): BatteryServiceMock[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map((item) => normalizeBattery(item));
  }
  return (data.items ?? []).map((item) => normalizeBattery(item));
}

function formatApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const code = err.code ?? "ERR";
    const msg = err.message || "Network error";
    return status ? `${msg} (HTTP ${status})` : `${msg} (${code})`;
  }
  return err instanceof Error ? err.message : String(err);
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function absoluteApiUrl(path: string, params?: { title?: string }): string {
  const base = apiBaseUrl.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${suffix}`);
  if (params?.title) url.searchParams.set("title", params.title);
  return url.toString();
}

async function batteryTypesGet<T>(path: string, params?: { title?: string }): Promise<T> {
  if (shouldUseTauriHttpPlugin()) {
    return tauriHttpGetJson<T>(absoluteApiUrl(path, params), authHeaders());
  }
  const r = await batteryTypesAxios.get<T>(path, {
    params: params?.title ? { title: params.title } : undefined,
    headers: { Accept: "application/json", ...authHeaders() },
  });
  return r.data;
}

export type ListBatteryTypesResult =
  | { ok: true; items: BatteryServiceMock[] }
  | { ok: false; error: string };

export async function listBatteryTypesWithMeta(
  params?: { title?: string },
): Promise<ListBatteryTypesResult> {
  try {
    const data = await batteryTypesGet<BatteryServiceMock[] | BatteryListAPIEnvelope>(
      "/battery_life_types",
      params,
    );
    return { ok: true, items: mapListResponse(data) };
  } catch (err) {
    return { ok: false, error: formatApiError(err) };
  }
}

/** @deprecated Prefer listBatteryTypesWithMeta — пустой массив скрывал ошибку сети. */
export async function listBatteryTypes(params?: { title?: string }): Promise<BatteryServiceMock[]> {
  const result = await listBatteryTypesWithMeta(params);
  return result.ok ? result.items : [];
}

export async function getBatteryType(id: number): Promise<BatteryServiceMock | null> {
  try {
    const data = await batteryTypesGet<unknown>(`/battery_life_type/${id}`);
    return normalizeBattery(unwrapBatteryTypePayload(data));
  } catch {
    return null;
  }
}
