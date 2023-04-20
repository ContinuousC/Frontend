/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { memo, useEffect, useMemo, useContext, useRef } from "react";
import { useSelector } from "react-redux";
import { Graphin, useGraphin } from "@antv/graphin";
import {
  GraphData,
  GraphOptions,
  NodeEvent,
  CanvasEvent,
  IPointerEvent,
  // register,
} from "@antv/g6";
// import {
//   initThreads,
//   supportsThreads,
//   Threads,
//   AntVDagreLayout,
// } from "@antv/layout-wasm";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { useInView } from "react-intersection-observer";

import {
  AutoCompleteTopology,
  AutoCompleteStatusFilter,
} from "./TopologyFilter";
import { TopologyQueryFilterButton } from "./TopologyFilter";
import { TopologyMetricSettingsButton } from "./TopologyMetricSettings";

import { TopologyContext } from "../context";
import * as maybeLoading from "../utils/maybeLoading";

import { AlertMessage } from "../types/frontend";
import { type RootState } from "../state/store";
import { PRIMARY_COLOR } from "../constants";

interface TopologyProps {
  data: maybeLoading.MaybeLoading<GraphData>;
  overQueryLimit?: maybeLoading.MaybeLoading<boolean>;
}

const BEHAVIORS: GraphOptions["behaviors"] = [
  { type: "zoom-canvas", key: "zoom-canvas" },
  { type: "drag-canvas" },
  { type: "drag-element" },
  {
    type: "hover-activate",
    key: "hover-activate",
    degree: 1,
    state: "highlight",
    inactiveState: "dim",
    onHover: (event: IPointerEvent) => {
      event.view.setCursor("pointer");
    },
    onHoverEnd: (event: IPointerEvent) => {
      event.view.setCursor("default");
    },
  },
];
const NODE_DEFAULT: GraphOptions["node"] = {
  state: {
    highlight: {
      halo: true,
      haloFill: PRIMARY_COLOR,
      haloStroke: PRIMARY_COLOR,
      lineWidth: 0,
      labelWordWrap: false,
    },
    dim: {},
  },
  style: {},
};
const EDGE_DEFAULT: GraphOptions["edge"] = {
  type: "line",
  state: {
    highlight: {
      stroke: PRIMARY_COLOR,
    },
  },
};

const Topology = memo(function Topology(props: TopologyProps) {
  const uiSettings = useSelector((state: RootState) => state.uiSettings);
  const { ref, inView } = useInView();
  const graphContainer = useRef<HTMLDivElement | null>(null);
  const initialOptions = useMemo<GraphOptions>(
    () => ({
      theme: uiSettings.darkMode ? "dark" : "light",
      behaviors: BEHAVIORS,
      node: NODE_DEFAULT,
      edge: EDGE_DEFAULT,
      autoFit: "view",
      autoResize: true,
    }),
    [],
  );
  const error =
    maybeLoading.getError(props.data) ||
    (props.overQueryLimit !== undefined &&
      maybeLoading.getError(props.overQueryLimit));
  const isLoading =
    maybeLoading.isLoading(props.data) ||
    (props.overQueryLimit !== undefined &&
      maybeLoading.isLoading(props.overQueryLimit));
  const graphData = maybeLoading.getDataOr(props.data, {
    nodes: [],
    edges: [],
  });
  const alert: AlertMessage | null = error
    ? { severity: "error", title: error }
    : props.overQueryLimit !== undefined &&
        maybeLoading.getData(props.overQueryLimit) === true
      ? {
          severity: "warning",
          title: "Query limit exceeded",
          subTitle: "Add filters or increase the query limit",
        }
      : !isLoading && graphData.nodes?.length === 0
        ? { severity: "warning", title: "No elements found" }
        : null;
  return (
    <Paper className="h-full w-full flex-col relative" ref={ref}>
      <div className="w-full absolute top-1 z-10 flex justify-between">
        <div>
          {isLoading && (
            <Alert severity="info">
              <AlertTitle>Items loading</AlertTitle>
            </Alert>
          )}
          {alert !== null && (
            <Alert severity={alert.severity}>
              <AlertTitle>{alert.title}</AlertTitle>
              {alert.subTitle}
            </Alert>
          )}
        </div>
        <Card className="flex items-center p-2 gap-1">
          <AutoCompleteTopology />
          <AutoCompleteStatusFilter />
          <TopologyQueryFilterButton />
          <TopologyMetricSettingsButton />
        </Card>
      </div>
      <div ref={graphContainer} style={{ width: "100%", height: "100%" }}>
        <Graphin
          options={initialOptions}
          style={{ width: "100%", height: "100%" }}
        >
          <CustomBehavior
            data={graphData}
            container={graphContainer.current}
            inView={inView}
          />
        </Graphin>
      </div>
    </Paper>
  );
});

export default Topology;

// var layoutThreads: Threads | undefined = undefined;
// const registerLayoutPlugin = async () => {
//   const supported = await supportsThreads();
//   const threads = await initThreads(supported);
//   register("layout", "dagreWASM", AntVDagreLayout);
//   layoutThreads = threads;
// };
// registerLayoutPlugin();

const CustomBehavior = (props: {
  data: GraphData;
  inView: boolean;
  container: HTMLDivElement | null;
}) => {
  const uiSettings = useSelector((state: RootState) => state.uiSettings);
  const { data, inView } = props;
  const { onClickItem } = useContext(TopologyContext);
  const { graph, isReady } = useGraphin();
  const firstTimeRendered = useRef<boolean>(false);

  useEffect(() => {
    if (inView && graph && isReady && !firstTimeRendered.current) {
      firstTimeRendered.current = true;
      graph.resize();
      graph.fitView();
    }
  }, [graph, isReady, inView]);
  useEffect(() => {
    const currentContainer = props.container;
    if (currentContainer && graph) {
      const observer = new ResizeObserver(async () => {
        graph.resize();
        await graph.fitView({ when: "always" }, false);
      });
      observer.observe(currentContainer);
      return () => observer.unobserve(currentContainer);
    }
  }, [props.container, graph]);
  useEffect(() => {
    if (graph !== null) {
      graph.on(NodeEvent.CLICK, (evt) => {
        if ("target" in evt && evt.target !== null && "id" in evt.target) {
          onClickItem(evt.target.id);
        }
      });
      graph.on(CanvasEvent.DBLCLICK, async (evt) => {
        if ("target" in evt && evt.target !== null) {
          await graph.fitView();
          await graph.layout();
        }
      });
    }
    return () => {
      if (graph !== null) {
        graph.off();
      }
    };
  }, [graph]);
  useEffect(() => {
    if (isReady && graph !== null) {
      graph.setTheme(uiSettings.darkMode ? "dark" : "light");
    }
  }, [graph, isReady, uiSettings.darkMode]);
  useEffect(() => {
    if (isReady && graph !== null && data !== undefined) {
      const setData = async () => {
        graph.setData(data);
        await graph.render();
        await graph.fitView();
      };
      setData();
    }
  }, [graph, isReady, data]);

  const layoutOptions: GraphOptions["layout"] = useMemo(
    () => {
      //if (layoutThreads !== undefined) {
      return {
        //threads: layoutThreads,
        //type: "dagreWASM",
        type: "dagre",
        //maxIteration: 100,
        align: "UL",
      };
      //}
    },
    [
      /*layoutThreads*/
    ],
  );

  useEffect(() => {
    if (isReady && graph && layoutOptions) {
      graph.setLayout(layoutOptions);
    }
  }, [graph, isReady, layoutOptions]);

  return isReady ? null : (
    <Skeleton variant="rectangular" width="100%" height="100%" />
  );
};
