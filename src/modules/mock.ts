import type {
  BatteryLifeCartJSON,
  BatteryLifeDetailResponse,
  BatteryServiceMock,
} from "./batteryApi";

/** Video: Mixkit battery B-roll (360p). */
export const MOCK_VIDEO = "/mock/battery-default.mp4";

/** Poster: batteries / charger (Unsplash → `public/mock/battery-default.jpg`). */
export const MOCK_COVER = "/mock/battery-default.jpg";

/** Four catalog items; card layout matches templates/index.html */
export const BATTERIES_MOCK: BatteryServiceMock[] = [
  {
    battery_id: 1,
    is_deleted: false,
    title: "Li-ion 18650",
    short_description:
      "A purple 18650-format cylindrical lithium-ion cell standing upright on a neutral gray sweep; the flat positive terminal shows a shallow vent disk and nickel plating, the negative end is wrapped in heat-shrink with printed mAh and safety glyphs, soft three-quarter studio lighting with gentle falloff and no harsh specular hotspots—typical OEM catalog photo for CLIP-style image retrieval.",
    description:
      "Цилиндрический литий-ионный элемент формата 18650: компактная стандартизированная геометрия 18×65 мм, высокая удельная энергия, низкий саморазряд при хранении. Применяется в powerbank, ноутбучных батареях, электроинструменте и DIY-сборках; требует BMS или защищённых каналов заряда, рабочий диапазон напряжений обычно 2.5–4.2 В на ячейку.",
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
    title: "Li-Po pack",
    short_description:
      "A thin rectangular soft-pouch lithium-polymer battery in matte gray foil laminate; two flexible silicone leads—red positive and black negative—exit one short edge through reinforced tape, JST-style connector optional, slight pillowing of the foil edges and barcode sticker on top, even diffused light emphasizing the flat prismatic silhouette for vision-language matching.",
    description:
      "Полимерно-литиевый (Li-Po) пакет: гибкая плоская конструкция в алюмоламинатной оболочке, лёгкий вес и произвольные габариты под корпус смартфона, дрона или VR-шлема. Чувствителен к механическим проколам и перегреву; хранить частично заряженным, использовать только с корректным зарядным профилем CC/CV.",
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
    title: "LiFePO4 block",
    short_description:
      "A heavy prismatic LiFePO4 module with powder-coated metal case corners, two prominent busbar screw terminals capped with plastic shrouds, blue branded shrink on the long face, and thick red/black AWG cables routed to a small BMS harness with balance leads—stationary energy-storage look, front-three-quarter product shot on concrete-toned backdrop.",
    description:
      "Литий-железо-фосфатный (LiFePO₄) блок: стабильная химия с плоской кривой разряда, высокая термостойкость и тысячи циклов при умеренной глубине разряда. Подходит для солнечных кэшей, ИБП и электротранспорта; номинальное напряжение ячейки около 3,2 В, сборки часто 4S/8S/16S под 12/24/48 В шины.",
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
    title: "Ni-MH AA",
    short_description:
      "Four consumer AA nickel-metal hydride cells arranged in a loose diagonal row on pure white; metallic negative bottoms, green printed sleeves with mAh ratings and crossed-bin recycling icons, mild specular highlights on the steel rings—common household rechargeable pack reference for image search.",
    description:
      "Никель-металлгидридные (Ni-MH) элементы формата AA: номинал 1,2 В на ячейку, безопаснее лития при бытовом использовании, удобны для пультов, детских игрушек и фонарей. Память эффекта слабее старых Ni-Cd; лучше не перегревать при заряде и избегать глубокого переразряда в дешёвых зарядках без −ΔV или dT/dt контроля.",
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
