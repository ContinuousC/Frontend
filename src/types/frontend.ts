/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import {
  type RelationId,
  type ItemId,
  type SourceId,
  type QualifiedItemName,
  type Severity,
  type Status,
  type Bin,
  type EventType as ChangeEventType,
  type AlertEvent as AlertEventApi,
  type ChangeEvent as ChangeEventApi,
  type StatusEvent as StatusEventApi,
  type Metric,
  type DataPoint2,
  type TraceMetric,
  type Value,
} from "@continuousc/relation-graph";
import { type SvgIconComponent } from "@mui/icons-material";
import { type SvgIconTypeMap } from "@mui/material";
import { AlertColor } from "@mui/material/Alert";
import * as echarts from "echarts/core";
import {
  type GridComponentOption,
  type TooltipComponentOption,
  type TitleComponentOption,
  type TimelineComponentOption,
  type LegendComponentOption,
  type DatasetComponentOption,
  type MarkLineComponentOption,
  type ToolboxComponentOption,
} from "echarts/components";
import { type LineSeriesOption, type GaugeSeriesOption } from "echarts/charts";

export enum SearchParamsValuesView {
  DatetimeStart = "datetimeStart",
  DatetimeEnd = "datetimeEnd",
  DatetimePointInTime = "datetimePointInTime",
  ViewContext = "viewContext",
  ViewItemTypeContext = "viewManagedObjectContext",
  ItemType = "managedObjectType",
  DateTimeInterval = "interval",
  Topology = "topology",
  TopologyItem = "topologyItem",
  ItemId = "itemId",
  GridFilterStatus = "gridStatus",
  GridFilterName = "gridName",
  GridtFilterStatusByEqual = "gridFilterStatusByEqual",
  GridtFilterByManagedObjectType = "gridFilterByManagedObjectType",
  ChangeEventSource = "changeEventSource",
  ShowEvents = "showEvents",
  TableStatus = "tableStatus",
  ItemContext = "itemContext",
  FilterElementsByTopology = "filterElementsByTopology",
  TopologyStatus = "topologyStatus",
  TopologyLimit = "topologyLimit",
  OpenAlertsIncludeChildren = "openAlertsIncludeChildren",
}

export enum QueryKey {
  Packages = "Packages",
  PackageList = "PackageList",
  Package = "Package",
  ItemInfo = "ItemInfo",
  ItemList = "ItemList",
  RelationList = "RelationList",
  PromItemList = "PromItemList",
  RelationInfo = "RelationInfo",
  SelectorCtx = "SelectorCtx",
  ConnPackage = "ConnPackage",
  ConnPackageList = "ConnPackageList",
  Views = "Views",
  View = "View",
  InfoQuery = "InfoQuery",
  ViewElements = "ViewElements",
  Bins = "Bins",
  AllChangeBins = "AllChangeBins",
  AllStatusBins = "AllStatusBins",
  AllAlertBins = "AllAlertBins",
  OpenAlertsChangeBins = "OpenAlertsChangeBins",
  OpenAlertsStatusBins = "OpenAlertsStatusBins",
  OpenAlertsAlertBins = "OpenAlertsAlertBins",
  ItemChangeBins = "ItemChangeBins",
  ItemStatusBins = "ItemStatusBins",
  ItemAlertBins = "ItemAlertBins",
  TopologyChangeBins = "TopologyChangeBins",
  TopologyStatusBins = "TopologyStatusBins",
  TopologyAlertBins = "TopologyAlertBins",
  TableChangeBins = "TableChangeBins",
  TableStatusBins = "TableStatusBins",
  TableAlertBins = "TableAlertBins",
  GridChangeBins = "GridChangeBins",
  GridStatusBins = "GridStatusBins",
  GridAlertBins = "GridAlertBins",
  ItemInstantMetric = "ItemInstantMetric",
  ItemRangeMetric = "ItemRangeMetric",
  ItemTypeInstantMetric = "ItemTypeInstantMetric",
  ItemTypeRangeMetric = "ItemTypeRangeMetric",
  InstantMetric = "InstantMetric",
  RangeMetric = "RangeMetric",
  TableMetric = "TableMetric",
  RawMetrics = "RawMetrics",
  Events = "Events",
  SourceMetric = "SourceMetric",
  AlertRules = "AlertRules",
  AlertRuleSpec = "AlertRuleSpec",
  ItemOpenAlerts = "ItemOpenAlerts",
  AlertRuleFormSave = "AlertRuleFormSave",
  AlertRuleFormDelete = "AlertRuleFormDelete",
  AlertRuleFormAddNewTemplate = "AlertRuleFormAddNewTemplate",
  AlertRuleSelectors = "AlertRuleSelectors",
  AlertRuleSelectorsLabelValues = "AlertRuleSelectorsLabelValues",
  PromItems = "PromItems",
  OpenAlerts = "OpenAlerts",
  OpenAlertsAll = "OpenAlertsAll",
  AppVersion = "AppVersion",
  UserInfo = "UserInfo",
  Dashboard = "Dashboards",
  StatusCardInfo = "StatusCardInfo",
  PromSchemaTree = "PromSchemaTree",
  PromSchemaModules = "PromSchemaModules",
  PromSchemaModule = "PromSchemaModule",
  PromSchemaItem = "PromSchemaItem",
  PromSchemaItems = "PromSchemaItems",
  PromSchemaMetrics = "PromSchemaMetrics",
  PromSchemaGenModules = "PromSchemaGenModules",
  PromSchemaGenModule = "PromSchemaGenModule",
  ItemTypeView = "ItemTypeView",
  GetPromLabels = "GetPromLabels",
  GetPromLabelValues = "GetPromLabelValues",
}

