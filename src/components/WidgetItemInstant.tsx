/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useRef } from "react";
import { useInView } from "react-intersection-observer";
import {
  type DashboardMetricId,
  type DashboardMetric,
  type InstantWidget,
  type Widget,
  JsItems,
  type ItemId,
} from "@continuousc/relation-graph";
import { useSelector } from "react-redux";
import { trace, Span } from "@opentelemetry/api";

import Chart from "./Chart";

import { WIDGET_DIMENSIONS } from "../constants";
import * as chartUtils from "../utils/chart";
import * as services from "../services";
import * as maybeLoading from "../utils/maybeLoading";

import { QueryKey, type MetricSources } from "../types/frontend";
import { type RootState } from "../state/store";

interface WidgetInstantProps {
  items: maybeLoading.MaybeLoading<JsItems>;
  itemType: maybeLoading.MaybeLoading<string | undefined>;
  metrics: { [key: DashboardMetricId]: DashboardMetric };
  definition: Widget<InstantWidget>;
  sources: MetricSources;
  itemId: ItemId;
}

export default function WidgetItemInstant(props: WidgetInstantProps) {
  const spans = useRef<{
    [key: string]: {
      span: Span;
      endTime?: Date;
      timeout?: ReturnType<typeof setTimeout>;
    };
  }>({});
  const key = "WidgetItemInstant";
  const tracer = trace.getTracer("default");
  if (spans.current[key] === undefined) {
    spans.current[key] = { span: tracer.startSpan("loadWidgetItemInstant") };
  }
  const { span: loadSpan } = spans.current[key];

  const { ref, inView } = useInView();

  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );

  const metricsData = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.InstantMetric,
    queryArgs: {
      items: props.items,
      itemType: props.itemType,
    },
    extraDeps: [
      datetimeFilter.datetimePointInTime.absolute,
      props.definition,
      props.sources,
      props.itemId,
    ],
    queryFn: async ({ items, itemType }) => {
      if (itemType !== undefined) {
        const promMetrics = Object.fromEntries(
          chartUtils
            .getPromMetrics(props.definition)
            .map((m) => [m, props.metrics[m]])
        );
        const promItems = Array.from(
          new Set(Object.values(promMetrics).map((metric) => metric.item))
        );
        const queries = Object.fromEntries(
          promItems.map((item) => [
            item,
            items.getPrometheusQuery(props.itemId, item),
          ])
        );
        const dataFetch = await services.getMetricsInstantBulk(
          promMetrics,
          queries,
          props.sources,
          datetimeFilter.datetimePointInTime.absolute
        );
        return Object.fromEntries(
          Object.entries(promMetrics).map(([id, metric]) => [
            id,
            items.getInstantMetrics(itemType, metric.item, dataFetch[id]),
          ])
        );
      }
      return null;
    },
    update: inView,
  });

  const data = maybeLoading.useMemo(
    { metricsData },
    ({ metricsData }) => {
      if (metricsData !== undefined) {
        const promMetric = chartUtils.getPromItem(props.definition);
        const data =
          metricsData !== undefined &&
          metricsData !== null &&
          promMetric !== undefined
            ? metricsData[promMetric]
            : undefined;
        if (data !== undefined) {
          if (data.length === 1) {
            return data[0];
          } else if (data?.length > 1) {
            console.warn(
              "More than one data point found for WidgetItemInstant"
            );
            return data[0];
          }
        } else {
          console.warn("No data point found for WidgetItemInstant");
          return undefined;
        }
      }
    },
    [props.definition]
  );

  const series = maybeLoading.useMemo(
    { data },
    ({ data }) =>
      data !== undefined
        ? chartUtils.getInstantSeries({
            definition: props.definition,
            metrics: props.metrics,
            timezone: datetimeFilter.timezone,
            locale: datetimeFilter.locale,
            data,
          })
        : undefined,
    [
      props.definition,
      props.metrics,
      datetimeFilter.timezone,
      datetimeFilter.locale,
    ]
  );
  const options = maybeLoading.useMemo(
    { data },
    ({ data }) =>
      data !== undefined
        ? chartUtils.getItemInstantOptions(
            props.metrics,
            props.definition,
            data
          )
        : {},
    [props.metrics, props.definition]
  );
  const error = maybeLoading.getError(data);
  return (
    <div ref={ref} className={WIDGET_DIMENSIONS[1].widthTailwind}>
      <Chart
        options={maybeLoading.getDataOr(options, {})}
        series={maybeLoading.getData(series)}
        dataset={maybeLoading.getData(data)}
        isLoading={maybeLoading.isLoading(series)}
        className="w-full"
        width={WIDGET_DIMENSIONS[1].width}
        height={WIDGET_DIMENSIONS[1].height}
        error={error}
      />
    </div>
  );
}
