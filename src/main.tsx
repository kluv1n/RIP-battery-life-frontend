import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import AppRoot from "./AppRoot";
import { store } from "./store";

/** Сброс старого SW на GitHub Pages (у кого остался кэш белого экрана / старой сборки). */
const PAGES_BUILD_KEY = "rip.pages.build-id";

async function purgeStaleServiceWorkers(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  const regs = await navigator.serviceWorker.getRegistrations();
  if (!regs.length) return false;
  await Promise.all(regs.map((r) => r.unregister()));
  return true;
}

if (import.meta.env.PROD && import.meta.env.BASE_URL !== "/") {
  const buildId = import.meta.env.VITE_BUILD_ID ?? "0";
  const prev = localStorage.getItem(PAGES_BUILD_KEY);
  if (prev !== buildId) {
    localStorage.setItem(PAGES_BUILD_KEY, buildId);
    void purgeStaleServiceWorkers().then((hadSw) => {
      if (hadSw) location.reload();
    });
  } else {
    void purgeStaleServiceWorkers();
  }
}

/** Без StrictMode: на карточке ровно 2 GET (страница + крошки), без удвоения до 4 в dev. */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <AppRoot />
  </Provider>,
);
