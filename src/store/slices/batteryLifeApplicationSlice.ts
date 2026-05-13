import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api";
import type {
  SerializerBatteryLifeItemJSON,
  SerializerBatteryLifeJSON,
} from "../../api/Api";
import {
  normalizeBattery,
  type BatteryLifeDetailResponse,
  type BatteryLifeHeaderMock,
  type BatteryLifeItemDetailJSON,
  type BatteryServiceMock,
} from "../../modules/batteryApi";
import { apiErrMessage } from "../utils/apiError";
import { logoutUser } from "./userSlice";

export interface BatteryLifeListRow {
  battery_life_id: number;
  status: string;
  created_at: string;
  creator_login: string;
  moderator_login?: string | null;
  forming_date: string | null;
  finish_date: string | null;
  completed_item_count: number;
  total_runtime_hours: number;
}

function mapListRow(sl: SerializerBatteryLifeJSON): BatteryLifeListRow {
  return {
    battery_life_id: Number(sl.id ?? 0),
    status: sl.status ?? "",
    created_at: sl.created_at != null ? String(sl.created_at) : "",
    creator_login: sl.creator_login ?? "",
    moderator_login: sl.moderator_login,
    forming_date: sl.formed_at != null ? String(sl.formed_at) : null,
    finish_date: sl.completed_at != null ? String(sl.completed_at) : null,
    completed_item_count: Number(sl.completed_item_count ?? 0),
    total_runtime_hours: Number(sl.total_runtime_hours ?? 0),
  };
}

function asDetail(data: unknown): BatteryLifeDetailResponse | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const lifeRaw = o.battery_life;
  const itemsRaw = o.items;
  if (!lifeRaw || typeof lifeRaw !== "object" || !Array.isArray(itemsRaw)) return null;
  const lr = lifeRaw as Record<string, unknown>;
  const life: BatteryLifeHeaderMock = {
    battery_life_id: Number(lr.id ?? lr.battery_life_id ?? 0),
    title: String(lr.title ?? ""),
    status: String(lr.status ?? "").trim(),
    created_at: lr.created_at != null ? String(lr.created_at) : "",
    creator_login: String(lr.creator_login ?? ""),
    moderator_login: (lr.moderator_login as string | null | undefined) ?? null,
    description: (lr.description as string | null | undefined) ?? null,
    completed_item_count: Number(lr.completed_item_count ?? 0),
    total_runtime_hours: Number(lr.total_runtime_hours ?? 0),
  };
  const items: BatteryLifeItemDetailJSON[] = itemsRaw.map((row) => {
    const r = row as Record<string, unknown>;
    const btRaw = r.battery_type as Record<string, unknown> | undefined;
    const bt = normalizeBattery(
      (btRaw ?? {}) as Partial<BatteryServiceMock> & { id?: number; photo?: string },
    );
    return {
      battery_life_id: Number(r.battery_life_id ?? life.battery_life_id),
      battery_id: Number(r.battery_type_id ?? r.battery_id ?? 0),
      current_ma: Number(r.current_ma ?? 0),
      quantity: Number(r.quantity ?? 0),
      runtime_hours:
        r.runtime_hours === null || r.runtime_hours === undefined
          ? null
          : Number(r.runtime_hours),
      battery: bt,
    };
  });
  return { battery_life: life, items };
}

/** После PUT /form сервер отдаёт актуальный заголовок заявки; мержим поверх GET на случай кэша. */
function mergeFormResponseIntoDetail(
  detail: BatteryLifeDetailResponse,
  applicationId: number,
  patch: SerializerBatteryLifeJSON,
) {
  if (detail.battery_life.battery_life_id !== applicationId) return;
  const life = detail.battery_life;
  if (patch.status != null && String(patch.status).length > 0) {
    life.status = String(patch.status);
  }
  if (patch.total_runtime_hours != null && !Number.isNaN(Number(patch.total_runtime_hours))) {
    life.total_runtime_hours = Number(patch.total_runtime_hours);
  }
  if (patch.completed_item_count != null) {
    life.completed_item_count = Number(patch.completed_item_count);
  }
  if (patch.title != null) life.title = String(patch.title);
  if (patch.description != null) life.description = String(patch.description);
}

