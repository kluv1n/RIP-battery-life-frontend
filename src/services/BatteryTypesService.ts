import axios, { type AxiosInstance } from "axios";
import type { BatteryServiceMock } from "../modules/batteryApi.types";

type BatteryListAPIEnvelope = {
  items?: BatteryServiceMock[];
};

type BatteryListQuery = {
  title?: string;
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

function mapListResponse(
  data: BatteryServiceMock[] | BatteryListAPIEnvelope | undefined,
): BatteryServiceMock[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map((item) => normalizeBattery(item));
  }
  return (data.items ?? []).map((item) => normalizeBattery(item));
}

/**
 * Service Layer — слой сервисов для домена «услуги» (типы аккумулятора).
 *
 * Отдельно от заявки (battery_life): здесь только axios, без swagger-codegen и без Redux thunk.
 * Страницы `ServicesPage` / `ServicePage` вызывают методы сервиса, а не HTTP напрямую.
 *
 * @see commit c52738e — UI-имена Service* (каталог услуг)
 * @see Lecture 9 — паттерн Service Layer между UI и API
 */
export class BatteryTypesService {
  private readonly http: AxiosInstance;

  constructor(http: AxiosInstance) {
    this.http = http;
  }

  /** GET /api/battery_life_types — список услуг каталога. */
  async list(query?: BatteryListQuery): Promise<BatteryServiceMock[]> {
    try {
      const r = await this.http.get<BatteryServiceMock[] | BatteryListAPIEnvelope>(
        "/battery_life_types",
        {
          params: query?.title?.trim() ? { title: query.title.trim() } : undefined,
          headers: { Accept: "application/json" },
        },
      );
      return mapListResponse(r.data);
    } catch {
      return [];
    }
  }

  /** GET /api/battery_life_type/:id — одна услуга. */
  async getById(id: number): Promise<BatteryServiceMock | null> {
    try {
      const r = await this.http.get<unknown>(`/battery_life_type/${id}`, {
        headers: { Accept: "application/json" },
      });
      const normalized = normalizeBattery(unwrapBatteryTypePayload(r.data));
      return normalized.battery_id > 0 ? normalized : null;
    } catch {
      return null;
    }
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/** Singleton: один экземпляр сервиса на всё приложение. */
export const batteryTypesService = new BatteryTypesService(
  axios.create({
    baseURL,
    headers: { Accept: "application/json" },
  }),
);
