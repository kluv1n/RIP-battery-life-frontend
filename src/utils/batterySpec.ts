import type { BatteryServiceMock } from "../modules/batteryApi.types";

/** Ёмкость и напряжение для карточек каталога. */
export function formatBatteryCapacityVoltage(battery: BatteryServiceMock): string {
  return `Ёмкость и напряжение: ${battery.capacity_mah} мА·ч, ${battery.voltage_v} В`;
}
