/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useRef } from "react";
import { useInView } from "react-intersection-observer";
import {
  type DashboardMetricId,
  type DashboardMetric,
  type Widget,
  type ItemRangeWidget,
  type JsItems,
  type ItemId,
} from "@continuousc/relation-graph";
import { useSelector } from "react-redux";
import { trace, Span } from "@opentelemetry/api";

import Chart from "./Chart";

import { WIDGET_DIMENSIONS } from "../constants";
import * as chartUtils from "../utils/chart";
import * as timeUtils from "../utils/time";
import * as services from "../services";
import * as maybeLoading from "../utils/maybeLoading";

import { type RootState } from "../state/store";
import { QueryKey, type MetricSources } from "../types/frontend";

interface WidgetItemRangeProps {
  items: maybeLoading.MaybeLoading<JsItems>;
  metrics: { [key: DashboardMetricId]: DashboardMetric };
  definition: Widget<ItemRangeWidget>;
  sources: MetricSources;
  id: string;
  itemType: maybeLoading.MaybeLoading<string | undefined>;
  itemId: ItemId;
  panelName?: string;
}

export default function WidgetItemRange(props: WidgetItemRangeProps) {
  const spans = useRef<{
    [key: string]: {
      span: Span;
      endTime?: Date;
      timeout?: ReturnType<typeof setTimeout>;
    };
  }>({});
  const key = "WidgetItemRange";
  const tracer = trace.getTracer("default");
  if (spans.current[key] === undefined) {
    spans.current[key] = { span: tracer.startSpan("WidgetItemRange") };
  }
  const { span: loadSpan } = spans.current[key];

  const { ref, inView } = useInView();

  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );

  const promMetric = maybeLoading.useMemo(
    {},
    () => {
      const metric = chartUtils.getItemRangeMetrics(props.definition);
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
      props.sources,
      props.itemId,
      props.definition,
    ],
    queryFn: async ({ items, promMetric, itemType, source }) => {
      if (
        promMetric !== undefined &&
        itemType !== undefined &&
        source !== undefined
      ) {
        const step =
          (timeUtils.getIntervalInSeconds(
            datetimeFilter.datetimeStart.absolute,
            datetimeFilter.datetimeEnd.absolute
          ) /
            400) *
          5;
        const itemQuery = items.getPrometheusQuery(
          props.itemId,
          promMetric.item
        );
        const itemKeys = items.getMetricKeys(itemType, promMetric.item);
        const data = await services.getMetricsRange({
          metric: promMetric,
          source,
          select: null,
          item_keys: itemKeys,
          start: datetimeFilter.datetimeStart.absolute,
          end: datetimeFilter.datetimeEnd.absolute,
          step,
          item_query: itemQuery,
        });
        return { source: items.getItemRangeMetrics(data) };
      }
    },
    update: inView,
  });
  const series = maybeLoading.useMemo(
    { metricsData },
    ({ metricsData }) =>
      metricsData !== undefined
        ? chartUtils.getItemSeries(
            props.definition,
            metricsData,
            datetimeFilter.datetimePointInTime.absolute,
            datetimeFilter.timezone,
            datetimeFilter.locale
          )
        : [],
    [
      datetimeFilter.datetimePointInTime.absolute,
      props.definition,
      datetimeFilter.timezone,
      datetimeFilter.locale,
    ]
  );
  const options = maybeLoading.useMemo(
    {},
    () =>
      chartUtils.getItemRangeOptions(props.metrics, props.definition, {
        start: datetimeFilter.datetimeStart.absolute,
        end: datetimeFilter.datetimeEnd.absolute,
      }),
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
        options={maybeLoading.getDataOr(options, {})}
        series={maybeLoading.getData(series)}
        dataset={maybeLoading.getData(metricsData)}
        isLoading={maybeLoading.isLoading(metricsData)}
        className="w-full"
        width={WIDGET_DIMENSIONS[2].width}
        height={WIDGET_DIMENSIONS[2].height}
        group={props.panelName}
        error={error}
      />
    </div>
  );
}
