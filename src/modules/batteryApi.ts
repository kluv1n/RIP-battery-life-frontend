/** Mock-типы услуг (тип аккумулятора) для лабораторной 5; по смыслу — как в лаб.1 + API курса. */

export interface BatteryServiceMock {
  battery_id: number;
  title: string;
  short_description: string;
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
  /** Короткое описание на английском для CLIP (50-100 символов). */
  short_description_en?: string;
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
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#d2dde4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#0a3141" font-family="Manrope,Onest,sans-serif" font-size="15" font-weight="600">Нет фото</text></svg>',
    )
  );
}

export function resolveMediaUrl(key: string): string {
  if (!key?.trim()) return fallbackImageUrl();
  if (
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/") ||
    key.startsWith("blob:") ||
    key.startsWith("data:")
  ) {
    return key;
  }
  const baseMinio = minioBase();
  if (baseMinio) {
    return `${baseMinio}/${key.replace(/^\//, "")}`;
  }
  return `${mediaBase()}/${key.replace(/^\//, "")}`;
}

function toEnglishClipDescription(input?: string): string {
  const fallback = "Rechargeable battery for portable electronics and stable daily mobile operation.";
  const text = (input?.trim() || fallback).replace(/\s+/g, " ");
  if (text.length >= 50 && text.length <= 100) return text;
  if (text.length < 50) return `${text} Works for mixed home and travel usage scenarios.`;
  return text.slice(0, 100).trimEnd();
}

export function batteryClipDescription(battery: BatteryServiceMock): string {
  const ready = battery.short_description_en?.trim();
  if (ready) return toEnglishClipDescription(ready);
  return toEnglishClipDescription(
    `${battery.title} battery with ${battery.capacity_mah}mAh capacity for practical device power tasks.`,
  );
}

type BatteryListAPIEnvelope = {
  items?: BatteryServiceMock[];
};

function normalizeBattery(
  raw: Partial<BatteryServiceMock> & { id?: number; photo?: string },
): BatteryServiceMock {
  return {
    battery_id: raw.battery_id ?? raw.id ?? 0,
    title: raw.title ?? "",
    short_description: raw.short_description ?? "",
    description: raw.description ?? "",
    is_deleted: Boolean(raw.is_deleted),
    photo_url: raw.photo_url ?? raw.photo ?? "",
    video: raw.video ?? "",
    capacity_mah: raw.capacity_mah ?? 0,
    voltage_v: raw.voltage_v ?? 0,
    price_rub: raw.price_rub ?? 0,
    listed_at: raw.listed_at ?? "",
    detail_current_a_str: raw.detail_current_a_str ?? "",
    detail_runtime_hours_str: raw.detail_runtime_hours_str ?? "",
    short_description_en: raw.short_description_en,
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

export async function getBatteryType(id: number): Promise<BatteryServiceMock | null> {
  try {
    const res = await fetch(`/api/battery_life_type/${id}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as Partial<BatteryServiceMock> & { id?: number };
    return normalizeBattery(json);
  } catch {
    return null;
  }
}

export async function getBatteryLifeCart(): Promise<BatteryLifeCartJSON> {
  try {
    const res = await fetch("/api/battery_life/battery_life-cart", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      id?: number;
      count?: number;
      strategies_count?: number;
      status?: string;
      has_draft?: boolean;
      items_count?: number;
    };
    const fromLegacy = json.items_count ?? json.count ?? json.strategies_count ?? 0;
    const hasDraft = json.has_draft ?? (json.status !== "no_draft" && json.id != null);
    return {
      id: json.id,
      has_draft: Boolean(hasDraft),
      items_count: fromLegacy,
    };
  } catch {
    return { has_draft: false, items_count: 0 };
  }
}
