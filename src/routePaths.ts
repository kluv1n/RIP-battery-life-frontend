export const ROUTES = {
  SERVICES: "/",
  SERVICE: "/battery/:id",
  BATTERY_LIFE: "/battery-life/:id",
  BATTERY_LIVES: "/battery-lives",
  SIGN_IN: "/signin",
  SIGN_UP: "/signup",
  PROFILE: "/profile",
} as const;

export type RouteKeyType = keyof typeof ROUTES;

export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  SERVICES: "Каталог типов АКБ",
  SERVICE: "Тип аккумулятора",
  BATTERY_LIFE: "Заявка",
  BATTERY_LIVES: "Заявки",
  SIGN_IN: "Вход",
  SIGN_UP: "Регистрация",
  PROFILE: "Личный кабинет",
};
