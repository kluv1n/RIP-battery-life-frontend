export const ROUTES = {
  SERVICES: "/",
  SERVICE: "/battery/:id",
  BATTERY_LIFE: "/battery-life/:id",
} as const;

export type RouteKeyType = keyof typeof ROUTES;

export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  SERVICES: "Battery catalog",
  SERVICE: "Battery type",
  BATTERY_LIFE: "Runtime request",
};
