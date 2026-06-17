/** Тип аккумулятора — домен «услуга» каталога (лаб. 5). */
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
