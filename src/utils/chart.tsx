/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import {
  type TypeRangeWidget,
  type ItemRangeWidget,
  type InstantWidget,
  type JsRangeMetrics,
  type QualifiedItemName,
  type DashboardMetricId,
  type DashboardMetric,
  type Widget,
  JsDataPoint,
  JsUnit,
  type AnomalyTracesGraph,
  type Value,
  type ItemTypeDefinition,
} from "@continuousc/relation-graph";

import * as timeUtils from "../utils/time";
import {
  CRITICAL_COLOR,
  MAJOR_COLOR,
  MINOR_COLOR,
  SEVERITIES,
  TimeZone,
  WARNING_COLOR,
} from "../constants";

import { AnomalyData, ECOption } from "../types/frontend";

export function getItemTypeRangeSeries(
  definition: TypeRangeWidget,
  seriesLength: number,
  pointInTime: string,
  timezone: TimeZone,
  locale: string
): ECOption["series"] {
  const series: ECOption["series"] = [];
  if (definition.widget_type === "lines") {
    return Array(seriesLength)
      .fill(0)
      .map((_, i) => ({
        type: "line",
        showSymbol: false,
        connectNulls: false,
        encode: {
          x: 0,
          y: i + 1,
          seriesName: i + 1,
        },
        markLine:
          i === 0
            ? {
              symbol: "none",
              lineStyle: {
                type: "solid",
                width: 2,
                color: "blue",
              },
              data: [
                {
                  xAxis: pointInTime,
                  name: "Point in Time",
                  label: {
                    formatter: timeUtils.formatPointInTime(
                      pointInTime,
                      timezone,
                      locale
                    ),
                  },
                },
              ],
            }
            : undefined,
      }));
  }
  return series;
}

export function getInstantSeries({
  definition,
  metrics,
  timezone,
  locale,
  data,
}: {
  definition: InstantWidget;
  metrics: { [key: DashboardMetricId]: DashboardMetric };
  timezone: TimeZone;
  locale: string;
  data?: JsDataPoint;
}): ECOption["series"] {
  if (data !== undefined) {
    if (definition.widget_type === "meter") {
      const metric = metrics[definition.metric];
      const unit =
        metric.unit !== undefined ? new JsUnit(metric.unit) : undefined;
      return [
        {
          type: "gauge",
          progress: {
            show: true,
            width: 18,
          },
          axisTick: {
            show: false,
          },
          anchor: {
            show: true,
            showAbove: true,
            size: 25,
            itemStyle: {
              borderWidth: 10,
            },
          },
          detail: {
            fontSize: 20,
            offsetCenter: [0, "70%"],
            formatter: unit
              ? unit.format_value(data.value, metric.display_unit)
              : data.value.toString(),
          },
          min: definition.min,
          max: definition.max,
          title: {
            fontSize: 10,
            offsetCenter: [0, "85%"],
          },
          data: [
            {
              value: data.value,
              name: timeUtils.formatPointInTime(
                data.timestamp,
                timezone,
                locale
              ),
            },
          ],
        },
      ];
    }
  }
  return [];
}

