/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useRef } from "react";
import { useInView } from "react-intersection-observer";
import {
  type Widget,
  type AnomalyTracesGraph,
  type JsItems,
  type ItemId,
  type AnomalyTracesExpression,
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
import { QueryKey, type AnomalyData } from "../types/frontend";

interface WidgetAnomalyTracesProps {
  definition: Widget<AnomalyTracesGraph>;
  id: string;
  anomalyExpression: maybeLoading.MaybeLoading<AnomalyTracesExpression | null>;
  panelName?: string;
}

export default function WidgetAnomalyTraces(props: WidgetAnomalyTracesProps) {
  const spans = useRef<{
    [key: string]: {
      span: Span;
      endTime?: Date;
      timeout?: ReturnType<typeof setTimeout>;
    };
  }>({});
  const key = "itemOverview";
  const tracer = trace.getTracer("default");
  if (spans.current[key] === undefined) {
    spans.current[key] = { span: tracer.startSpan("loadItemOverview") };
  }
  const { span: loadSpan } = spans.current[key];

  const { ref, inView } = useInView();

  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );

  const metrics = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.RawMetrics,
    queryArgs: { anomalyExpression: props.anomalyExpression },
    extraDeps: [
      datetimeFilter.datetimeStart,
      datetimeFilter.datetimeEnd,
      props.definition,
    ],
    queryFn: async ({ anomalyExpression }) => {
      if (anomalyExpression !== null) {
        const step =
          (timeUtils.getIntervalInSeconds(
            datetimeFilter.datetimeStart.absolute,
            datetimeFilter.datetimeEnd.absolute
          ) /
            400) *
          5;
        let metrics: AnomalyData;
        if (
          "metric" in anomalyExpression &&
          props.definition.graph_type.graph === "metric"
        ) {
          const mean = await services.getMetricsRangeRaw(
            anomalyExpression.metric.mean,
            datetimeFilter.datetimeStart.absolute,
            datetimeFilter.datetimeEnd.absolute,
            step
          );
          metrics = {
            metric: {
              mean,
              metric: props.definition.graph_type.metric,
            },
          };
          if (anomalyExpression.metric.confidence_interval !== undefined) {
            const confidenceInterval = await services.getMetricsRangeRaw(
              anomalyExpression.metric.confidence_interval,
              datetimeFilter.datetimeStart.absolute,
              datetimeFilter.datetimeEnd.absolute,
              step
            );
            metrics.metric.confidence_interval = confidenceInterval;
          }
          if (anomalyExpression.metric.mean_reference_interval !== undefined) {
            const meanReferenceInterval = await services.getMetricsRangeRaw(
              anomalyExpression.metric.mean_reference_interval,
              datetimeFilter.datetimeStart.absolute,
              datetimeFilter.datetimeEnd.absolute,
              step
            );
            metrics.metric.mean_reference_interval = meanReferenceInterval;
          }
        } else if ("score" in anomalyExpression) {
          const score = await services.getMetricsRangeRaw(
            anomalyExpression.score,
            datetimeFilter.datetimeStart.absolute,
            datetimeFilter.datetimeEnd.absolute,
            step
          );
          metrics = { score };
        } else if (
          "metricTop" in anomalyExpression &&
          props.definition.graph_type.graph === "metric"
        ) {
          const metricTop = await services.getMetricsRangeRaw(
            anomalyExpression.metricTop,
            datetimeFilter.datetimeStart.absolute,
            datetimeFilter.datetimeEnd.absolute,
            step
          );
          metrics = {
            metricTop: {
              mean: metricTop,
              metric: props.definition.graph_type.metric,
            },
          };
        } else if ("scoreTop" in anomalyExpression) {
          const scoreTop = await services.getMetricsRangeRaw(
            anomalyExpression.scoreTop,
            datetimeFilter.datetimeStart.absolute,
            datetimeFilter.datetimeEnd.absolute,
            step
          );
          metrics = { scoreTop };
        } else {
          throw Error("Anomaly graph type not implemented");
        }
        return metrics;
      }
      return null;
    },
    update: inView,
  });

  const graphData = maybeLoading.useMemo(
    { metrics },
    ({ metrics }) =>
      metrics !== null
        ? {
            series: chartUtils.getAnomalySeries(
              metrics,
              datetimeFilter.datetimePointInTime.absolute,
              datetimeFilter.timezone,
              datetimeFilter.locale
            ),
            dataset: chartUtils.getAnomalyDataset(metrics),
          }
        : { series: undefined, dataset: undefined },
    [
      datetimeFilter.datetimePointInTime.absolute,
      datetimeFilter.timezone,
      datetimeFilter.locale,
    ]
  );
  const options = maybeLoading.useMemo(
    {},
    () =>
      chartUtils.getAnomalyOptions(props.definition, {
        start: datetimeFilter.datetimeStart.absolute,
        end: datetimeFilter.datetimeEnd.absolute,
      }),
    [
      props.definition,
      datetimeFilter.datetimeStart.absolute,
      datetimeFilter.datetimeEnd.absolute,
    ]
  );
  const error = maybeLoading.getError(graphData);
  return (
    <div ref={ref} className={WIDGET_DIMENSIONS[2].widthTailwind}>
      <Chart
        options={maybeLoading.getDataOr(options, {})}
        series={maybeLoading.getData(graphData)?.series}
        dataset={maybeLoading.getData(graphData)?.dataset}
        className="w-full"
        width={WIDGET_DIMENSIONS[2].width}
        height={WIDGET_DIMENSIONS[2].height}
        isLoading={maybeLoading.isLoading(graphData)}
        group={props.panelName}
        error={error}
      />
    </div>
  );
}

