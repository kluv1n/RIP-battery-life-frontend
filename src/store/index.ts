import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import batteryLifeApplicationReducer from "./slices/batteryLifeApplicationSlice";
import catalogFiltersReducer from "./slices/catalogFiltersSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    batteryLifeApplication: batteryLifeApplicationReducer,
    catalogFilters: catalogFiltersReducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
