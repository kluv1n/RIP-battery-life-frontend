import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import batteryLifeApplicationReducer from "./slices/batteryLifeApplicationSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    batteryLifeApplication: batteryLifeApplicationReducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