export type SidebarMode = "mini" | "expanded";

export type optionValue = string | string[] | null;

export interface RelativeDateTime {
  value: number | "startOf";
  unit: DateTimeUnit | "now";
}

export interface DateTime {
  type: "absolute" | "relative";
  absolute: string;
  relative: RelativeDateTime;
}

export type DateTimeInterval = "auto" | DateTimeUnit;

export interface TimeAxisInterval {
  minors: {
    step: number;
    dateTimeUnit: DateTimeUnit;
    values: TimeAxisIntervalValue[];
  };
  majors: null | {
    dateTimeUnit: DateTimeUnit;
    values: TimeAxisIntervalValue[];
  };
}

export interface TimeAxisIntervalValue {
  label: string;
  inRange: boolean;
  timestamp: string;
}

export interface FilteredItems {
  itemIds: ItemId[];
  relationIds: RelationId[];
}

export interface TimeScale {
  dateTimeUnit: DateTimeUnit;
  dateTimeUnitData: DateTimeUnit;
  step: number;
  stepData: number;
  majorDateTimeUnit: DateTimeUnit | null;
  minorFormat: string;
  majorFormat: string | null;
}

export interface BinData {
  x0: Date;
  x1: Date;
  x: Date;
  _x: Date;
  y: number;
  _y: number;
  count: number;
  dateFormated: string;
  timeFormated: string;
  startDateISO: string;
  endDateISO: string;
}

export interface ChangeEvent {
  id: string;
  itemId?: string;
  elementKind: "item" | "relation";
  elementType: string;
  elementName: string;
  changeType: ChangeEventType;
  timestamp: string;
}

export interface StatusEvent {
  id: string;
  itemId?: string;
  elementKind: "item" | "relation";
  elementType: string;
  elementName: string;
  timestamp: string;
  status: Status;
  previous?: Status;
}

export interface AlertEvent {
  id: string;
  itemId?: string;
  elementKind?: "item" | "relation";
  elementType?: string;
  elementName?: string;
  timestamp: string;
  alertName: string;
  severity: Severity;
  summary: string | undefined;
  description: string | undefined;
}

export type ChangeEventSource = "status" | "configuration";

export type ItemTypeToName = {
  [key: string]: { singular: string; plural: string };
};

export type ChangeEventResponse =
  | {
    changeEventSource: "configuration";
    events: ChangeEventApi[];
    bins: Bin[];
  }
  | { changeEventSource: "alert"; events: AlertEventApi[]; bins: Bin[] }
  | { changeEventSource: "status"; events: StatusEventApi[]; bins: Bin[] };

export interface BinInfoInput {
  configuration: Bin[];
  status: Bin[];
  isFetching: boolean;
}

export interface IconColumn<T> {
  value: T;
  text: string;
  Icon: SvgIconComponent;
  iconColor?: SvgIconTypeMap["props"]["color"];
  statusColor?: string;
}

export interface AlertMessage {
  severity: AlertColor;
  title: string;
  subTitle?: string;
}

export type ValueOf<T> = T[keyof T];
export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export type MetricSources = {
  [key: QualifiedItemName]: SourceId;
};

export type DateTimeUnit =
  | "year"
  | "quarter"
  | "month"
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second"
  | "millisecond";

export type DateTimeUnitFixed =
  | "year"
  | "quarter"
  | "month"
  | "weekNumber"
  | "day"
  | "hour"
  | "minute"
  | "second"
  | "millisecond";

export type UserInfo = {
  email_verified: boolean;
  name: string;
  family_name: string;
  email: string;
  active_organization: {
    name: string;
    role: string[];
    id: string;
    attribute: Record<string, string[]>;
  };
  organization_attribute: {
    [key: string]: { name: string; attribute: Record<string, string[]> };
  };
  organization_role: { [key: string]: { name: string; roles: string[] } };
};

export type ECOption = echarts.ComposeOption<
  | GridComponentOption
  | TitleComponentOption
  | TooltipComponentOption
  | TimelineComponentOption
  | LegendComponentOption
  | DatasetComponentOption
  | LineSeriesOption
  | GaugeSeriesOption
  | MarkLineComponentOption
  | ToolboxComponentOption
>;

export type AnomalyData =
  | {
    metric: {
      metric: TraceMetric;
      mean: Metric<DataPoint2<Value>[]>[];
      mean_reference_interval?: Metric<DataPoint2<Value>[]>[];
      confidence_interval?: Metric<DataPoint2<Value>[]>[];
    };
  }
  | { score: Metric<DataPoint2<Value>[]>[] }
  | {
    metricTop: {
      metric: TraceMetric;
      mean: Metric<DataPoint2<Value>[]>[];
    };
  }
  | { scoreTop: Metric<DataPoint2<Value>[]>[] };

export interface HandleQueryParams {
  filterName: string;
  values?: string[];
}
