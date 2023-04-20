/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import colors from "tailwindcss/colors";

import {
  CRITICAL_COLOR,
  MAJOR_COLOR,
  MINOR_COLOR,
  OK_COLOR,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  WARNING_COLOR,
} from "./src/constants";
console.log("Tailwind config loaded!");

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "selector",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: PRIMARY_COLOR,
        secondary: SECONDARY_COLOR,
        critical: CRITICAL_COLOR,
        major: MAJOR_COLOR,
        minor: MINOR_COLOR,
        warning: WARNING_COLOR,
        ok: OK_COLOR,
      },
    },
  },
  plugins: [],
};