export function getItemSeries(
  definition: ItemRangeWidget,
  data: {
    source: JsRangeMetrics;
  },
  pointInTime: string,
  timezone: TimeZone,
  locale: string
): ECOption["series"] {
  if (definition.widget_type === "lines") {
    const series: ECOption["series"] = data.source[0]
      .slice(1)
      .filter((name) => {
        if (!definition.min_max && (name === "min" || name === "max")) {
          return false;
        }
        if (name === "upperBound") {
          return false;
        }
        return true;
      })
      .map((name) => {
        if (name === "average") {
          return {
            type: "line",
            name,
            showSymbol: false,
            connectNulls: false,
            encode: {
              x: "time",
              y: name,
            },
            markLine: {
              symbol: "none",
              lineStyle: {
                type: "solid",
                width: 2,
                color: "blue",
              },
              data: [
                {
                  xAxis: pointInTime,
                  name: "Point in Time",
                  label: {
                    formatter: timeUtils.formatPointInTime(
                      pointInTime,
                      timezone,
                      locale
                    ),
                  },
                },
              ],
            },
          };
        } else if (name === "min") {
          return {
            type: "line",
            name,
            showSymbol: false,
            connectNulls: false,
            encode: {
              x: "time",
              y: name,
              tooltip: name,
            },
            lineStyle: {
              opacity: 0,
            },
            stack: "confidence-band",
          };
        } else if (name === "max") {
          return {
            type: "line",
            name,
            showSymbol: false,
            connectNulls: false,
            encode: {
              x: "time",
              y: "upperBound",
              tooltip: name,
            },
            lineStyle: {
              opacity: 0,
            },
            areaStyle: {
              color: "#ccc",
            },
            stack: "confidence-band",
          };
        } else {
          const severity =
            SEVERITIES.find((severity) => name.includes(severity)) || "warning";
          return {
            type: "line",
            name,
            showSymbol: false,
            connectNulls: false,
            encode: {
              x: "time",
              y: name,
            },
            lineStyle: {
              type: "dashed",
              color: {
                warning: WARNING_COLOR,
                minor: MINOR_COLOR,
                critical: CRITICAL_COLOR,
                major: MAJOR_COLOR,
              }[severity],
            },
            itemStyle: {
              color: {
                warning: WARNING_COLOR,
                minor: MINOR_COLOR,
                critical: CRITICAL_COLOR,
                major: MAJOR_COLOR,
              }[severity],
            },
          };
        }
      });
    return series;
  }
  return [];
}

const WELFORD_GRAPH_RESOLUTION: { [metric: string]: number } = {
  duration: 1e6,
  busy: 1e9,
  call_rate: 1,
  error_rate: 1,
};

