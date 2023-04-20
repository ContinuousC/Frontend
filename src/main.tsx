/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import App from "./App.tsx";

import "./index.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { store } from "./state/store";

import FrontendTracer from './utils/frontend-tracer';

if (typeof window !== 'undefined') FrontendTracer();


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Provider store={store}>
    <App />
  </Provider>
);
