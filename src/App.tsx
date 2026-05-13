import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ServicesPage from "./pages/ServicesPage/ServicesPage";
import ServicePage from "./pages/ServicePage/ServicePage";
import BatteryLifePage from "./pages/BatteryLifePage/BatteryLifePage";
import BatteryLivesPage from "./pages/BatteryLivesPage/BatteryLivesPage";
import SignInPage from "./pages/SignInPage/SignInPage";
import SignUpPage from "./pages/SignUpPage/SignUpPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import { ROUTES } from "./routePaths";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index_style.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
          <Route path="/catalog" element={<Navigate to="/" replace />} />
          <Route path={ROUTES.SERVICE} element={<ServicePage />} />
          <Route path={ROUTES.BATTERY_LIFE} element={<BatteryLifePage />} />
          <Route path={ROUTES.BATTERY_LIVES} element={<BatteryLivesPage />} />
          <Route path={ROUTES.SIGN_IN} element={<SignInPage />} />
          <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
