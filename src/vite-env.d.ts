/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** http://192.168.x.x:8080 — для Tauri-сборки (как в эталоне tauri) */
  readonly VITE_API_ORIGIN?: string;
  readonly VITE_MINIO_PUBLIC_BASE?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_MINIO_BASE?: string;
  readonly VITE_MEDIA_BASE?: string;
  readonly VITE_GUEST_APP?: string;
  readonly VITE_BUILD_ID?: string;
  readonly VITE_DEV_HTTPS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.mp4" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}