export function getAnomalyDataset(metrics: AnomalyData): ECOption["dataset"] {
  let dataset: ECOption["dataset"] = {
    dimensions: [],
    source: {},
  };
  if ("metric" in metrics) {
    const factor = WELFORD_GRAPH_RESOLUTION[metrics.metric.metric];
    dataset = {
      dimensions: [
        { name: "timestamp", type: "time" },
        { name: "mean", type: "float" },
      ],
      source: [],
    };
    let confidenceInterval: {
      [k: string]: Value;
    } = {};
    if (metrics.metric.confidence_interval) {
      dataset?.dimensions?.push({ name: "lowerBound", type: "float" });
      dataset?.dimensions?.push({ name: "higherBound", type: "float" });
      dataset?.dimensions?.push({ name: "confidenceBand", type: "float" });
      confidenceInterval = Object.fromEntries(
        metrics.metric.confidence_interval[0]?.value.map((v) => [
          v.timestamp,
          v.value,
        ]) || []
      );
    }
    let referenceInterval: {
      [k: string]: Value;
    } = {};
    if (metrics.metric.mean_reference_interval) {
      dataset?.dimensions?.push({ name: "referenceMean", type: "float" });
      referenceInterval = Object.fromEntries(
        metrics.metric.mean_reference_interval[0]?.value.map((v) => [
          v.timestamp,
          v.value,
        ]) || []
      );
    }
    dataset.source =
      metrics.metric.mean[0]?.value.map((v) => {
        const timestamp = v.timestamp;
        const mean = parseFloat(v.value);
        const referenceMean =
          referenceInterval[timestamp] !== undefined
            ? parseFloat(referenceInterval[timestamp])
            : NaN;
        const ci =
          confidenceInterval[timestamp] !== undefined
            ? parseFloat(confidenceInterval[timestamp])
            : undefined;
        const lower = ci === undefined ? NaN : mean - ci > 0 ? mean - ci : 0;
        const higher = ci === undefined ? NaN : mean + ci;
        const lowerBound = lower / factor;
        const higherBound = higher / factor;
        const confidenceBand = higherBound - lowerBound;
        return {
          timestamp: timestamp,
          mean: mean / factor,
          referenceMean: referenceMean / factor,
          lowerBound,
          higherBound,
          confidenceBand,
        };
      }) || [];
  } else if ("score" in metrics) {
    dataset = {
      dimensions: [
        { name: "timestamp", type: "time" },
        { name: "score", type: "float" },
      ],
      source:
        metrics.score[0]?.value.map((v) => ({
          timestamp: v.timestamp,
          score: parseFloat(v.value),
        })) || [],
    };
  } else if ("metricTop" in metrics) {
    const factor = WELFORD_GRAPH_RESOLUTION[metrics.metricTop.metric];
    const groupedMetrics: {
      [k: string]: { [group: string]: number };
    } = {};
    const dimensions: {
      name: string;
      type: "number" | "float" | "int" | "ordinal" | "time" | undefined;
    }[] = [{ name: "timestamp", type: "time" }];
    let group: "operation_name" | "service_name" | null = null;
    metrics.metricTop.mean.forEach(({ value, metric }) => {
      if (group === null) {
        if ("operation_name" in metric) {
          group = "operation_name";
        } else if ("service_name" in metric) {
          group = "service_name";
        } else {
          throw Error(
            "Could not find operation_name or service_name key in metrics"
          );
        }
      }
      dimensions.push({
        name: metric[group],
        type: "float",
      });
      value.forEach((v) => {
        if (group === null) {
          throw Error(
            "Could not find operation_name or service_name key in metrics"
          );
        }
        if (!(v.timestamp in groupedMetrics)) {
          groupedMetrics[v.timestamp] = {};
        }
        groupedMetrics[v.timestamp][metric[group]] =
          parseFloat(v.value) / factor;
      });
    });
    const timestamps = Object.keys(groupedMetrics);
    timestamps.sort();
    dataset = {
      dimensions,
      source: timestamps.map((timestamp) => ({
        timestamp,
        ...groupedMetrics[timestamp],
      })),
    };
  } else if ("scoreTop" in metrics) {
    const groupedMetrics: {
      [k: string]: { [group: string]: number };
    } = {};
    const dimensions: {
      name: string;
      type: "number" | "float" | "int" | "ordinal" | "time" | undefined;
    }[] = [{ name: "timestamp", type: "time" }];
    let group: "operation_name" | "service_name" | null = null;
    metrics.scoreTop.forEach(({ value, metric }) => {
      if (group === null) {
        if ("operation_name" in metric) {
          group = "operation_name";
        } else if ("service_name" in metric) {
          group = "service_name";
        } else {
          throw Error(
            "Could not find operation_name or service_name key in metrics"
          );
        }
      }
      dimensions.push({
        name: metric[group],
        type: "float",
      });
      value.forEach((v) => {
        if (group === null) {
          throw Error(
            "Could not find operation_name or service_name key in metrics"
          );
        }
        if (!(v.timestamp in groupedMetrics)) {
          groupedMetrics[v.timestamp] = {};
        }
        groupedMetrics[v.timestamp][metric[group]] = parseFloat(v.value);
      });
    });
    const timestamps = Object.keys(groupedMetrics);
    timestamps.sort();
    dataset = {
      dimensions,
      source: timestamps.map((timestamp) => ({
        timestamp,
        ...groupedMetrics[timestamp],
      })),
    };
  }
  return dataset;
}

