/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import * as echarts from "echarts/core";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  TimelineComponent,
  LegendComponent,
  LegendScrollComponent,
  LegendPlainComponent,
  DatasetComponent,
  GraphicComponent,
  MarkLineComponent,
  ToolboxComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, GaugeChart } from "echarts/charts";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { CircularLoading } from "./Loading";

import { type ECOption } from "../types/frontend";
import { type RootState } from "../state/store";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  TimelineComponent,
  LegendComponent,
  LegendScrollComponent,
  LegendPlainComponent,
  DatasetComponent,
  CanvasRenderer,
  GraphicComponent,
  GaugeChart,
  MarkLineComponent,
  ToolboxComponent,
]);

type ChartsProps = {
  options: ECOption;
  series: ECOption["series"];
  dataset: ECOption["dataset"];
  width: number;
  height: number;
  isLoading?: boolean;
  className?: string;
  group?: string;
  error?: string;
};

export default function Chart(props: ChartsProps) {
  const {
    options,
    isLoading,
    dataset,
    series,
    className,
    group,
    width,
    height,
  } = props;
  const container = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<echarts.EChartsType | null>(null);
  const currentDataIndex = useRef<number | null>(null);
  const uiSettings = useSelector((state: RootState) => state.uiSettings);
  const darkMode = uiSettings.darkMode;
  useEffect(() => {
    const currentContainer = container.current;
    if (currentContainer !== null) {
      const chart = echarts.init(container.current, darkMode ? "dark" : null, {
        renderer: "canvas",
        height: 400,
      });
      chart.setOption({
        ...options,
        dataset,
        series,
        backgroundColor: darkMode ? "black" : undefined,
        tooltip:
          options.tooltip === undefined
            ? undefined
            : {
                ...(options.tooltip || {}),
                backgroundColor: darkMode ? "black" : undefined,
                textStyle: {
                  color: darkMode ? "white" : undefined,
                },
              },
      });
      if (group) {
        echarts.connect(group);
        chart.group = group;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chart.on("updateAxisPointer", (el: any) => {
        if (el.dataIndex !== undefined) {
          currentDataIndex.current = el.dataIndex;
        }
      });
      chart.resize({ width, height });
      chartInstance.current = chart;
      return () => chart.dispose();
    }
  }, [container.current, darkMode]);
  useEffect(() => {
    if (chartInstance.current !== null && dataset !== undefined) {
      chartInstance.current.setOption({ ...options, dataset, series });
      if (
        "source" in dataset &&
        dataset.source !== undefined &&
        currentDataIndex.current === null &&
        (dataset.source as Array<number>).length > 1
      ) {
        const dataIndex = (dataset.source as Array<number>).length - 2;
        setTimeout(() => {
          chartInstance.current?.dispatchAction({
            type: "showTip",
            seriesIndex: 0,
            dataIndex,
          });
        });
      }
    }
  }, [chartInstance.current, options, dataset, series]);

  return (
    <Paper className={className} style={{ position: "relative" }} elevation={5}>
      {props.error && (
        <Alert severity="error" className="absolute h-1/2 top-1/4 z-10 w-full">
          <AlertTitle>{props.error}</AlertTitle>
        </Alert>
      )}
      {isLoading && <CircularLoading />}
      <div ref={container} className="w-full" />
    </Paper>
  );
}
