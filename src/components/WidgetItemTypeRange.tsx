/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useInView } from "react-intersection-observer";
import {
  type DashboardMetricId,
  type DashboardMetric,
  type Widget,
  type LineGraph,
  type JsItems,
} from "@continuousc/relation-graph";
import { trace, Span } from "@opentelemetry/api";

import Chart from "./Chart";

import { WIDGET_DIMENSIONS } from "../constants";
import * as chartUtils from "../utils/chart";
import * as timeUtils from "../utils/time";
import * as services from "../services";
import * as maybeLoading from "../utils/maybeLoading";

import { type RootState } from "../state/store";
import { QueryKey, type MetricSources } from "../types/frontend";

interface WidgetItemTypeRangeProps {
  items: maybeLoading.MaybeLoading<JsItems>;
  itemType: maybeLoading.MaybeLoading<string | null>;
  metrics: { [key: DashboardMetricId]: DashboardMetric };
  definition: Widget<LineGraph>;
  sources: MetricSources;
  id: string;
  panelName?: string;
}

export default function WidgetItemTypeRange(props: WidgetItemTypeRangeProps) {
  const spans = useRef<{
    [key: string]: {
      span: Span;
      endTime?: Date;
      timeout?: ReturnType<typeof setTimeout>;
    };
  }>({});
  const key = "WidgetItemTypeRange";
  const tracer = trace.getTracer("default");
  if (spans.current[key] === undefined) {
    spans.current[key] = { span: tracer.startSpan("WidgetItemTypeRange") };
  }
  const { span: loadSpan } = spans.current[key];

  const { ref, inView } = useInView();

  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );

  const promMetric = maybeLoading.useMemo(
    {},
    () => {
      const metric = chartUtils.getPromItem({
        widget_type: "lines",
        ...props.definition,
      });
      return metric ? props.metrics[metric] : undefined;
    },
    [props.definition, props.metrics]
  );
  const source = maybeLoading.useMemo(
    { promMetric },
    ({ promMetric }) => {
      return promMetric !== undefined
        ? props.sources[promMetric.item]
        : undefined;
    },
    [props.sources]
  );
  const metricsData = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.RangeMetric,
    queryArgs: {
      promMetric,
      items: props.items,
      itemType: props.itemType,
      source,
    },
    extraDeps: [
      props.id,
      datetimeFilter.datetimeStart.absolute,
      datetimeFilter.datetimeEnd.absolute,
      props.definition,
    ],
    queryFn: async ({ promMetric, items, itemType, source }) => {
      if (
        source !== undefined &&
        promMetric !== undefined &&
        itemType !== null
      ) {
        const step =
          (timeUtils.getIntervalInSeconds(
            datetimeFilter.datetimeStart.absolute,
            datetimeFilter.datetimeEnd.absolute
          ) /
            400) *
          5;
        const data = await services.getMetricsRange({
          metric: promMetric,
          source,
          select: props.definition.select,
          item_keys: items.getMetricKeys(itemType, promMetric.item),
          start: datetimeFilter.datetimeStart.absolute,
          end: datetimeFilter.datetimeEnd.absolute,
          step,
          item_query: null,
        });
        const dataset = items.getRangeMetrics(itemType, promMetric.item, data);
        return {
          seriesLength: dataset[0].length - 1,
          dataset: { source: dataset },
        };
      }
      return null;
    },
    update: inView,
  });
  const series = maybeLoading.useMemo(
    { metricsData },
    ({ metricsData }) => {
      if (metricsData !== null) {
        return chartUtils.getItemTypeRangeSeries(
          {
            widget_type: "lines",
            ...props.definition,
          },
          metricsData.seriesLength,
          datetimeFilter.datetimePointInTime.absolute,
          datetimeFilter.timezone,
          datetimeFilter.locale
        );
      }
    },
    [props.definition, datetimeFilter.datetimePointInTime.absolute]
  );
  const options = useMemo(
    () =>
      chartUtils.getItemTypeRangeOptions(
        props.metrics,
        {
          widget_type: "lines",
          ...props.definition,
        },
        {
          start: datetimeFilter.datetimeStart.absolute,
          end: datetimeFilter.datetimeEnd.absolute,
        }
      ),
    [
      props.metrics,
      props.definition,
      datetimeFilter.datetimeStart.absolute,
      datetimeFilter.datetimeEnd.absolute,
    ]
  );
  const error = maybeLoading.getError(metricsData);
  return (
    <div ref={ref} className={WIDGET_DIMENSIONS[2].widthTailwind}>
      <Chart
        options={options}
        series={maybeLoading.getData(series)}
        dataset={maybeLoading.getData(metricsData)?.dataset}
        isLoading={maybeLoading.isLoading(series)}
        className="h-full w-full"
        width={WIDGET_DIMENSIONS[2].width}
        height={WIDGET_DIMENSIONS[2].height}
        group={props.panelName}
        error={error}
      />
    </div>
  );
}
