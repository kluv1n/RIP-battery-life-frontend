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

/** Пример запроса к вашему бэкенду (при демонстрации с сервером); карточки в лаб.5 — из mock. */
export async function fetchBatteryTypesByTitle(title?: string): Promise<unknown> {
  const q = title?.trim() ? `?title=${encodeURIComponent(title.trim())}` : "";
  const res = await fetch(`/api/battery_life_types${q}`);
  if (!res.ok) {
    throw new Error(`GET /api/battery_life_types failed: ${res.status}`);
  }
  return res.json();
}