export function getAnomalySeries(
  metrics: AnomalyData,
  pointInTime: string,
  timezone: TimeZone,
  locale: string
): ECOption["series"] {
  if ("metric" in metrics) {
    const series: ECOption["series"] = [
      {
        name: "mean",
        type: "line",
        encode: {
          x: "timestamp",
          y: "mean",
        },
        symbol: "none",
        markLine: {
          symbol: "none",
          lineStyle: {
            type: "solid",
            width: 2,
            color: "blue",
          },
          data: [
            {
              xAxis: pointInTime,
              name: "Point in Time",
              label: {
                formatter: timeUtils.formatPointInTime(
                  pointInTime,
                  timezone,
                  locale
                ),
              },
            },
          ],
        },
      },
    ];
    if (metrics.metric.mean_reference_interval) {
      series.push({
        name: "mean reference",
        type: "line",
        encode: {
          x: "timestamp",
          y: "referenceMean",
        },
        symbol: "none",
      });
    }
    if (metrics.metric.confidence_interval) {
      series.push({
        name: "lower bound",
        type: "line",
        encode: {
          x: "timestamp",
          y: "lowerBound",
          tooltip: "lowerBound",
        },
        lineStyle: {
          opacity: 0,
        },
        stack: "confidence-band",
        symbol: "none",
      });
      series.push({
        name: "higher bound",
        type: "line",
        encode: {
          x: "timestamp",
          y: "confidenceBand",
          tooltip: "higherBound",
        },
        lineStyle: {
          opacity: 0,
        },
        areaStyle: {
          color: "#ccc",
        },
        stack: "confidence-band",
        symbol: "none",
      });
    }
    return series;
  } else if ("score" in metrics) {
    return [
      {
        name: "score",
        type: "line",
        encode: {
          x: "timestamp",
          y: "score",
        },
        symbol: "none",
        markLine: {
          symbol: "none",
          lineStyle: {
            type: "solid",
            width: 2,
            color: "blue",
          },
          data: [
            {
              xAxis: pointInTime,
              name: "Point in Time",
              label: {
                formatter: timeUtils.formatPointInTime(
                  pointInTime,
                  timezone,
                  locale
                ),
              },
            },
          ],
        },
      },
    ];
  } else if ("metricTop" in metrics) {
    return metrics.metricTop.mean.map(({ metric }, i) => ({
      name:
        "operation_name" in metric
          ? metric["operation_name"]
          : metric["service_name"],
      type: "line",
      encode: {
        x: "timestamp",
        y:
          "operation_name" in metric
            ? metric["operation_name"]
            : metric["service_name"],
      },
      symbol: "none",
      markLine:
        i === 0
          ? {
            symbol: "none",
            lineStyle: {
              type: "solid",
              width: 2,
              color: "blue",
            },
            data: [
              {
                xAxis: pointInTime,
                name: "Point in Time",
                label: {
                  formatter: timeUtils.formatPointInTime(
                    pointInTime,
                    timezone,
                    locale
                  ),
                },
              },
            ],
          }
          : undefined,
    }));
  } else if ("scoreTop" in metrics) {
    return metrics.scoreTop.map(({ metric }, i) => ({
      name:
        "operation_name" in metric
          ? metric["operation_name"]
          : metric["service_name"],
      type: "line",
      encode: {
        x: "timestamp",
        y:
          "operation_name" in metric
            ? metric["operation_name"]
            : metric["service_name"],
      },
      symbol: "none",
      markLine:
        i === 0
          ? {
            symbol: "none",
            lineStyle: {
              type: "solid",
              width: 2,
              color: "blue",
            },
            data: [
              {
                xAxis: pointInTime,
                name: "Point in Time",
                label: {
                  formatter: timeUtils.formatPointInTime(
                    pointInTime,
                    timezone,
                    locale
                  ),
                },
              },
            ],
          }
          : undefined,
    }));
  }
}

const METRIC_UNITS = {
  duration: new JsUnit("s"),
  busy: new JsUnit("s"),
  call_rate: { format_value: (n: number) => `${n.toFixed(2)} calls/min` },
  error_rate: {
    format_value: (n: number) => `${(n * 100).toFixed(2)}% errors`,
  },
};

export function getAnomalyOptions(
  definition: Widget<AnomalyTracesGraph>,
  timeRange: { start: string; end: string }
): ECOption {
  const unit =
    definition.graph_type.graph === "metric"
      ? METRIC_UNITS[definition.graph_type.metric]
      : undefined;
  return {
    toolbox: {
      feature: {
        saveAsImage: {},
      },
    },
    title: {
      text: definition.name,
      subtext: definition.documentation,
      left: "center",

      textStyle: {
        width: 400,
        overflow: "truncate",
        fontSize: 20,
      },
    },
    xAxis: {
      name: "time",
      type: "time",
      min: timeRange.start,
      max: timeRange.end,
      axisPointer: {
        label: {
          show: false,
        },
        handle: {
          show: true,
          size: 0,
          margin: 8,
        },
      },
    },
    yAxis: {
      name:
        definition.graph_type.graph === "metric"
          ? definition.graph_type.metric
          : "score",
      type: "value",
      scale: true,
      axisLabel: {
        formatter: (value: number) =>
          unit ? unit.format_value(value) : value.toFixed(2).toString(),
      },
    },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) =>
        value === null || value === undefined
          ? "-"
          : typeof value === "number"
            ? unit
              ? unit.format_value(value)
              : value.toFixed(2).toString()
            : value.toString(),
      axisPointer: {
        type: "line",
        axis: "x",
        label: {
          formatter: (params) =>
            timeUtils.formatPointInTime(
              new Date(params.value).toISOString(),
              "Europe/Brussels",
              "en-GB"
            ),
        },
      },
      textStyle: {
        fontSize: 10,
        width: 20,
      },
      showContent: true,
      alwaysShowContent: true,
      enterable: true,
      position: { bottom: 0, left: "auto", right: "auto" },
      confine: true,
      className:
        "h-28 overflow-auto absolute w-full left-0 bottom-0 translate-x-0",
      order: "valueDesc",
      extraCssText: "z-index: 0;",
    },
    grid: {
      top: 70,
      height: "50%",
      containLabel: true,
    },
  };
}

