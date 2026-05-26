import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CatalogFiltersState {
  /** Поиск по названию типа АКБ (услуги каталога). */
  title: string;
}

const initialState: CatalogFiltersState = {
  title: "",
};

const catalogFiltersSlice = createSlice({
  name: "catalogFilters",
  initialState,
  reducers: {
    setCatalogTitleFilter: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
    },
    resetCatalogFilters: () => initialState,
  },
});

export const { setCatalogTitleFilter, resetCatalogFilters } = catalogFiltersSlice.actions;
export default catalogFiltersSlice.reducer;
