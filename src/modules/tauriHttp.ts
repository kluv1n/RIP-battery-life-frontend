/**
 * В Tauri release axios/fetch из WebView к LAN часто даёт ERR_NETWORK.
 * plugin-http ходит в сеть из Rust (с entitlements), не из WKWebView.
 */
export function isTauriRuntime(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window;
}

export function shouldUseTauriHttpPlugin(): boolean {
  return isTauriRuntime() && import.meta.env.VITE_GUEST_APP === "true";
}

export async function tauriHttpGetJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const { fetch } = await import("@tauri-apps/plugin-http");
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...headers,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  }
  return (await response.json()) as T;
}
