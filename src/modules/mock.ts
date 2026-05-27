import type {
  BatteryLifeCartJSON,
  BatteryLifeDetailResponse,
  BatteryServiceMock,
} from "./batteryApi.types";
import { GUEST_CATALOG_VIDEO } from "./catalogMedia";

/** Фолбэк-постер, если у типа нет фото. */
export const MOCK_COVER = "/mock/battery-default.jpg";
export const MOCK_VIDEO = GUEST_CATALOG_VIDEO;

/** Браузер: своё фото/видео на тип (MinIO в dev, svg на Pages без API). */
const BROWSER_MOCK_MEDIA = [
  { photo: "li_ion.jpg", video: "li_ion.mp4" },
  { photo: "li_po.jpg", video: "li_po.mp4" },
  { photo: "Li_fe_po.jpg", video: "Li_fe_po.mp4" },
  { photo: "ni_mh.jpg", video: "ni_mh.mp4" },
] as const;

/** Телефон / GitHub Pages: одно фото и одно видео из `public/mock/`. */
const PAGES_DEMO_MEDIA = { photo: MOCK_COVER, video: MOCK_VIDEO } as const;

function mockMediaForIndex(index: number): { photo: string; video: string } {
  /** Tauri и dev: ключи MinIO (свои фото/видео на тип). */
  if (import.meta.env.VITE_GUEST_APP === "true" || import.meta.env.DEV) {
    return BROWSER_MOCK_MEDIA[index] ?? BROWSER_MOCK_MEDIA[0];
  }
  return PAGES_DEMO_MEDIA;
}

/** Four catalog items; card layout matches templates/index.html */
export const BATTERIES_MOCK: BatteryServiceMock[] = [
  {
    battery_id: 1,
    is_deleted: false,
    title: "Li-ion 18650",
    short_description: "Универсальный цилиндрический Li-ion элемент 18650 для портативной техники.",
    description:
      "Цилиндрический литий-ионный элемент формата 18650: компактная стандартизированная геометрия 18×65 мм, высокая удельная энергия, низкий саморазряд при хранении. Применяется в powerbank, ноутбучных батареях, электроинструменте и DIY-сборках; требует BMS или защищённых каналов заряда, рабочий диапазон напряжений обычно 2.5–4.2 В на ячейку.",
    photo_url: mockMediaForIndex(0).photo,
    video: mockMediaForIndex(0).video,
    capacity_mah: 3500,
    voltage_v: 3.7,
    price_rub: 890,
    listed_at: "2026-01-10T12:00:00.000Z",
    detail_current_a_str: "0.45",
    detail_runtime_hours_str: "12.40",
  },
  {
    battery_id: 2,
    is_deleted: false,
    title: "Li-Po pack",
    short_description: "Плоский Li-Po пакет для компактных устройств, дронов и носимой электроники.",
    description:
      "Полимерно-литиевый (Li-Po) пакет: гибкая плоская конструкция в алюмоламинатной оболочке, лёгкий вес и произвольные габариты под корпус смартфона, дрона или VR-шлема. Чувствителен к механическим проколам и перегреву; хранить частично заряженным, использовать только с корректным зарядным профилем CC/CV.",
    photo_url: mockMediaForIndex(1).photo,
    video: mockMediaForIndex(1).video,
    capacity_mah: 5000,
    voltage_v: 3.85,
    price_rub: 1240,
    listed_at: "2026-02-05T09:00:00.000Z",
    detail_current_a_str: "0.80",
    detail_runtime_hours_str: "5.20",
  },
  {
    battery_id: 3,
    is_deleted: false,
    title: "LiFePO4 block",
    short_description: "Надёжный LiFePO4 блок для ИБП, солнечных систем и тяговых задач.",
    description:
      "Литий-железо-фосфатный (LiFePO₄) блок: стабильная химия с плоской кривой разряда, высокая термостойкость и тысячи циклов при умеренной глубине разряда. Подходит для солнечных кэшей, ИБП и электротранспорта; номинальное напряжение ячейки около 3,2 В, сборки часто 4S/8S/16S под 12/24/48 В шины.",
    photo_url: mockMediaForIndex(2).photo,
    video: mockMediaForIndex(2).video,
    capacity_mah: 100_000,
    voltage_v: 12.8,
    price_rub: 42_500,
    listed_at: "2026-01-22T15:30:00.000Z",
    detail_current_a_str: "2.50",
    detail_runtime_hours_str: "36.00",
  },
  {
    battery_id: 4,
    is_deleted: false,
    title: "Ni-MH AA",
    short_description: "Перезаряжаемые Ni-MH AA элементы для бытовых приборов и фонарей.",
    description:
      "Никель-металлгидридные (Ni-MH) элементы формата AA: номинал 1,2 В на ячейку, безопаснее лития при бытовом использовании, удобны для пультов, детских игрушек и фонарей. Память эффекта слабее старых Ni-Cd; лучше не перегревать при заряде и избегать глубокого переразряда в дешёвых зарядках без −ΔV или dT/dt контроля.",
    photo_url: mockMediaForIndex(3).photo,
    video: mockMediaForIndex(3).video,
    capacity_mah: 2500,
    voltage_v: 1.2,
    price_rub: 320,
    listed_at: "2025-12-18T11:00:00.000Z",
    detail_current_a_str: "0.12",
    detail_runtime_hours_str: "18.50",
  },
];

