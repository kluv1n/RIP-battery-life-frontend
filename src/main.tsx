import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import AppRoot from "./AppRoot";
import { store } from "./store";

/** Без StrictMode: на карточке ровно 2 GET (страница + крошки), без удвоения до 4 в dev. */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <AppRoot />
  </Provider>,
);