export function getPromItems(
  dashboardMetrics: ItemTypeDefinition["metrics"]
): QualifiedItemName[] {
  const promItems: Set<QualifiedItemName> = new Set();
  Object.values(dashboardMetrics).forEach((metric) => {
    promItems.add(metric.item);
  });
  return Array.from(promItems);
}

export function getPromItem(
  definition: InstantWidget | TypeRangeWidget
): DashboardMetricId | undefined {
  if (definition.widget_type === "lines") {
    return definition.metric;
  }
  if (definition.widget_type === "number") {
    return definition.metric;
  }
  if (definition.widget_type === "meter") {
    return definition.metric;
  }
  return undefined;
}

export function getItemRangeMetrics(
  definition: ItemRangeWidget
): DashboardMetricId | undefined {
  if (definition.widget_type === "lines") {
    return definition.metric;
  }
  return undefined;
}

export function getPromMetrics(widget: InstantWidget): DashboardMetricId[] {
  if (widget.widget_type === "number" || widget.widget_type === "meter") {
    return [widget.metric];
  } else if (widget.widget_type === "bar") {
    return widget.metrics;
  } else {
    return [];
  }
}

export function getItemTypeRangeOptions(
  metrics: { [key: DashboardMetricId]: DashboardMetric },
  definition: Widget<TypeRangeWidget>,
  timeRange: { start: string; end: string }
): ECOption {
  if (definition.widget_type === "lines") {
    const metric = metrics[definition.metric];
    const unit =
      metric.unit !== undefined ? new JsUnit(metric.unit) : undefined;
    return {
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      title: {
        text: definition.name,
        subtext: definition.documentation,
        left: "center",
        textStyle: {
          width: 400,
          overflow: "truncate",
          fontSize: 20,
        },
      },
      xAxis: {
        name: "Time",
        type: "time",
        min: timeRange.start,
        max: timeRange.end,
        axisPointer: {
          label: {
            show: false,
          },
          handle: {
            show: true,
            size: 0,
            margin: 8,
          },
        },
      },
      yAxis: {
        axisLabel: {
          formatter: (value: number) =>
            unit
              ? unit.format_value(value, metric.display_unit)
              : value.toString(),
        },
      },
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) =>
          value === null || value === undefined
            ? "-"
            : typeof value === "number" && unit
              ? unit.format_value(value, metric.display_unit)
              : value.toString(),
        axisPointer: {
          type: "line",
          axis: "x",
          label: {
            formatter: (params) =>
              timeUtils.formatPointInTime(
                new Date(params.value).toISOString(),
                "Europe/Brussels",
                "en-GB"
              ),
          },
        },
        textStyle: {
          fontSize: 10,
          width: 20,
        },
        showContent: true,
        alwaysShowContent: true,
        enterable: true,
        position: { bottom: 0, left: "auto", right: "auto" },
        confine: true,
        className:
          "h-28 overflow-auto absolute w-full left-0 bottom-0 translate-x-0",
        order: "valueDesc",
        extraCssText: "z-index: 0;",
      },
      grid: {
        top: 70,
        height: "50%",
        containLabel: true,
      },
    };
  } else {
    throw Error("widget type does not exist for item type range widget");
  }
}