export const MOCK_CART: BatteryLifeCartJSON = {
  has_draft: true,
  items_count: 2,
  id: 1,
};

export interface BatteryFilters {
  title: string;
}

export function getMockBattery(id: number): BatteryServiceMock | undefined {
  return BATTERIES_MOCK.find((b) => b.battery_id === id);
}

export function filterMockBatteries(filters: BatteryFilters): BatteryServiceMock[] {
  let list = BATTERIES_MOCK.filter((b) => !b.is_deleted);
  const t = filters.title.trim().toLowerCase();
  if (t) {
    list = list.filter(
      (b) =>
        b.title.toLowerCase().includes(t) || b.short_description.toLowerCase().includes(t),
    );
  }
  return list;
}

const CART_EVENT = "battery-life-cart-updated";

export async function addBatteryToMockLife(
  batteryId: number,
): Promise<{ ok: true } | { ok: false; message?: string }> {
  void batteryId;
  await new Promise((r) => setTimeout(r, 200));
  window.dispatchEvent(new Event(CART_EVENT));
  return { ok: true };
}

export function subscribeBatteryLifeCart(listener: () => void): () => void {
  window.addEventListener(CART_EVENT, listener);
  return () => window.removeEventListener(CART_EVENT, listener);
}

function cloneBattery(b: BatteryServiceMock): BatteryServiceMock {
  return { ...b };
}

export const MOCK_BATTERY_LIFE_DETAIL: BatteryLifeDetailResponse = {
  battery_life: {
    battery_life_id: 1,
    title: "",
    status: "draft",
    created_at: new Date().toISOString(),
    creator_login: "guest",
    moderator_login: null,
    description: null,
    completed_item_count: 0,
    total_runtime_hours: 30,
  },
  items: [
    {
      battery_life_id: 1,
      battery_id: 1,
      current_ma: 450,
      quantity: 2,
      runtime_hours: 12.4,
      battery: cloneBattery(BATTERIES_MOCK[0]!),
    },
    {
      battery_life_id: 1,
      battery_id: 2,
      current_ma: 800,
      quantity: 1,
      runtime_hours: 5.2,
      battery: cloneBattery(BATTERIES_MOCK[1]!),
    },
  ],
};

export function cloneBatteryLifeDetail(src: BatteryLifeDetailResponse): BatteryLifeDetailResponse {
  return JSON.parse(JSON.stringify(src)) as BatteryLifeDetailResponse;
}
