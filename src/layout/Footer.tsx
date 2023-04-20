/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useSelector } from "react-redux";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Link from "@mui/material/Link";

import { type RootState } from "../state/store";

export default function Footer() {
  const darkMode = useSelector((state: RootState) => state.uiSettings.darkMode);
  return (
    <AppBar
      position="fixed"
      sx={{
        bottom: 0,
        top: "auto",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar className="flex justify-between">
        <div className="flex content-end">
          <strong>
            Copyright &copy; {new Date().getFullYear().toString()}{" "}
          </strong>
          <Link
            underline="none"
            href="https://continuousc.com/"
            target="_blank"
          >
            <img
              src={`/logos/${
                darkMode ? "white" : "black"
              }_logo_transparent_background`}
              className="w-40 h-6"
            />
          </Link>
          {". "}
          All rights reserved.{" "}
        </div>
        <div>
          <b> Version</b>
          {" 0.0.1"}
        </div>
      </Toolbar>
    </AppBar>
  );
}
