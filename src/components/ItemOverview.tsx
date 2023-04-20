/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import {
  memo,
  useMemo,
  useEffect,
  useRef,
  SyntheticEvent,
  useState,
} from "react";
import {
  type ItemId,
  type ItemExtendedData,
  type JsItems,
  type ItemTypeDefinition,
  type Status,
  type View,
  JsInfoQuery,
  JsStylesheet,
  JsTypes,
  JsQuery,
} from "@continuousc/relation-graph";
import { trace, Span } from "@opentelemetry/api";
import { useSelector } from "react-redux";
import BarChartIcon from "@mui/icons-material/BarChart";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import Paper from "@mui/material/Paper";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import { GraphData } from "@antv/g6";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import { ItemMetaData } from "./ItemInfo";
import Topology from "./Topology";
import DashboardItem from "./DashboardItem";
import TabPanel from "./TabPanel";
import OpenAlertsTable from "./OpenAlertsTable";

import * as services from "../services";
import { ITopologyContext, TopologyContext } from "../context";
import { type RootState } from "../state/store";
import { ITEM_OVERVIEW_CONTEXT, RANDOM_SPLITTER } from "../constants";
import * as topologyFilter from "../utils/topologyFilter";
import * as maybeLoading from "../utils/maybeLoading";
import * as generalUtils from "../utils/general";

import {
  HandleQueryParams,
  MetricSources,
  QueryKey,
  SearchParamsValuesView,
} from "../types/frontend";

