/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import axios from "axios";
import {
  type Elements,
  type RelationId,
  type ItemId,
  type Views,
  type View,
  type ViewId,
  type InfoQuery,
  type InfoQueryParams,
  type InfoQueryMetrics,
  type DashboardMetricId,
  type DashboardMetric,
  type DataPoint2,
  type Value,
  type Metrics,
  type SourceId,
  type SelectItem,
  type SingleVersioned,
  type ItemTypeId,
  type AlertRuleState,
  type PutAlertRuleForm,
  type Bin,
  type ItemsAugmented,
  type AlertDoc,
  type DashboardId,
  type Dashboards,
  type OverviewDashboard,
  type AggrStatusCounts,
  type Metric,
  type PackageData,
  TableMetricData,
} from "@continuousc/relation-graph";

import { TimeZone } from "./constants";

import {
  type ChangeEventSource,
  type ChangeEventResponse,
  type MetricSources,
  type DateTimeUnit,
  UserInfo,
} from "./types/frontend";

export async function getPackages(): Promise<PackageData> {
  const response = await axios.get("/api/packages");
  return response.data;
}

export async function getViews(): Promise<Views> {
  const response = await axios.get("/api/views");
  return response.data;
}

export async function getView(viewId: ViewId): Promise<View> {
  const response = await axios.get("/api/views/" + viewId);
  return response.data;
}

export async function getInfoQuery(
  query: InfoQuery,
  params: InfoQueryParams
): Promise<InfoQueryMetrics> {
  const response = await axios.post("/api/info-query/metrics", {
    query,
    params,
  });
  return response.data;
}

export async function getElements(
  elements: Elements,
  timestamp: string | null
): Promise<ItemsAugmented> {
  const reponse = await axios.post(
    timestamp === null ? "/api/elements" : `/api/elements/${timestamp}`,
    elements
  );
  return reponse.data;
}

const changeEventSourceMapToApi = {
  configuration: "changes",
  alert: "alerts",
  status: "status",
};

export async function getBins({
  changeEventSource,
  itemIds,
  relationIds,
  timestampStart,
  timestampEnd,
  dateTimeUnit,
  timezone,
  step,
}: {
  changeEventSource: ChangeEventSource;
  itemIds: ItemId[];
  relationIds: RelationId[];
  timestampStart: string;
  timestampEnd: string;
  dateTimeUnit: DateTimeUnit;
  timezone: TimeZone;
  step: number;
}): Promise<Bin[]> {
  const response = await axios.post(
    `/api/${changeEventSourceMapToApi[changeEventSource]}/bins`,
    {
      items: itemIds,
      relations: relationIds,
      timezone,
      interval: dateTimeUnit,
      from: timestampStart,
      to: timestampEnd,
      step,
    }
  );
  return response.data;
}

export async function getEvents({
  changeEventSource,
  itemIds,
  relationIds,
  timestampStart,
  timestampEnd,
  dateTimeUnit,
  timezone,
  step,
}: {
  changeEventSource: ChangeEventSource;
  itemIds: ItemId[];
  relationIds: RelationId[];
  timestampStart: string;
  timestampEnd: string;
  dateTimeUnit: DateTimeUnit;
  timezone: TimeZone;
  step: number;
}): Promise<ChangeEventResponse> {
  const response = await axios.post(
    `/api/${changeEventSourceMapToApi[changeEventSource]}/events`,
    {
      items: itemIds,
      relations: relationIds,
      timezone,
      interval: dateTimeUnit,
      from: timestampStart,
      to: timestampEnd,
      step,
    }
  );
  return {
    changeEventSource,
    events: response.data.events,
    bins: response.data.bins,
  };
}

export async function getMetricSources(
  promItem: DashboardMetric["item"]
): Promise<SourceId[]> {
  const response = await axios.get(`/api/metrics/sources/${promItem}`);
  return response.data;
}

export async function getMetricsInstantBulk(
  metrics: { [key: DashboardMetricId]: DashboardMetric },
  queries: { [key: string]: { [key: string]: string } } | null,
  sources: MetricSources,
  time: string
): Promise<TableMetricData> {
  const response = await axios.post(`/api/metrics/bulk/instant`, {
    time,
    metrics,
    sources,
    item_queries: queries,
  });
  return response.data;
}

