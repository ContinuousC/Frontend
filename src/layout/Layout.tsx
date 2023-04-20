/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Paper from "@mui/material/Paper";
import { useSelector } from "react-redux";

//import Header from "./Header";
import Sidebar from "./Sidebar";
// import Footer from "./Footer";
import Content from "./Content";

import { type RootState } from "../state/store";

export default function Layout() {
  const uiSettings = useSelector((state: RootState) => state.uiSettings);
  const location = useLocation();
  useEffect(() => {
    const paths = location.pathname
      .split("/")
      .filter((path) => path !== "")
      .map((path) => path.charAt(0).toUpperCase() + path.slice(1));
    paths.reverse();
    const title = paths.join(" - ");
    setTitle(title);
  }, [location.pathname]);
  return (
    <Paper
      square
      elevation={0}
      className={`grid grid-cols-[55px_auto] ${uiSettings.darkMode ? "dark " : ""}${
        uiSettings.showSidebar
          ? uiSettings.sidebarMode === "expanded"
            ? "md:grid-cols-[200px_auto]"
            : "md:grid-cols-[55px_auto]"
          : "grid-cols-[0px_auto]"
      } h-screen w-screen overflow-hidden`}
    >
      <Sidebar />
      <Content />
    </Paper>
  );
}

function setTitle(title: string) {
  const documentDefined: boolean = typeof document !== "undefined";
  if (documentDefined) {
    if (!title) {
      document.title = "ContinuousC";
    } else {
      document.title = title + " | ContinuousC";
    }
  }
}
