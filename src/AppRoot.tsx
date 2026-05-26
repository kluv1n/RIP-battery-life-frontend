import App from "./App";
import AppGuest from "./AppGuest";

const isGuestApp = import.meta.env.VITE_GUEST_APP === "true";

export default function AppRoot() {
  return isGuestApp ? <AppGuest /> : <App />;
}
