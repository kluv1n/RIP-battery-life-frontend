/**
 * Утилиты медиа и реэкспорт типов каталога.
 * HTTP к «услугам» — в Service Layer: `src/services/BatteryTypesService.ts`.
 */

export type {
  BatteryLifeCartJSON,
  BatteryLifeDetailResponse,
  BatteryLifeHeaderMock,
  BatteryLifeItemDetailJSON,
  BatteryServiceMock,
} from "./batteryApi.types";

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
