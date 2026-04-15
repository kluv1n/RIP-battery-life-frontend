import type {
  BatteryLifeCartJSON,
  BatteryLifeDetailResponse,
  BatteryServiceMock,
} from "./batteryApi";

/** Видео: Mixkit, набор батарейных элементов (крупный план, 360p). */
export const MOCK_VIDEO = "/mock/battery-default.mp4";

/** Обложка: фото с аккумулятором/зарядкой (Unsplash → `public/mock/battery-default.jpg`). */
export const MOCK_COVER = "/mock/battery-default.jpg";

/** Четыре услуги; вёрстка карточек как в templates/index.html */
export const BATTERIES_MOCK: BatteryServiceMock[] = [
  {
    battery_id: 1,
    is_deleted: false,
    title: "Li-ion 18650",
    short_description: "Универсальный цилиндр 18650 для powerbank и ноутбуков.",
    description:
      "Цилиндрический литий-ионный элемент 18650. Часто используется в powerbank, ноутбуках и переносной электронике.",
    photo_url: MOCK_COVER,
    video: MOCK_VIDEO,
    capacity_mah: 3500,
    voltage_v: 3.7,
    price_rub: 890,
    listed_at: "2026-01-10T12:00:00.000Z",
    detail_current_a_str: "0,45",
    detail_runtime_hours_str: "12,40",
  },
  {
    battery_id: 2,
    is_deleted: false,
    title: "Li-Po пакет",
    short_description: "Плоский полимерный элемент для компактных устройств.",
    description: "Полимерно-литиевый пакет: компактная форма для носимых устройств и дронов.",
    photo_url: MOCK_COVER,
    video: MOCK_VIDEO,
    capacity_mah: 5000,
    voltage_v: 3.85,
    price_rub: 1240,
    listed_at: "2026-02-05T09:00:00.000Z",
    detail_current_a_str: "0,80",
    detail_runtime_hours_str: "5,20",
  },
  {
    battery_id: 3,
    is_deleted: false,
    title: "LiFePO₄ блок",
    short_description: "Безопасная химия для стационарных и транспортных систем.",
    description: "Литий-железо-фосфатный аккумуляторный блок: безопасность и долгий ресурс циклов.",
    photo_url: MOCK_COVER,
    video: MOCK_VIDEO,
    capacity_mah: 100_000,
    voltage_v: 12.8,
    price_rub: 42_500,
    listed_at: "2026-01-22T15:30:00.000Z",
    detail_current_a_str: "2,50",
    detail_runtime_hours_str: "36,00",
  },
  {
    battery_id: 4,
    is_deleted: false,
    title: "Ni-MH AA",
    short_description: "Формат AA, 1.2 В — пульты, фонари, бытовая электроника.",
    description: "Никель-металлгидридный элемент формата AA: 1.2 В, удобен для пультов и фонарей.",
    photo_url: MOCK_COVER,
    video: MOCK_VIDEO,
    capacity_mah: 2500,
    voltage_v: 1.2,
    price_rub: 320,
    listed_at: "2025-12-18T11:00:00.000Z",
    detail_current_a_str: "0,12",
    detail_runtime_hours_str: "18,50",
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
        b.short_description.toLowerCase().includes(t),
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
    title: "Демо-подборка",
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