function defaultListFilters() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  const day = `${y}-${m}-${d}`;
  return { fromDate: day, toDate: day, status: "", creatorLogin: "" };
}

function buildInitialState() {
  return {
    cart: null as {
      has_draft: boolean;
      items_count: number;
      id?: number;
    } | null,
    cartLoading: false,
    detail: null as BatteryLifeDetailResponse | null,
    detailLoading: false,
    detailError: null as string | null,
    list: [] as BatteryLifeListRow[],
    listLoading: false,
    listError: null as string | null,
    filters: defaultListFilters(),
    itemMutationLoading: {} as Record<string, boolean>,
    applicationMutationLoading: false,
  };
}

type CartSliceUser = { user: { isAuthenticated: boolean } };

function emptyGuestCartPayload() {
  return {
    has_draft: false,
    items_count: 0,
    id: undefined as number | undefined,
  };
}

function axiosStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "response" in e) {
    const r = (e as { response?: { status?: number } }).response;
    return r?.status;
  }
  return undefined;
}

export const fetchBatteryLifeApplicationCart = createAsyncThunk(
  "batteryLifeApplication/fetchCart",
  async (_, { rejectWithValue, getState }) => {
    const before = getState() as CartSliceUser;
    if (!before.user.isAuthenticated) {
      return emptyGuestCartPayload();
    }
    try {
      const r = await api.batteryLifeApplication.batteryLifeApplicationCartList();
      const after = getState() as CartSliceUser;
      if (!after.user.isAuthenticated) {
        return emptyGuestCartPayload();
      }
      const d = r.data as Record<string, unknown>;
      if (d.status === "no_draft" || d.id == null) {
        return { has_draft: false, items_count: 0, id: undefined };
      }
      const count = Number(d.count ?? d.items_count ?? d.strategies_count ?? 0);
      return {
        has_draft: true,
        items_count: count,
        id: typeof d.id === "number" ? d.id : Number(d.id),
      };
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const fetchBatteryLifeApplicationDetail = createAsyncThunk(
  "batteryLifeApplication/fetchDetail",
  async (applicationId: number, { rejectWithValue }) => {
    try {
      const r = await api.batteryLifeApplication.batteryLifeApplicationDetail(applicationId);
      const detail = asDetail(r.data);
      if (!detail) return rejectWithValue("Неверный ответ сервера");
      return detail;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const addBatteryTypeToBatteryLifeApplication = createAsyncThunk(
  "batteryLifeApplication/addBatteryTypeLine",
  async (batteryTypeId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.batteryLifeItemBinding.addBatteryTypeToBatteryLifeDraft(batteryTypeId, {
        current_ma: undefined,
        quantity: undefined,
      });
      await dispatch(fetchBatteryLifeApplicationCart());
      return batteryTypeId;
    } catch (e) {
      if (axiosStatus(e) === 409) {
        await dispatch(fetchBatteryLifeApplicationCart());
        return batteryTypeId;
      }
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const updateBatteryLifeItemLine = createAsyncThunk(
  "batteryLifeApplication/updateBatteryLifeItemLine",
  async (
    {
      batteryTypeId,
      batteryLifeId,
      body,
    }: {
      batteryTypeId: number;
      batteryLifeId: number;
      body: SerializerBatteryLifeItemJSON;
    },
    { rejectWithValue, dispatch },
  ) => {
    const key = `${batteryTypeId}-${batteryLifeId}`;
    try {
      await api.batteryLifeItemBinding.updateBatteryLifeItemLine(
        batteryTypeId,
        batteryLifeId,
        body,
      );
      await dispatch(fetchBatteryLifeApplicationDetail(batteryLifeId));
      return key;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const removeBatteryLifeItemLine = createAsyncThunk(
  "batteryLifeApplication/removeBatteryLifeItemLine",
  async (
    { batteryTypeId, batteryLifeId }: { batteryTypeId: number; batteryLifeId: number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.batteryLifeItemBinding.deleteBatteryLifeItemLine(batteryTypeId, batteryLifeId);
      await dispatch(fetchBatteryLifeApplicationDetail(batteryLifeId));
      await dispatch(fetchBatteryLifeApplicationCart());
      return batteryTypeId;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const updateBatteryLifeApplicationDraft = createAsyncThunk(
  "batteryLifeApplication/updateApplicationDraft",
  async (
    {
      applicationId,
      body,
    }: { applicationId: number; body: SerializerBatteryLifeJSON },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.batteryLifeApplication.editBatteryLifeApplicationUpdate(applicationId, body);
      await dispatch(fetchBatteryLifeApplicationDetail(applicationId));
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const formBatteryLifeApplication = createAsyncThunk(
  "batteryLifeApplication/form",
  async (applicationId: number, { rejectWithValue, dispatch }) => {
    try {
      const r = await api.batteryLifeApplication.formBatteryLifeApplicationUpdate(applicationId);
      const patch = r.data as SerializerBatteryLifeJSON;
      try {
        await dispatch(fetchBatteryLifeApplicationDetail(applicationId)).unwrap();
      } catch (refetchErr) {
        return rejectWithValue(apiErrMessage(refetchErr));
      }
      await dispatch(fetchBatteryLifeApplicationCart());
      await dispatch(fetchBatteryLifeApplicationsList());
      return { applicationId, patch };
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const deleteBatteryLifeApplication = createAsyncThunk(
  "batteryLifeApplication/deleteApplication",
  async (applicationId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.batteryLifeApplication.deleteBatteryLifeApplicationDelete(applicationId);
      await dispatch(fetchBatteryLifeApplicationCart());
      await dispatch(fetchBatteryLifeApplicationsList());
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const finishBatteryLifeApplication = createAsyncThunk(
  "batteryLifeApplication/finish",
  async (
    { applicationId, status }: { applicationId: number; status: "completed" | "rejected" },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.batteryLifeApplication.finishBatteryLifeApplicationUpdate(applicationId, {
        status,
      });
      await dispatch(fetchBatteryLifeApplicationsList());
      try {
        await dispatch(fetchBatteryLifeApplicationDetail(applicationId)).unwrap();
      } catch {
        /* detail tab may be closed */
      }
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const fetchBatteryLifeApplicationsList = createAsyncThunk(
  "batteryLifeApplication/fetchList",
  async (_, { getState, rejectWithValue }) => {
    try {
      const st = getState() as {
        batteryLifeApplication: { filters: ReturnType<typeof defaultListFilters> };
      };
      const f = st.batteryLifeApplication.filters;
      const query: { "from-date"?: string; "to-date"?: string; status?: string } = {};
      if (f.fromDate) query["from-date"] = f.fromDate;
      if (f.toDate) query["to-date"] = f.toDate;
      if (f.status) query.status = f.status;
      const r = await api.batteryLifeApplication.allBatteryLifeApplicationsList(query);
      return (r.data ?? []).map(mapListRow);
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

const batteryLifeApplicationSlice = createSlice({
  name: "batteryLifeApplication",
  initialState: buildInitialState(),
  reducers: {
    clearBatteryLifeApplicationDetailError: (state) => {
      state.detailError = null;
    },
    setListFilters: (
      state,
      action: PayloadAction<Partial<ReturnType<typeof defaultListFilters>>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetListFiltersToToday: (state) => {
      state.filters = defaultListFilters();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutUser.fulfilled, () => buildInitialState())
      .addCase(logoutUser.rejected, () => buildInitialState())
      .addCase(fetchBatteryLifeApplicationCart.pending, (state) => {
        state.cartLoading = true;
      })
      .addCase(fetchBatteryLifeApplicationCart.fulfilled, (state, action) => {
        state.cartLoading = false;
        if (typeof action.payload === "object" && action.payload && "items_count" in action.payload) {
          state.cart = action.payload as typeof state.cart;
        }
      })
      .addCase(fetchBatteryLifeApplicationCart.rejected, (state) => {
        state.cartLoading = false;
        state.cart = {
          has_draft: false,
          items_count: 0,
        };
      })
      .addCase(fetchBatteryLifeApplicationDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.detail = null;
      })
      .addCase(fetchBatteryLifeApplicationDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchBatteryLifeApplicationDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      .addCase(fetchBatteryLifeApplicationsList.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchBatteryLifeApplicationsList.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload;
        const det = state.detail;
        if (!det) return;
        const rid = det.battery_life.battery_life_id;
        const row = action.payload.find((r) => r.battery_life_id === rid);
        if (!row) return;
        det.battery_life.status = row.status;
        det.battery_life.total_runtime_hours = row.total_runtime_hours;
        if (row.creator_login) det.battery_life.creator_login = row.creator_login;
      })
      .addCase(fetchBatteryLifeApplicationsList.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      })
      .addCase(addBatteryTypeToBatteryLifeApplication.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(addBatteryTypeToBatteryLifeApplication.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(addBatteryTypeToBatteryLifeApplication.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateBatteryLifeApplicationDraft.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(updateBatteryLifeApplicationDraft.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateBatteryLifeApplicationDraft.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(formBatteryLifeApplication.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(formBatteryLifeApplication.fulfilled, (state, action) => {
        state.applicationMutationLoading = false;
        const { applicationId, patch } = action.payload;
        if (state.detail && patch) {
          mergeFormResponseIntoDetail(state.detail, applicationId, patch);
        }
      })
      .addCase(formBatteryLifeApplication.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(deleteBatteryLifeApplication.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(deleteBatteryLifeApplication.fulfilled, (state) => {
        state.applicationMutationLoading = false;
        state.detail = null;
      })
      .addCase(deleteBatteryLifeApplication.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateBatteryLifeItemLine.pending, (state, action) => {
        const k = `${action.meta.arg.batteryTypeId}-${action.meta.arg.batteryLifeId}`;
        state.itemMutationLoading[`line-${k}`] = true;
      })
      .addCase(updateBatteryLifeItemLine.fulfilled, (state, action) => {
        delete state.itemMutationLoading[`line-${action.payload}`];
      })
      .addCase(updateBatteryLifeItemLine.rejected, (state, action) => {
        const id = action.meta?.arg;
        if (id)
          delete state.itemMutationLoading[`line-${id.batteryTypeId}-${id.batteryLifeId}`];
      })
      .addCase(removeBatteryLifeItemLine.pending, (state, action) => {
        const id = action.meta.arg.batteryTypeId;
        state.itemMutationLoading[`rm-${id}`] = true;
      })
      .addCase(removeBatteryLifeItemLine.fulfilled, (state, action) => {
        const id = action.payload;
        delete state.itemMutationLoading[`rm-${id}`];
      })
      .addCase(removeBatteryLifeItemLine.rejected, (state, action) => {
        const id = action.meta?.arg?.batteryTypeId;
        if (id != null) delete state.itemMutationLoading[`rm-${id}`];
      })
      .addCase(finishBatteryLifeApplication.pending, (state, action) => {
        const id = action.meta.arg.applicationId;
        state.itemMutationLoading[`finish-${id}`] = true;
      })
      .addCase(finishBatteryLifeApplication.fulfilled, (state, action) => {
        const id = action.meta.arg.applicationId;
        delete state.itemMutationLoading[`finish-${id}`];
      })
      .addCase(finishBatteryLifeApplication.rejected, (state, action) => {
        const id = action.meta?.arg?.applicationId;
        if (id != null) delete state.itemMutationLoading[`finish-${id}`];
      });
  },
});

export const {
  clearBatteryLifeApplicationDetailError,
  setListFilters,
  resetListFiltersToToday,
} = batteryLifeApplicationSlice.actions;
export default batteryLifeApplicationSlice.reducer;
