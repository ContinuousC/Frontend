/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { createSlice } from "@reduxjs/toolkit";
import { SidebarMode } from "../types/frontend";

export interface UiSettingsState {
  darkMode: boolean;
  showSidebar: boolean;
  showTimeline: boolean;
  sidebarMode: SidebarMode;
}

const defaultInitialState: UiSettingsState = {
  darkMode:
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  showSidebar: true,
  showTimeline: false,
  sidebarMode: "expanded",
};

export const uiSettingsSlice = createSlice({
  name: "uiSettings",
  initialState: () => {
    const localStorageState = localStorage.getItem("uiSettings");
    if (localStorageState !== null) {
      return {
        ...defaultInitialState,
        ...(JSON.parse(localStorageState) as UiSettingsState),
        showSidebar: true,
      };
    } else {
      localStorage.setItem("uiSettings", JSON.stringify(defaultInitialState));
      return defaultInitialState;
    }
  },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem("uiSettings", JSON.stringify(state));
    },
    toggleSidebar: (state) => {
      state.showSidebar = !state.showSidebar;
      localStorage.setItem("uiSettings", JSON.stringify(state));
    },
    toggleTimeline: (state) => {
      state.showTimeline = !state.showTimeline;
      localStorage.setItem("uiSettings", JSON.stringify(state));
    },
    toggleSidebarSize: (state) => {
      state.sidebarMode = state.sidebarMode === "mini" ? "expanded" : "mini";
      localStorage.setItem("uiSettings", JSON.stringify(state));
    },
  },
});

export const {
  toggleDarkMode,
  toggleSidebar,
  toggleTimeline,
  toggleSidebarSize,
} = uiSettingsSlice.actions;

export default uiSettingsSlice.reducer;
