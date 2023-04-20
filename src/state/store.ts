/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { configureStore } from "@reduxjs/toolkit";
import uiSettingsReducer from "./uiSettingsSlice";
import datetimeFilterSlice from "./datatimeFilterSlice";

export const store = configureStore({
  reducer: {
    uiSettings: uiSettingsReducer,
    datetimeFilter: datetimeFilterSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
