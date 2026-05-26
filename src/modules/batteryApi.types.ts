/** Тип аккумулятора (услуга каталога). */
export interface BatteryServiceMock {
  battery_id: number;
  title: string;
  short_description: string;
  description: string;
  is_deleted: boolean;
  photo_url: string;
  video: string;
  capacity_mah: number;
  voltage_v: number;
  price_rub: number;
  listed_at: string;
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
