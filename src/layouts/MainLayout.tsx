import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import BatteryAppHeader from "../components/BatteryAppHeader/BatteryAppHeader";
import BreadCrumbs from "../components/BreadCrumbs/BreadCrumbs";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchBatteryLifeApplicationCart } from "../store/slices/batteryLifeApplicationSlice";

export default function MainLayout() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated);

  useEffect(() => {
    void dispatch(fetchBatteryLifeApplicationCart());
  }, [dispatch, isAuthenticated]);

  return (
    <div className="main-layout">
      <BatteryAppHeader />
      <BreadCrumbs />
      <Outlet />
    </div>
  );
}
