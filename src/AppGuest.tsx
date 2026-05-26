import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import GuestLayout from "./layouts/GuestLayout";
import ServicesPage from "./pages/ServicesPage/ServicesPage";
import ServicePage from "./pages/ServicePage/ServicePage";
import BatteryLifePage from "./pages/BatteryLifePage/BatteryLifePage";
import { ROUTES } from "./routePaths";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index_style.css";

/** Три страницы гостя для Tauri / демо без авторизации. */
export default function AppGuest() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<GuestLayout />}>
          <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
          <Route path="/catalog" element={<Navigate to="/" replace />} />
          <Route path={ROUTES.SERVICE} element={<ServicePage />} />
          <Route path={ROUTES.BATTERY_LIFE} element={<BatteryLifePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