export async function getMetricsRange(input: {
  metric: DashboardMetric;
  source: SourceId;
  select: SelectItem | null;
  item_keys: string[];
  start: string;
  end: string;
  step: number;
  item_query: { [key: string]: string } | null;
}): Promise<Metrics<DataPoint2<Value>[]>> {
  const response = await axios.post(`/api/metrics/range`, {
    start: input.start,
    end: input.end,
    step: input.step,
    source: input.source,
    select: input.select,
    item_keys: input.item_keys,
    item_query: input.item_query,
    ...input.metric,
  });
  return response.data;
}

export async function getMetricsRangeRaw(
  query: string,
  start: string,
  end: string,
  step: number
): Promise<Metric<DataPoint2<Value>[]>[]> {
  const response = await axios.post("/api/metrics/range_raw", {
    query,
    start,
    end,
    step,
  });
  return response.data;
}

export async function getItemOpenAlerts(
  itemId: ItemId,
  time: string | null,
  includeChildren?: boolean
): Promise<SingleVersioned<AlertDoc>[]> {
  const response = await axios.get(
    (time !== null
      ? `/api/alerts/item/${itemId}/${time}`
      : `/api/alerts/item/${itemId}`) +
      (includeChildren ? `?include_children=${includeChildren.toString()}` : "")
  );
  return response.data;
}

export async function getItemTypeOpenAlerts(
  item_type: ItemTypeId,
  time: string | null
): Promise<SingleVersioned<AlertDoc>[]> {
  const response = await axios.get(
    time !== null
      ? `/api/alerts/items/${item_type}/${time}`
      : `/api/alerts/items/${item_type}`
  );
  return response.data;
}

export async function getItemTypesOpenAlerts(
  item_types: ItemTypeId[],
  time: string | null
): Promise<SingleVersioned<AlertDoc>[]> {
  const response = await axios.post(
    time !== null ? `/api/alerts/item_types/${time}` : `/api/alerts/item_types`,
    item_types
  );
  return response.data;
}

export async function getOpenAlerts(
  time: string | null
): Promise<SingleVersioned<AlertDoc>[]> {
  const response = await axios.post(
    time !== null ? `/api/alerts/all/${time}` : `/api/alerts/all`
  );
  return response.data;
}

export async function getAlertRules(): Promise<string[]> {
  const response = await axios.get("/api/alert_rules");
  return response.data;
}

export async function getAlertRule(ruleForm: string): Promise<AlertRuleState> {
  const response = await axios.get(`/api/alert_rules/${ruleForm}`);
  return response.data;
}

export async function putAlertRule(
  ruleForm: string,
  data: PutAlertRuleForm
): Promise<void> {
  await axios.put(`/api/alert_rules/${ruleForm}`, data);
}

export async function deleteAlertRule(ruleForm: string): Promise<void> {
  await axios.delete(`/api/alert_rules/${ruleForm}`);
}

export async function getAlertRuleSelectorLabels(
  ruleForm: string
): Promise<string[]> {
  const response = await axios.get(`/api/alert_rules/${ruleForm}/selectors`);
  return response.data;
}

export async function getAlertRuleSelectorLabelValues(
  ruleForm: string,
  label: string
): Promise<string[]> {
  const response = await axios.get(
    `/api/alert_rules/${ruleForm}/selectors/${label}`
  );
  return response.data;
}

export async function getAppVersion(): Promise<string> {
  const response = await axios.get("/api/version");
  return response.data;
}

export async function getUserInfo(): Promise<UserInfo> {
  const response = await axios.get("/user-info");
  return response.data;
}

export async function getDashboards(): Promise<Dashboards> {
  const response = await axios.get("/api/dashboards");
  return response.data;
}

export async function getDashboard(
  dashboardId: DashboardId
): Promise<OverviewDashboard> {
  const response = await axios.get("/api/dashboards/" + dashboardId);
  return response.data;
}

export async function getStatusCardInfo(
  item_type: ItemTypeId,
  time: string | null,
  numberOfItems: number | null
): Promise<AggrStatusCounts> {
  const response = await axios.get(
    `/api/items/count/aggr-status/item-type/${encodeURIComponent(item_type)}${time !== null ? `/${encodeURIComponent(time)}` : ""}${numberOfItems !== null ? `?numberOfItems=${numberOfItems}` : ""}`
  );
  return response.data;
}

export async function getItemTypeView(item_type: ItemTypeId): Promise<ViewId> {
  const response = await axios.get(`/api/item/view/${item_type}`);
  return response.data;
}