type contexts = (typeof ITEM_OVERVIEW_CONTEXT)[number];
interface ItemOverviewProps {
  context: contexts;
  itemId: ItemId;
  itemData: maybeLoading.MaybeLoading<ItemExtendedData | false | undefined>;
  view: maybeLoading.MaybeLoading<View>;
  jsItems: maybeLoading.MaybeLoading<JsItems>;
  jsType: maybeLoading.MaybeLoading<JsTypes>;
  itemTypeDefinitions: maybeLoading.MaybeLoading<
    ItemTypeDefinition | undefined
  >;
  metricSource: MetricSources;
  topologyStatusFilter: Status;
  topologyLimit: number;
  onClickItem: (itemId: ItemId) => void;
  setSearchParams: (params: HandleQueryParams | HandleQueryParams[]) => void;
  searchParams: URLSearchParams;
  onChangeContext: (context: contexts) => void;
  setItemIds: (itemId: ItemId[]) => void;
}
const TOPOLOGY_FILTER_PREFIX = "topologyFilterItem_";
const ItemOverview = memo(function ItemOverview(props: ItemOverviewProps) {
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

  const uiSettings = useSelector((state: RootState) => state.uiSettings);
  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );
  const [openAlertItemIds, setOpenAlertItemIds] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      const searchParamsCurrent = new URLSearchParams(document.location.search);
      const deleteParams: HandleQueryParams[] = [
        { filterName: "item", values: [] },
      ];
      searchParamsCurrent.forEach((_value, key) => {
        if (key.includes(TOPOLOGY_FILTER_PREFIX)) {
          deleteParams.push({
            filterName: key,
            values: [],
          });
        }
      });
      props.setSearchParams(deleteParams);
    };
  }, []);

  //TOPOLOGY
  const topologies = maybeLoading.useMemo(
    { itemTypeDefinitions: props.itemTypeDefinitions },
    ({ itemTypeDefinitions }) => {
      if (
        itemTypeDefinitions?.topologies &&
        Object.entries(itemTypeDefinitions?.topologies).length > 0
      ) {
        return itemTypeDefinitions.topologies;
      } else {
        return {
          "Managed Object Types": JsTypes.getItemDefaultTopology(props.itemId),
        };
      }
    },
    [props.itemId]
  );
  const topology = maybeLoading.useMemo(
    { topologies },
    ({ topologies }) => {
      const topologyFromSearchParams = props.searchParams.get(
        SearchParamsValuesView.TopologyItem
      );
      if (
        topologies &&
        topologyFromSearchParams &&
        topologyFromSearchParams in topologies
      ) {
        return {
          topology: topologies[topologyFromSearchParams],
          topologyId: topologyFromSearchParams,
        };
      } else {
        return {
          topology: Object.values(topologies)[0],
          topologyId: Object.keys(topologies)[0],
        };
      }
    },
    [props.searchParams.get(SearchParamsValuesView.TopologyItem)]
  );

  const topologyFilterPrefixItemType = maybeLoading.useMemo(
    { itemData: props.itemData },
    ({ itemData }) => {
      if (itemData) {
        return (
          TOPOLOGY_FILTER_PREFIX + itemData.data.itemTypeName.singular + "_"
        );
      }
      return TOPOLOGY_FILTER_PREFIX;
    }
  );
  const topologyFilterSearchString = maybeLoading.useMemo(
    { topology, topologyFilterPrefixItemType },
    ({ topology, topologyFilterPrefixItemType }) =>
      topologyFilter.getFilterSearchParamsAsString(
        topology.topology,
        props.searchParams,
        topologyFilterPrefixItemType
      ),
    [props.searchParams]
  );
  const topologyFilters = maybeLoading.useMemo(
    { topologyFilterSearchString, topologyFilterPrefixItemType },
    ({ topologyFilterSearchString, topologyFilterPrefixItemType }) => {
      const searchParamsFilter = new URLSearchParams(
        topologyFilterSearchString
      );
      return topologyFilter.getFilterFromSearchParams(
        searchParamsFilter,
        topologyFilterPrefixItemType
      );
    }
  );
  const topologyInfo = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.InfoQuery,
    queryArgs: { topology },
    extraDeps: [
      datetimeFilter.datetimePointInTime,
      datetimeFilter.datetimeStart,
      datetimeFilter.datetimeEnd,
    ],
    queryFn: async ({ topology }) => {
      if (topology.topology.infoQuery) {
        return await services.getInfoQuery(topology.topology.infoQuery, {
          timestamp: datetimeFilter.datetimePointInTime.absolute,
          from: datetimeFilter.datetimeStart.absolute,
          to: datetimeFilter.datetimeEnd.absolute,
        });
      }
    },
  });
  const queryResult = maybeLoading.useQuery({
    loadSpan,
    queryKey: "runQuery",
    queryArgs: {
      jsType: props.jsType,
      jsItems: props.jsItems,
      topology,
      topologyFilters,
      topologyInfo,
    },
    extraDeps: [props.topologyStatusFilter, props.topologyLimit],
    queryFn: async ({
      jsType,
      jsItems,
      topology,
      topologyFilters,
      topologyInfo,
    }) => {
      const jsQuery = new JsQuery(jsType, topology.topology.query);
      const jsQueryResult = jsQuery.runWithFilters(
        jsItems,
        topologyFilters,
        props.topologyStatusFilter,
        props.topologyLimit
      );
      const jsQueryResultItems = jsQueryResult.getItems();
      const infoQueryResult =
        topology.topology.infoQuery && topologyInfo && jsQueryResultItems
          ? new JsInfoQuery(jsType, topology.topology.infoQuery).run(
              jsQueryResultItems,
              topologyInfo
            )
          : undefined;
      return {
        jsQueryResult,
        jsQueryResultItems,
        infoQueryResult,
      };
    },
  });

  const jsQueryResult = maybeLoading.extract("jsQueryResult", queryResult);
  const jsQueryResultItems = maybeLoading.extract(
    "jsQueryResultItems",
    queryResult
  );
  const infoQueryResult = maybeLoading.extract("infoQueryResult", queryResult);
  const possibleTopologyFiltersValues = maybeLoading.useMemo(
    { queryResult },
    ({ queryResult }) => queryResult.jsQueryResult?.getTemplateOptions() || {}
  );
  const topologyData = maybeLoading.useMemo(
    {
      view: props.view,
      jsType: props.jsType,
      topology,
      jsQueryResultItems,
      infoQueryResult,
    },
    ({ view, jsType, topology, jsQueryResultItems, infoQueryResult }) => {
      if (jsQueryResultItems !== undefined) {
        const data = jsQueryResultItems.getGraphData(
          new JsStylesheet(
            topology.topology.stylesheet || { items: [] },
            jsType
          ),
          infoQueryResult,
          uiSettings.darkMode,
          view.elements.external.item_types
        ) as GraphData;
        return data;
      }
      return { nodes: [], edges: [] };
    },
    [uiSettings.darkMode]
  );
  const overQueryLimit = maybeLoading.useMemo(
    { jsQueryResult },
    ({ jsQueryResult }) =>
      jsQueryResult !== undefined && jsQueryResult.getError() !== undefined,
    []
  );
  const topologyContextValue = useMemo<ITopologyContext>(
    () => ({
      setSearchParams: props.setSearchParams,
      onClickItem: props.onClickItem,
      topologyId: maybeLoading.getData(topology)?.topologyId || "",
      topologies: maybeLoading.getData(topologies) || {},
      topologyFilters: maybeLoading.getData(topologyFilters),
      possibleTopologyFiltersValues: maybeLoading.getData(
        possibleTopologyFiltersValues
      ),
      statusFilter: props.topologyStatusFilter,
      filterPrefix: maybeLoading.getData(topologyFilterPrefixItemType),
    }),
    [
      maybeLoading.getData(topologies),
      maybeLoading.getData(topology),
      maybeLoading.getData(topologyFilters),
      maybeLoading.getData(possibleTopologyFiltersValues),
      props.topologyStatusFilter,
      maybeLoading.getData(topologyFilterPrefixItemType),
    ]
  );

  //ALERTS
  const openAlertsIncludeChildren =
    props.searchParams.get(SearchParamsValuesView.OpenAlertsIncludeChildren) ===
    "true";
  const itemOpenAlerts = maybeLoading.useQuery({
    loadSpan,
    queryKey: "getOpenAlersItem",
    extraDeps: [
      datetimeFilter.datetimePointInTime,
      props.itemId,
      openAlertsIncludeChildren,
    ],
    queryArgs: {},
    queryFn: async () =>
      await services.getItemOpenAlerts(
        props.itemId,
        datetimeFilter.datetimePointInTime.relative.unit === "now"
          ? null
          : datetimeFilter.datetimePointInTime.absolute,
        openAlertsIncludeChildren
      ),
  });

  //Metrics
  const itemTypeDefinitions = maybeLoading.getData(props.itemTypeDefinitions);

  //ITEM INFO
  const itemType = maybeLoading.useMemo(
    { itemData: props.itemData },
    ({ itemData }) => {
      if (itemData) {
        return itemData.data.itemType;
      }
    }
  );

  useEffect(() => {
    if (props.context === "metrics") {
      props.setItemIds([props.itemId]);
    } else if (props.context === "openAlerts") {
      props.setItemIds(openAlertItemIds?.split(RANDOM_SPLITTER) || []);
    } else if (props.context === "topology") {
      const itemIds = maybeLoading.getData(
        maybeLoading.map(
          jsQueryResultItems,
          (jsQueryResultItems) => jsQueryResultItems?.getIds().items
        )
      );
      if (itemIds !== undefined) {
        props.setItemIds(itemIds);
      }
    }
  }, [props.context, openAlertItemIds]);

  const handleOnFilterOpenAlerts = useMemo(() => {
    return generalUtils.debounce(
      (itemIds: ItemId[]) =>
        setOpenAlertItemIds(itemIds.sort().join(RANDOM_SPLITTER)),
      1000
    );
  }, []);

  return (
    <div className="flex gap-2 w-full h-full p-2 overflow-hidden">
      <ItemMetaData itemData={props.itemData} />
      <div className="flex flex-col gap-2 p-1 grow w-0">
        <div>
          <Tabs
            value={props.context}
            onChange={(_event: SyntheticEvent, context: contexts) => {
              if (context !== null) {
                props.onChangeContext(context);
              }
            }}
            aria-label="Item Overview Tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              value="topology"
              icon={<AccountTreeIcon />}
              iconPosition="start"
              label="Topology"
            />
            <Tab
              value="metrics"
              icon={<BarChartIcon />}
              iconPosition="start"
              label="Charts"
            />
            <Tab
              value="openAlerts"
              icon={<NotificationImportantIcon />}
              iconPosition="start"
              label="Alerts"
            />
          </Tabs>
        </div>
        <Paper className="flex grow h-0 w-full">
          <TabPanel<contexts>
            index="topology"
            value={props.context}
            className="w-full"
          >
            <TopologyContext.Provider value={topologyContextValue}>
              <Topology data={topologyData} overQueryLimit={overQueryLimit} />
            </TopologyContext.Provider>
          </TabPanel>
          <TabPanel<contexts>
            index="metrics"
            value={props.context}
            className="w-full relative overflow-auto"
          >
            <DashboardItem
              items={props.jsItems}
              itemType={itemType}
              dashboardMetrics={itemTypeDefinitions?.metrics || {}}
              definitions={
                itemTypeDefinitions?.dashboards.instance || {
                  panels: [],
                }
              }
              itemId={props.itemId}
              metricSource={props.metricSource}
            />
          </TabPanel>
          <TabPanel<contexts>
            index="openAlerts"
            value={props.context}
            className="w-full"
          >
            <OpenAlertsTable
              data={itemOpenAlerts}
              onFiltered={handleOnFilterOpenAlerts}
              onClickRow={props.onClickItem}
              showItemTypeColumn={openAlertsIncludeChildren}
              extraTitle={
                openAlertsIncludeChildren
                  ? "Alert of children included"
                  : undefined
              }
            />
          </TabPanel>
        </Paper>
      </div>
    </div>
  );
});

export default ItemOverview;
