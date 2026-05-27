/** Дефолтные медиа только для Tauri guest. */
export const GUEST_CATALOG_PHOTO = "/mock/battery-default.jpg";
export const GUEST_CATALOG_VIDEO = "/mock/battery-default.mp4";

export const isGuestApp = import.meta.env.VITE_GUEST_APP === "true";
