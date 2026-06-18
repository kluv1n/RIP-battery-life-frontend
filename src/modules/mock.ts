import type {
  BatteryLifeCartJSON,
  BatteryLifeDetailResponse,
  BatteryServiceMock,
} from "./batteryApi";

/** Video: Mixkit battery B-roll (360p). */
export const MOCK_VIDEO = "/mock/battery-default.mp4";

/** Poster: batteries / charger (Unsplash → `public/mock/battery-default.jpg`). */
export const MOCK_COVER = "/mock/battery-default.jpg";

/** Four catalog items; short_description_en — как у drugs в лаб. 6. */
export const BATTERIES_MOCK: BatteryServiceMock[] = [
  {
    battery_id: 1,
    is_deleted: false,
    title: "Li-ion",
    short_description_en:
      "Purple cylindrical 18650 cell with printed mAh label on gray shrink-wrap.",
    description:
      "Литий-ионный элемент формата 18650: компактная стандартизированная геометрия 18×65 мм, высокая удельная энергия, низкий саморазряд при хранении.",
    photo_url: MOCK_COVER,
    video: MOCK_VIDEO,
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
    title: "Li-Po",
    short_description_en: "Gray flat Li-Po pouch with red and black silicone leads.",
    description:
      "Полимерно-литиевый (Li-Po) пакет: гибкая плоская конструкция в алюмоламинатной оболочке, лёгкий вес и произвольные габариты под корпус смартфона, дрона или VR-шлема.",
    photo_url: MOCK_COVER,
    video: MOCK_VIDEO,
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
    title: "LiFePO4",
    short_description_en: "Blue prismatic LiFePO4 block with screw terminals and thick cables.",
    description:
      "Литий-железо-фосфатный (LiFePO₄) блок: стабильная химия с плоской кривой разряда, высокая термостойкость и тысячи циклов при умеренной глубине разряда.",
    photo_url: MOCK_COVER,
    video: MOCK_VIDEO,
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
    title: "Ni-MH",
    short_description_en: "Green and white AA cells in a row on white background.",
    description:
      "Никель-металлгидридные (Ni-MH) элементы формата AA: номинал 1,2 В на ячейку, безопаснее лития при бытовом использовании, удобны для пультов, детских игрушек и фонарей.",
    photo_url: MOCK_COVER,
    video: MOCK_VIDEO,
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
        b.title.toLowerCase().includes(t) ||
        b.short_description_en.toLowerCase().includes(t),
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
    title: "Demo bundle",
    status: "draft",
    created_at: new Date().toISOString(),
    creator_login: "guest",
    moderator_login: null,
    description: "Черновая заявка на расчёт времени работы (mock).",
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
