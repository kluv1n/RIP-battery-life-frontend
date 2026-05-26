import type { BatteryServiceMock } from "./modules/batteryApi.types";

/** Данные с каталога при переходе на карточку — без лишнего GET. */
export type BatteryServiceRouteState = {
  battery?: BatteryServiceMock;
};