interface WidgetItemAnomalyTracesProps {
  items: maybeLoading.MaybeLoading<JsItems>;
  definition: Widget<AnomalyTracesGraph>;
  id: string;
  itemId: ItemId;
  panelName?: string;
}

export function WidgetItemAnomalyTraces(props: WidgetItemAnomalyTracesProps) {
  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );
  const anomalyExpression = maybeLoading.useMemo(
    { items: props.items },
    ({ items }) =>
      items.getAnomalyPromExpression(
        props.itemId,
        props.definition,
        datetimeFilter.datetimeStart.absolute,
        datetimeFilter.datetimeEnd.absolute
      ),
    [
      props.itemId,
      props.definition,
      datetimeFilter.datetimeStart.absolute,
      datetimeFilter.datetimeEnd.absolute,
    ]
  );
  return (
    <WidgetAnomalyTraces
      definition={props.definition}
      id={props.id}
      anomalyExpression={anomalyExpression}
      panelName={props.panelName}
    />
  );
}

interface WidgetItemTypeAnomalyTracesProps {
  items: maybeLoading.MaybeLoading<JsItems>;
  itemType: maybeLoading.MaybeLoading<string | null>;
  definition: Widget<AnomalyTracesGraph>;
  id: string;
  panelName?: string;
}

export function WidgetItemTypeAnomalyTraces(
  props: WidgetItemTypeAnomalyTracesProps
) {
  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );
  const anomalyExpression = maybeLoading.useMemo(
    { items: props.items, itemType: props.itemType },
    ({ items, itemType }) => {
      if (itemType !== null) {
        return items.getAnomalyPromExpressionType(
          itemType,
          props.definition,
          datetimeFilter.datetimeStart.absolute,
          datetimeFilter.datetimeEnd.absolute
        );
      }
      return null;
    },
    [
      props.definition,
      datetimeFilter.datetimeStart.absolute,
      datetimeFilter.datetimeEnd.absolute,
    ]
  );
  return (
    <WidgetAnomalyTraces
      definition={props.definition}
      id={props.id}
      anomalyExpression={anomalyExpression}
      panelName={props.panelName}
    />
  );
}
