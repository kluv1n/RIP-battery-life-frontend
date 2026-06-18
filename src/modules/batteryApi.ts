/** Mock-типы услуг (тип аккумулятора) для лабораторной 5; по смыслу — как в лаб.1 + API курса. */

export interface BatteryServiceMock {
  battery_id: number;
  title: string;
  /** Краткое описание на английском (каталог + CLIP / SigLIP, лаб. 6). */
  short_description_en: string;
  description: string;
  is_deleted: boolean;
  /** Как в шаблоне: имя файла в MinIO или полный URL; при пустом — заглушка. */
  photo_url: string;
  video: string;
  capacity_mah: number;
  voltage_v: number;
  /** Только для фильтров лаб.5 (в карточке каталога не выводится — как в index.html). */
  price_rub: number;
  listed_at: string;
  /** Строки как в battery.html: {{ .currentAStr }}, {{ .runtimeHoursStr }} */
  detail_current_a_str: string;
  detail_runtime_hours_str: string;
}

export interface BatteryLifeCartJSON {
  id?: number;
  has_draft: boolean;
  items_count: number;
}

export interface BatteryLifeHeaderMock {
  battery_life_id: number;
  title: string;
  status: string;
  created_at: string;
  creator_login: string;
  moderator_login?: string | null;
  description?: string | null;
  completed_item_count: number;
  total_runtime_hours: number;
}

export interface BatteryLifeItemDetailJSON {
  battery_life_id: number;
  battery_id: number;
  current_ma: number;
  quantity: number;
  runtime_hours: number | null;
  battery: BatteryServiceMock;
}

export interface BatteryLifeDetailResponse {
  battery_life: BatteryLifeHeaderMock;
  items: BatteryLifeItemDetailJSON[];
}

function minioBase(): string {
  const raw = import.meta.env.VITE_MINIO_BASE as string | undefined;
  return raw?.replace(/\/$/, "") ?? "";
}

/** Как в Gin-шаблоне: http://localhost:9000/test/… */
function mediaBase(): string {
  const raw = import.meta.env.VITE_MEDIA_BASE as string | undefined;
  if (raw?.trim()) return raw.replace(/\/$/, "");
  return "http://localhost:9000/test";
}

export function fallbackImageUrl(): string {
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#d2dde4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#0a3141" font-family="Manrope,Onest,sans-serif" font-size="15" font-weight="600">No photo</text></svg>',
    )
  );
}

/** Полные URL MinIO на localhost:9000 → same-origin `/minio/...` (см. `vite.config` proxy). */
function proxifyMinioDevUrl(url: string): string {
  try {
    const u = new URL(url);
    const port = u.port || (u.protocol === "https:" ? "443" : "80");
    const isMinioDev =
      (u.hostname === "localhost" || u.hostname === "127.0.0.1") && port === "9000";
    if (isMinioDev) return `/minio${u.pathname}${u.search}`;
  } catch {
    /* ignore */
  }
  return url;
}

export function resolveMediaUrl(key: string): string {
  if (!key?.trim()) return fallbackImageUrl();
  if (key.startsWith("blob:") || key.startsWith("data:")) {
    return key;
  }
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return proxifyMinioDevUrl(key);
  }
  if (key.startsWith("/")) {
    return key;
  }
  const baseMinio = minioBase();
  if (baseMinio) {
    return `${baseMinio}/${key.replace(/^\//, "")}`;
  }
  return `${mediaBase()}/${key.replace(/^\//, "")}`;
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
  const text = battery.short_description_en?.trim();
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

function normalizeBattery(
  raw: Partial<BatteryServiceMock> & { id?: number; photo?: string },
): BatteryServiceMock {
  const cap = raw.capacity_mah ?? 0;
  const inferred = inferDetailMetrics(cap);
  const cur = (raw.detail_current_a_str ?? "").trim();
  const run = (raw.detail_runtime_hours_str ?? "").trim();
  return {
    battery_id: raw.battery_id ?? raw.id ?? 0,
    title: raw.title ?? "",
    short_description_en: raw.short_description_en ?? "",
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

export async function listBatteryTypes(params?: { title?: string }): Promise<BatteryServiceMock[]> {
  try {
    let path = "/api/battery_life_types";
    if (params?.title?.trim()) {
      const q = new URLSearchParams();
      q.append("title", params.title.trim());
      path += `?${q.toString()}`;
    }
    const res = await fetch(path, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as BatteryServiceMock[] | BatteryListAPIEnvelope;
    if (Array.isArray(json)) {
      return json.map((item) => normalizeBattery(item));
    }
    return (json.items ?? []).map((item) => normalizeBattery(item));
  } catch {
    return [];
  }
}

/** Составной ответ GET /battery_life_type/:id — как system_load + strategies, только battery_life + items. */
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

export async function getBatteryType(id: number): Promise<BatteryServiceMock | null> {
  try {
    const res = await fetch(`/api/battery_life_type/${id}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return normalizeBattery(unwrapBatteryTypePayload(json));
  } catch {
    return null;
  }
}

/** Gin: `count` и `strategies_count` дублируют число позиций; без логина — `status: "no_draft"`. */
function normalizeCartJson(raw: Record<string, unknown>): BatteryLifeCartJSON {
  const n = (v: unknown) => (typeof v === "number" && !Number.isNaN(v) ? v : Number(v)) || 0;
  const id = typeof raw.id === "number" ? raw.id : raw.id != null ? n(raw.id) : undefined;
  const status = typeof raw.status === "string" ? raw.status : undefined;
  const itemsCount = Math.max(
    n(raw.items_count),
    n(raw.count),
    n(raw.strategies_count),
  );
  let hasDraft = typeof raw.has_draft === "boolean" ? raw.has_draft : undefined;
  if (hasDraft === undefined) {
    if (status === "no_draft") hasDraft = false;
    else if (id != null && id > 0) hasDraft = true;
    else hasDraft = itemsCount > 0;
  }
  return {
    id: id && id > 0 ? id : undefined,
    has_draft: Boolean(hasDraft),
    items_count: itemsCount,
  };
}

export async function getBatteryLifeCart(): Promise<BatteryLifeCartJSON> {
  try {
    const res = await fetch("/api/battery_life/battery_life-cart", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as Record<string, unknown>;
    return normalizeCartJson(json);
  } catch {
    return { has_draft: false, items_count: 0 };
  }
}
