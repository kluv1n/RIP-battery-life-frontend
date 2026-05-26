import { useEffect, useState } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import type { BatteryServiceRouteState } from "../../routeState";
import { BATTERIES_MOCK, getMockBattery } from "../../modules/mock";
import { getBatteryType } from "../../modules/batteryApi";
import { ROUTES } from "../../routePaths";
import "./BreadCrumbs.css";

type Crumb = { label: string; to?: string };

export default function BreadCrumbs() {
  const { pathname, state } = useLocation();
  const catalogBattery = (state as BatteryServiceRouteState | null)?.battery;
  const [batteryTitle, setBatteryTitle] = useState<string | null>(null);

  useEffect(() => {
    const m = matchPath(ROUTES.SERVICE, pathname);
    const rawId = m?.params.id;
    if (rawId == null) {
      setBatteryTitle(null);
      return;
    }
    const id = Number(rawId);
    if (catalogBattery?.battery_id === id && catalogBattery.title) {
      setBatteryTitle(catalogBattery.title);
    }
    let cancelled = false;
    const run = async () => {
      const data = await getBatteryType(id);
      if (cancelled) return;
      if (data?.title) {
        setBatteryTitle(data.title);
        return;
      }
      const b = getMockBattery(id) ?? BATTERIES_MOCK.find((x) => x.battery_id === id);
      setBatteryTitle(b?.title ?? `Тип АКБ ${id}`);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname, catalogBattery?.battery_id, catalogBattery?.title]);

  const crumbs: Crumb[] = (() => {
    if (pathname === "/" || pathname === "") {
      return [{ label: "Главная" }];
    }

    if (pathname === ROUTES.SIGN_IN) {
      return [{ label: "Главная", to: ROUTES.SERVICES }, { label: "Вход" }];
    }

    if (pathname === ROUTES.SIGN_UP) {
      return [{ label: "Главная", to: ROUTES.SERVICES }, { label: "Регистрация" }];
    }

    if (pathname === ROUTES.BATTERY_LIVES) {
      return [{ label: "Главная", to: ROUTES.SERVICES }, { label: "Заявки" }];
    }

    if (pathname === ROUTES.PROFILE) {
      return [{ label: "Главная", to: ROUTES.SERVICES }, { label: "Личный кабинет" }];
    }

    const typeMatch = matchPath(ROUTES.SERVICE, pathname);
    if (typeMatch?.params.id) {
      const title =
        batteryTitle ??
        (typeMatch.params.id ? `Тип АКБ ${typeMatch.params.id}` : "Тип аккумулятора");
      return [{ label: "Главная", to: ROUTES.SERVICES }, { label: title }];
    }

    const lifeMatch = matchPath(ROUTES.BATTERY_LIFE, pathname);
    if (lifeMatch?.params.id) {
      return [
        { label: "Главная", to: ROUTES.SERVICES },
        { label: `Заявка №${lifeMatch.params.id}` },
      ];
    }

    return [{ label: "Главная", to: ROUTES.SERVICES }, { label: "Страница" }];
  })();

  return (
    <nav className="app-breadcrumbs" aria-label="Навигационная цепочка">
      <ol className="app-breadcrumbs__list">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="app-breadcrumbs__item">
              {crumb.to != null && !last ? (
                <Link to={crumb.to} className="app-breadcrumbs__link">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={last ? "app-breadcrumbs__current" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