export function getItemRangeOptions(
  metrics: { [key: DashboardMetricId]: DashboardMetric },
  definition: Widget<ItemRangeWidget>,
  timeRange: { start: string; end: string }
): ECOption {
  if (definition.widget_type === "lines") {
    const metric = metrics[definition.metric];
    const unit =
      metric.unit !== undefined ? new JsUnit(metric.unit) : undefined;
    return {
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      title: {
        text: definition.name,
        subtext: definition.documentation,
        left: "center",
        textStyle: {
          width: 400,
          overflow: "truncate",
          fontSize: 20,
        },
      },
      xAxis: {
        name: "Time",
        type: "time",
        min: timeRange.start,
        max: timeRange.end,
        axisPointer: {
          label: {
            show: false,
          },
          handle: {
            show: true,
            size: 0,
            margin: 8,
          },
        },
      },
      yAxis: {
        axisLabel: {
          formatter: (value: number) =>
            unit
              ? unit.format_value(value, metric.display_unit)
              : value.toString(),
        },
      },
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) =>
          value === null || value === undefined
            ? "-"
            : typeof value === "number" && unit
              ? unit.format_value(value, metric.display_unit)
              : value.toString(),
        axisPointer: {
          type: "line",
          axis: "x",
          label: {
            formatter: (params) =>
              timeUtils.formatPointInTime(
                new Date(params.value).toISOString(),
                "Europe/Brussels",
                "en-GB"
              ),
          },
        },
        textStyle: {
          fontSize: 10,
          width: 20,
        },
        showContent: true,
        alwaysShowContent: true,
        enterable: true,
        position: { bottom: 0, left: "auto", right: "auto" },
        confine: true,
        className:
          "h-28 overflow-auto absolute w-full left-0 bottom-0 translate-x-0",
        order: "valueDesc",
        extraCssText: "z-index: 0;",
      },
      grid: {
        top: 70,
        height: "50%",
        containLabel: true,
      },
    };
  } else {
    throw Error("widget type does not exist for item range widget");
  }
}

export function getItemInstantOptions(
  metrics: { [key: DashboardMetricId]: DashboardMetric },
  definition: Widget<InstantWidget>,
  jsDataPoint: JsDataPoint
): ECOption {
  if (definition.widget_type === "number") {
    const metric = metrics[definition.metric];
    const unit =
      metric.unit !== undefined ? new JsUnit(metric.unit) : undefined;
    return {
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      graphic: {
        elements: [
          {
            type: "text",
            left: "center",
            top: "center",
            style: {
              text: unit
                ? unit.format_value(
                  jsDataPoint?.value || 0,
                  metric.display_unit
                )
                : "",
              fontSize: 80,
              fontWeight: "bold",
              lineDash: [0, 200],
              lineDashOffset: 0,
              stroke: "#000",
              lineWidth: 1,
            },
          },
          {
            type: "text",
            left: "center",
            bottom: "30%",
            style: {
              text: jsDataPoint?.timestamp
                ? timeUtils.formatPointInTime(
                  jsDataPoint.timestamp,
                  "Europe/Brussels",
                  "en-GB"
                )
                : "-",
              fontSize: 20,
              fontWeight: "bold",
              lineDash: [0, 200],
              lineDashOffset: 0,
              stroke: "#000",
              lineWidth: 1,
            },
          },
        ],
      },
      title: {
        text: definition.name,
        subtext: definition.documentation,
        left: "center",
        textStyle: {
          width: 400,
          overflow: "truncate",
          fontSize: 20,
        },
      },
      grid: {
        top: 70,
        height: "50%",
        containLabel: true,
      },
    };
  } else if (definition.widget_type === "meter") {
    return {
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      title: {
        text: definition.name,
        subtext: definition.documentation,
        left: "center",
        textStyle: {
          width: 400,
          overflow: "truncate",
          fontSize: 20,
        },
      },
      grid: {
        top: 70,
        height: "100%",
        containLabel: true,
      },
    };
  } else {
    throw Error("widget type does not exist for item widget");
  }
}
