/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, lazy } from "react";
import { useSelector } from "react-redux";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ToastContainer, toast } from "react-toastify";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";

import Layout from "./layout/Layout";
import Error404Page from "./pages/Error404Page";
import Error500Page from "./pages/Error500Page";
import ErrorAuthServerDownPage from "./pages/ErrorAuthServerDown";
import {
  PromSchema,
  PromSchemaTree,
  PromSchemaModules,
  PromSchemaModule,
  PromSchemaItem,
  PromSchemaGenerateModules,
  PromSchemaGenerateModule,
  PromSchemaGenerateTree,
} from "./pages/PromSchema";
import {
  EditPackages,
  EditDiscoveryPackages,
  EditDiscoveryPackage,
  EditDiscoveryItem,
  EditDiscoveryRelation,
  EditDiscoveryProperty,
  EditConnectionsPackages,
  EditConnectionsPackage,
} from "./pages/EditPackages";
import Iframe from "./pages/Iframe";
import Loading from "./components/Loading";
const View = lazy(() => import("./pages/View"));
const Configurations = lazy(() => import("./pages/Configurations"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OpenAlerts = lazy(() => import("./pages/OpenAlerts"));

import { type RootState } from "./state/store";

import { PRIMARY_COLOR, SECONDARY_COLOR } from "./constants";

import "react-toastify/dist/ReactToastify.css";

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <Error500Page />,
    path: "/",
    children: [
      {
        index: true,
        loader: async () => redirect("/dashboards/overview"),
      },
      {
        path: "/dashboards/:dashboardId",
        element: <Dashboard />,
      },
      {
        path: "/alerts",
        element: <OpenAlerts />,
      },
      {
        path: "/grafana-iframe/*",
        element: <Iframe src="/grafana" clientBasePath="/grafana-iframe" />,
      },
      {
        path: "/prometheus-iframe/*",
        element: (
          <Iframe src="/prometheus" clientBasePath="/prometheus-iframe" />
        ),
      },
      {
        path: "/jaeger-iframe/*",
        element: <Iframe src="/jaeger" clientBasePath="/jaeger-iframe" />,
      },
      {
        path: "/opensearch-iframe/*",
        element: (
          <Iframe
            src="/opensearch"
            clientBasePath="/opensearch-iframe"
            disableUrlState
          />
        ),
      },
      {
        path: "/view/:viewId",
        element: <View />,
      },
      {
        path: "/configurations",
        element: <Configurations />,
      },
      {
        path: "/schema",
        element: <EditPackages />,
      },
      {
        path: "/schema/discovery",
        element: <EditDiscoveryPackages />,
      },
      {
        path: "/schema/discovery/:pkg",
        element: <EditDiscoveryPackage />,
      },
      {
        path: "/schema/discovery/:pkg/item/:item",
        element: <EditDiscoveryItem />,
      },
      {
        path: "/schema/discovery/:pkg/relation/:relation",
        element: <EditDiscoveryRelation />,
      },
      {
        path: "/schema/discovery/:pkg/property/:property",
        element: <EditDiscoveryProperty />,
      },
      {
        path: "/schema/connections",
        element: <EditConnectionsPackages editable />,
      },
      {
        path: "/schema/connections/:pkg",
        element: <EditConnectionsPackage editable />,
      },
      {
        path: "/schema/prometheus",
        element: <PromSchema base="/schema/prometheus" />,
      },
      {
        path: "/schema/prometheus/tree/*",
        element: <PromSchemaTree base="/schema/prometheus" />,
      },
      {
        path: "/schema/prometheus/module",
        element: <PromSchemaModules base="/schema/prometheus" />,
      },
      {
        path: "/schema/prometheus/module/:module",
        element: <PromSchemaModule base="/schema/prometheus" />,
      },
      {
        path: "/schema/prometheus/module/:module/:item",
        element: <PromSchemaItem base="/schema/prometheus" />,
      },
      {
        path: "/schema/prometheus/generate",
        element: <PromSchemaGenerateModules base="/schema/prometheus" />,
      },
      {
        path: "/schema/prometheus/generate/:module",
        element: <PromSchemaGenerateModule base="/schema/prometheus" />,
      },
      {
        path: "/schema/prometheus/generate/:module/tree/*",
        element: <PromSchemaGenerateTree base="/schema/prometheus" />,
      },
      {
        path: "/error/auth-server-down",
        element: <ErrorAuthServerDownPage />,
      },
      {
        path: "*",
        element: <Error404Page />,
      },
    ],
  },
]);

if (navigator && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/serviceWorker.js")
    .then(function (registration) {
      console.log("Service Worker registered with scope:", registration.scope);
    })
    .catch(function (error) {
      console.error("Service Worker registration failed:", error);
    });
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      if (
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        error.response.status
      ) {
        if (
          error.response.status === 302 ||
          error.response.status === 401 ||
          error.response.status === 403
        ) {
          window.location.reload();
        }
      }
      toast.error(error?.response?.data || error.toString(), {
        toastId: error.name,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      if (
        error &&
        "response" in error &&
        error.response &&
        error.response.status
      ) {
        if (
          error.response.status === 302 ||
          error.response.status === 401 ||
          error.response.status === 403
        ) {
          window.location.reload();
        }
      }
      toast.error(error.response?.data || error.toString(), {
        toastId: error.name,
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: false,
      //      refetchOnWindowFocus: false,
      //      refetchOnMount: false,
    },
  },
});

function App() {
  const darkMode = useSelector((state: RootState) => state.uiSettings.darkMode);
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: {
            main: PRIMARY_COLOR,
          },
          secondary: {
            main: SECONDARY_COLOR,
          },
        },
        components: {
          MuiTab: {
            styleOverrides: {
              root: {
                minHeight: 50,
                fontSize: 11,
              },
            },
          },
        },
      }),
    [darkMode]
  );
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} fallbackElement={<Loading />} />
        </QueryClientProvider>
      </LocalizationProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        limit={3}
        theme={darkMode ? "dark" : "light"}
        pauseOnHover
        closeOnClick
        newestOnTop
        pauseOnFocusLoss
      />
    </ThemeProvider>
  );
}

export default App;
