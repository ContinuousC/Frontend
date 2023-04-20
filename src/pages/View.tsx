/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useCallback, useMemo, useState, useRef, SyntheticEvent } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  JsTypes,
  JsItems,
  JsItemsData,
  JsQuery,
  JsInfoQuery,
  JsStylesheet,
  ItemId,
  type Status,
  type View,
} from "@continuousc/relation-graph";
import { type GraphData } from "@antv/g6";
import { context, trace, Span } from "@opentelemetry/api";
import Drawer from "@mui/material/Drawer";
import CloseIcon from "@mui/icons-material/Close";
import Toolbar from "@mui/material/Toolbar";
import BallotOutlinedIcon from "@mui/icons-material/BallotOutlined";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import ItemInfo from "../components/ItemInfo";

import useSearchParams from "../hooks/useSearchParams";

import Loading from "../components/Loading";
import TabPanel from "../components/TabPanel";
import DateTimeFilterFull from "../components/DateTimeFilterFull";
import Topology from "../components/Topology";
import ViewItemType from "../components/ViewItemType";
import Timeline from "../components/Timeline";
import ItemOverview from "../components/ItemOverview";
import EventsTable from "../components/EventsTable";
import OpenAlertsTable from "../components/OpenAlertsTable";

import * as services from "../services";
import { ITopologyContext, TopologyContext } from "../context";
import * as generalUtils from "../utils/general";
import * as topologyFilter from "../utils/topologyFilter";
import * as timeUtils from "../utils/time";
import * as timelineUtils from "../utils/timeline";
import { traceFun } from "../utils/frontend-tracer";
import * as maybeLoading from "../utils/maybeLoading";

import {
  VIEW_CONTEXT,
  VIEW_ITEM_TYPE_CONTEXT,
  DATE_TIME_INTERVALS,
  RANDOM_SPLITTER,
  ITEM_OVERVIEW_CONTEXT,
  TOPOLOGY_LIMIT,
  STATUSES,
  CHANGE_EVENT_SOURCES,
} from "../constants";

import { type RootState } from "../state/store";
import {
  DateTimeInterval,
  ChangeEventSource,
  QueryKey,
  SearchParamsValuesView,
  type MetricSources,
  type AlertMessage,
} from "../types/frontend";
import ViewSettings from "../components/ViewSettings";

type viewContexts = (typeof VIEW_CONTEXT)[number];
type itemTypeContexts = (typeof VIEW_ITEM_TYPE_CONTEXT)[number];
type itemContext = (typeof ITEM_OVERVIEW_CONTEXT)[number];
export default function View() {
  const spans = useRef<{
    [key: string]: {
      span: Span;
      endTime?: Date;
      timeout?: ReturnType<typeof setTimeout>;
    };
  }>({});
  const key = "view";
  const tracer = trace.getTracer("default");
  if (spans.current[key] === undefined) {
    spans.current[key] = { span: tracer.startSpan("loadView") };
  }
  const { span: loadSpan } = spans.current[key];
  const renderSpan = tracer.startSpan(
    "renderView",
    undefined,
    trace.setSpan(context.active(), loadSpan)
  );

  const { viewId } = useParams();
  const uiSettings = useSelector((state: RootState) => state.uiSettings);
  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );
  const [tableItemIds, setTableItemIds] = useState<string | null>(null);
  const [gridItemIds, setGridItemIds] = useState<string[]>([]);
  const [openAlertItemIds, setOpenAlertItemIds] = useState<string | null>(null);
  const [itemOverviewItemIds, setItemOverviewItemIds] = useState<string[]>([]);
  const [metricSource, setMetricSource] = useState<MetricSources>({});
  const [containerDOM, containerWidth] = maybeLoading.useElemSize<
    HTMLDivElement,
    number
  >((containerDOM) => containerDOM.getBoundingClientRect().width);

  const eventTableTimeFilter = useRef<{
    startDate: string;
    endDate: string;
  } | null>(null);

  //QUERY URL
  const [searchParams, setSearchParams] = useSearchParams();

  //BASE QUERIES
  const view = maybeLoading.useQuery({
    loadSpan,
    queryArgs: {},
    queryKey: QueryKey.View,
    extraDeps: [viewId],
    queryFn: async () => await services.getView(viewId as string),
  });

  //VIEW VARIABLES
  const itemTypes = maybeLoading.useMemo(
    { view },
    ({ view }) => view.elements.internal.item_types || []
  );
  const itemTypeSearchParams = maybeLoading.useMemo(
    { itemTypes },
    ({ itemTypes }) => {
      const param = searchParams.get(SearchParamsValuesView.ItemType);
      return itemTypes.find((itemType: string) => param === itemType);
    },
    [searchParams]
  );
  const itemType = maybeLoading.useMemo(
    { itemTypeSearchParams, itemTypes, view },
    ({ itemTypeSearchParams, itemTypes, view }) =>
      itemTypeSearchParams ||
      view.defaultItemType ||
      (itemTypes.length > 0 ? itemTypes[0] : null)
  );

  const itemId = searchParams.get(SearchParamsValuesView.ItemId);
  const showEvents = Boolean(
    searchParams.get(SearchParamsValuesView.ShowEvents)
  );
  const topologyStatusFilter = (STATUSES.find(
    (status) =>
      status === searchParams.get(SearchParamsValuesView.TopologyStatus)
  ) || "ok") as Status;
  const topologyLimitParam = Number(
    searchParams.get(SearchParamsValuesView.TopologyLimit)
  );
  const topologyLimit =
    Number.isInteger(topologyLimitParam) && topologyLimitParam > 0
      ? topologyLimitParam
      : TOPOLOGY_LIMIT;
  const itemTypeDefinitions = maybeLoading.useMemo(
    { itemType, view },
    ({ itemType, view }) =>
      itemType !== null ? view.itemTypes[itemType] : undefined
  );
  const filterElementsByTopology =
    searchParams.get(SearchParamsValuesView.FilterElementsByTopology) !==
    "false";

  //Contexts
  const [viewContext, setViewContext] = useState<viewContexts>(
    VIEW_CONTEXT.find(
      (context) =>
        context === searchParams.get(SearchParamsValuesView.ViewContext)
    ) || VIEW_CONTEXT[0]
  );
  const handleChangeContext = useCallback(
    (_ev: SyntheticEvent, newViewContext: viewContexts) => {
      if (newViewContext) {
        setViewContext(newViewContext);
        setSearchParams({
          filterName: SearchParamsValuesView.ViewContext,
          values: [newViewContext],
        });
      }
    },
    []
  );

  const [itemTypecontext, setItemTypeContext] = useState<itemTypeContexts>(
    VIEW_ITEM_TYPE_CONTEXT.find(
      (e) => e === searchParams.get(SearchParamsValuesView.ViewItemTypeContext)
    ) || VIEW_ITEM_TYPE_CONTEXT[0]
  );
  const handleItemTypeContext = useCallback(
    traceFun(
      renderSpan,
      "handleItemTypeContext",
      (newItemTypeContext: itemTypeContexts) => {
        setItemTypeContext(newItemTypeContext);
        setSearchParams({
          filterName: SearchParamsValuesView.ViewItemTypeContext,
          values: [newItemTypeContext],
        });
      }
    ),
    []
  );

  const [itemContext, setItemContext] = useState<itemContext>(
    ITEM_OVERVIEW_CONTEXT.find(
      (e) => e === searchParams.get(SearchParamsValuesView.ItemContext)
    ) || ITEM_OVERVIEW_CONTEXT[0]
  );
  const handleChangeItemContext = useCallback(
    traceFun(
      renderSpan,
      "handleChangeItemContext",
      (newItemContext: itemContext) => {
        setItemContext(newItemContext);
        setSearchParams({
          filterName: SearchParamsValuesView.ItemContext,
          values: [newItemContext],
        });
      }
    ),
    []
  );

  const [changeEventSource, setChangeEventSource] = useState<ChangeEventSource>(
    CHANGE_EVENT_SOURCES.find(
      (e) => e === searchParams.get(SearchParamsValuesView.ChangeEventSource)
    ) || CHANGE_EVENT_SOURCES[0]
  );
  const handleChangeEventSource = useCallback(
    traceFun(
      renderSpan,
      "handleChangeEventSource",
      (newChangeEventSource: ChangeEventSource) => {
        setChangeEventSource(newChangeEventSource);
        setSearchParams({
          filterName: SearchParamsValuesView.ChangeEventSource,
          values: [newChangeEventSource],
        });
      }
    ),
    []
  );

  //WASM classes
  const jsType = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.Packages,
    queryArgs: {},
    queryFn: async () => await JsTypes.download(),
  });

  const jsItemsData = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.ViewElements,
    queryArgs: { view },
    extraDeps: [datetimeFilter.datetimePointInTime],
    queryFn: async ({ view }) => {
      return await JsItemsData.download(
        {
          item_types: [
            ...view.elements.internal.item_types,
            ...view.elements.external.item_types,
          ],
          relation_types: [
            ...view.elements.internal.relation_types,
            ...view.elements.external.relation_types,
          ],
        },
        datetimeFilter.datetimePointInTime.relative.unit === "now"
          ? undefined
          : datetimeFilter.datetimePointInTime.absolute
      );
    },
    keepData: true,
    dedupData: (oldData, newData) => oldData.equals(newData),
  });

  const jsItems = maybeLoading.useMemo(
    { jsType, jsItemsData },
    ({ jsType, jsItemsData }) => JsItems.resolve(jsType, jsItemsData)
  );

  //TOPOLOGY
  const topology = maybeLoading.useMemo(
    { view },
    ({ view }) => {
      const topologyFromSearchParams = searchParams.get(
        SearchParamsValuesView.Topology
      );
      if (
        topologyFromSearchParams &&
        topologyFromSearchParams in view.topologies
      ) {
        return {
          topology: view.topologies[topologyFromSearchParams],
          topologyId: topologyFromSearchParams,
        };
      }
      if (view.defaultTopology && view.defaultTopology in view.topologies) {
        return {
          topology: view.topologies[view.defaultTopology],
          topologyId: view.defaultTopology,
        };
      }
      if (Object.values(view.topologies).length > 0) {
        return {
          topology: Object.values(view.topologies)[0],
          topologyId: Object.keys(view.topologies)[0],
        };
      }
      //TODO: this is an error, we need to disable maybeloading where topology is a dependency
      return {
        topology: Object.values(view.topologies)[0],
        topologyId: Object.keys(view.topologies)[0],
      };
    },
    [searchParams.get(SearchParamsValuesView.Topology)]
  );

  const topologyFilterSearchString = maybeLoading.useMemo(
    { topology },
    ({ topology }) =>
      topologyFilter.getFilterSearchParamsAsString(
        topology.topology,
        searchParams
      ),
    [searchParams]
  );
  const topologyFilters = maybeLoading.useMemoTraced(
    renderSpan,
    "getTopologyFilters",
    { topologyFilterSearchString },
    ({ topologyFilterSearchString }) => {
      const searchParamsFilter = new URLSearchParams(
        topologyFilterSearchString
      );
      return topologyFilter.getFilterFromSearchParams(searchParamsFilter);
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
      jsType,
      jsItems,
      topology,
      topologyFilters,
      topologyInfo,
    },
    extraDeps: [topologyStatusFilter, topologyLimit],
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
        topologyStatusFilter,
        topologyLimit
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

  const possibleTopologyFiltersValues = maybeLoading.useMemoTraced(
    renderSpan,
    "getPossibleTopologyFiltersValues",
    { queryResult },
    ({ queryResult }) => queryResult.jsQueryResult.getTemplateOptions()
  );
  const topologyData = maybeLoading.useMemoTraced(
    renderSpan,
    "getTopologyData",
    { view, jsType, topology, jsQueryResultItems, infoQueryResult },
    ({ view, jsType, topology, jsQueryResultItems, infoQueryResult }) => {
      if (jsQueryResultItems !== undefined) {
        return jsQueryResultItems.getGraphData(
          new JsStylesheet(
            topology.topology.stylesheet || { items: [] },
            jsType
          ),
          infoQueryResult,
          uiSettings.darkMode,
          view.elements.external.item_types
        ) as GraphData;
      }
      return { nodes: [], edges: [] };
    },
    [uiSettings.darkMode]
  );

  const topologyDataNodeIds = maybeLoading.useMemo(
    { topologyData },
    ({ topologyData }) => topologyData.nodes?.map((node) => node.id) || []
  );
  const overQueryLimit = maybeLoading.useMemo(
    { jsQueryResult },
    ({ jsQueryResult }) => jsQueryResult.getError() !== undefined,
    []
  );

  //TABLE
  const handleOnFilterTable = useMemo(() => {
    return generalUtils.debounce(
      traceFun(loadSpan, "setTableItemIds", (itemIds: ItemId[]) =>
        setTableItemIds(itemIds.sort().join(RANDOM_SPLITTER))
      ),
      1000
    );
  }, []);

  //GRID
  const handleOnFilterGrid = useMemo(() => {
    return generalUtils.debounce(
      traceFun(loadSpan, "setGridItemIds", (itemIds: ItemId[]) => {
        setGridItemIds(itemIds);
      }),
      1000
    );
  }, []);

  //OPEN ALERTS
  const openAlerts = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.OpenAlerts,
    queryArgs: { itemTypes },
    extraDeps: [datetimeFilter.datetimePointInTime],
    queryFn: async ({ itemTypes }) => {
      const service = async () => {
        if (itemTypes.length !== 0) {
          return await services.getItemTypesOpenAlerts(
            itemTypes,
            datetimeFilter.datetimePointInTime.relative.unit === "now"
              ? null
              : datetimeFilter.datetimePointInTime.absolute
          );
        }
        return [];
      };
      return await service();
    },
    update: viewContext === "openAlerts",
    keepData: true,
  });
  const openAlertsData = maybeLoading.useMemo(
    { openAlerts, topologyDataNodeIds },
    ({ openAlerts, topologyDataNodeIds }) => {
      return (
        openAlerts?.filter((el) =>
          filterElementsByTopology && "item_id" in el.value
            ? topologyDataNodeIds.includes(el.value.item_id)
            : true
        ) || []
      );
    },
    [filterElementsByTopology]
  );
  const handleOnFilterOpenAlerts = useMemo(() => {
    return generalUtils.debounce(
      traceFun(loadSpan, "setOpenAlertItemIds", (itemIds: ItemId[]) =>
        setOpenAlertItemIds(itemIds.sort().join(RANDOM_SPLITTER))
      ),
      1000
    );
  }, []);

  //BINS
  const dateTimeIntervalSearchParams = DATE_TIME_INTERVALS.find(
    (dateTimeInterval) =>
      dateTimeInterval ===
      searchParams.get(SearchParamsValuesView.DateTimeInterval)
  );
  const dateTimeInterval: DateTimeInterval =
    dateTimeIntervalSearchParams || "auto";

  const durationInSeconds = useMemo(
    () =>
      timeUtils.getIntervalInSeconds(
        datetimeFilter.datetimeStart.absolute,
        datetimeFilter.datetimeEnd.absolute
      ),
    [datetimeFilter.datetimeStart.absolute, datetimeFilter.datetimeEnd.absolute]
  );
  const timeScale = maybeLoading.useMemo(
    { containerWidth },
    ({ containerWidth }) =>
      timelineUtils.getTimeScale(
        durationInSeconds,
        dateTimeInterval,
        containerWidth
      ),
    [durationInSeconds, dateTimeInterval]
  );

  const binDateTimeStart = maybeLoading.useMemoTraced(
    renderSpan,
    "binDateTimeStart",
    { timeScale },
    ({ timeScale }) =>
      timelineUtils.getDateStartBin(
        datetimeFilter.datetimeStart.absolute,
        timeScale.dateTimeUnitData,
        timeScale.stepData,
        datetimeFilter.timezone
      ),
    [
      datetimeFilter.datetimeStart.absolute,
      datetimeFilter.timezone,
    ]
  );

  const binDateTimeEnd = maybeLoading.useMemoTraced(
    renderSpan,
    "binDateTimeEnd",
    { timeScale },
    ({ timeScale }) =>
      timelineUtils.getDateNextBin(
        datetimeFilter.datetimeEnd.absolute,
        timeScale.dateTimeUnitData,
        timeScale.stepData,
        datetimeFilter.timezone
      ),
    [
      datetimeFilter.datetimeEnd.absolute,
      datetimeFilter.timezone,
    ]
  );

  const allItemIds = maybeLoading.useMemo(
    { jsItems },
    ({ jsItems }) => jsItems.getIds().items
  );
  const allItemIdsItemType = maybeLoading.useMemo(
    { jsItems, itemType },
    ({ jsItems, itemType }) => {
      return itemType ? jsItems.getItemIdsImplementingType(itemType) : [];
    }
  );

  const elementIds = useMemo(() => {
    if (itemId !== null) {
      return maybeLoading.ready({
        itemIds: itemOverviewItemIds,
        relationIds: [],
      });
    }
    if (viewContext === "topology") {
      return maybeLoading.map(jsQueryResultItems, (jsQueryResultItems) => {
        if (jsQueryResultItems !== undefined) {
          const graphData = jsQueryResultItems.getIds();
          return {
            itemIds: graphData.items,
            relationIds: graphData.relations,
          };
        } else {
          return {
            itemIds: [],
            relationIds: [],
          };
        }
      });
    } else if (viewContext === "openAlerts") {
      return maybeLoading.ready({
        itemIds: openAlertItemIds?.split(RANDOM_SPLITTER) || [],
        relationIds: [],
      });
    } else if (itemTypecontext === "metrics") {
      return maybeLoading.map(allItemIdsItemType, (allItemIdsItemType) => ({
        itemIds: allItemIdsItemType,
        relationIds: [],
      }));
    } else if (itemTypecontext === "table") {
      return maybeLoading.ready({
        itemIds: tableItemIds?.split(RANDOM_SPLITTER) || [],
        relationIds: [],
      });
    } else {
      return maybeLoading.ready({
        itemIds: gridItemIds,
        relationIds: [],
      });
    }
  }, [
    itemId !== null
      ? itemOverviewItemIds
      : viewContext === "topology"
        ? jsQueryResultItems
        : viewContext === "openAlerts"
          ? openAlertItemIds
          : itemTypecontext === "metrics"
            ? allItemIdsItemType
            : itemTypecontext === "table"
              ? tableItemIds
              : gridItemIds,
  ]);

  //ITEM OVERVIEW
  const [itemErrorMessage, itemInfo] = maybeLoading.extractError(
    maybeLoading.useMemoTraced(
      renderSpan,
      "getItemInfo",
      {
        jsItems,
        itemId: itemId !== null ? maybeLoading.ready(itemId) : "disabled",
      },
      ({ jsItems, itemId }) => jsItems.getItemInfo(itemId)
    )
  );

  const itemInstanceItemTypeDefinitions = maybeLoading.useMemo(
    { view, itemInfo },
    ({ view, itemInfo }) => {
      const r = view.itemTypes[itemInfo.data.itemType];
      return (
        r || {
          metrics: {},
          dashboards: {
            type_range: undefined,
            instance: undefined,
          },
          table: {
            column_order: [],
            column_visibility: [],
          },
        }
      );
    }
  );

  const handleShowItem = useCallback((itemId: ItemId | null) => {
    if (itemId) {
      setSearchParams([
        {
          filterName: SearchParamsValuesView.ItemId,
          values: [itemId],
        },
        {
          filterName: SearchParamsValuesView.ShowEvents,
        },
      ]);
    } else {
      setSearchParams([
        { filterName: SearchParamsValuesView.ItemId },
        {
          filterName: SearchParamsValuesView.ShowEvents,
        },
      ]);
    }
  }, []);
  const itemData = maybeLoading.getData(itemInfo);

  //EVENTS
  const binnedEvents = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.Events,
    queryArgs: {
      elementIds,
      binDateTimeStart,
      binDateTimeEnd,
      timeScale,
    },
    extraDeps: [changeEventSource],
    queryFn: async ({
      elementIds,
      binDateTimeStart,
      binDateTimeEnd,
      timeScale,
    }) => {
      if (elementIds.itemIds.length > 0 || elementIds.relationIds.length > 0) {
        return await services.getEvents({
          ...elementIds,
          changeEventSource,
          timestampStart: binDateTimeStart,
          timestampEnd: binDateTimeEnd,
          dateTimeUnit: timeScale.dateTimeUnitData,
          timezone: datetimeFilter.timezone,
          step: timeScale.stepData || 1,
        });
      }
      return null;
    },
    keepData: true,
  });

  const bins = maybeLoading.useMemo(
    { binnedEvents },
    ({ binnedEvents }) => binnedEvents?.bins || []
  );

  const handleShowEvents = useCallback(
    traceFun(
      renderSpan,
      "handleShowEvents",
      (show: boolean, dates?: { startDate: string; endDate: string }) => {
        if (dates !== undefined) {
          eventTableTimeFilter.current = {
            startDate: dates.startDate,
            endDate: dates.endDate,
          };
        } else {
          eventTableTimeFilter.current = null;
        }
        if (show) {
          setSearchParams({
            filterName: SearchParamsValuesView.ShowEvents,
            values: ["true"],
          });
        } else {
          setSearchParams({
            filterName: SearchParamsValuesView.ShowEvents,
          });
        }
      }
    ),
    []
  );

  //Settings
  const handleSetSource = useCallback((metricSource: MetricSources) => {
    setMetricSource(metricSource);
  }, []);

  //OTHER
  const topologyContextValue = useMemo<ITopologyContext>(
    () => ({
      setSearchParams: setSearchParams,
      onClickItem: handleShowItem,
      topologyId: maybeLoading.getData(topology)?.topologyId || "",
      topologies: maybeLoading.getData(view)?.topologies || {},
      topologyFilters: maybeLoading.getData(topologyFilters),
      possibleTopologyFiltersValues: maybeLoading.getData(
        possibleTopologyFiltersValues
      ),
      statusFilter: topologyStatusFilter,
    }),
    [
      maybeLoading.getData(view)?.topologies,
      maybeLoading.getData(topology)?.topologyId,
      maybeLoading.getData(topologyFilters),
      maybeLoading.getData(possibleTopologyFiltersValues),
      topologyStatusFilter,
      searchParams.get(SearchParamsValuesView.Topology),
    ]
  );
  const rangeHighlighted =
    (itemId !== null && itemContext === "metrics") ||
    itemTypecontext === "metrics";
  const pointInTimeHiglighted = itemTypecontext !== "metrics";
  const globalAlertMessage: AlertMessage | null =
    maybeLoading.getData(allItemIds)?.length === 0
      ? {
        severity: "warning",
        title: "No items found",
      }
      : null;
  /* const itemErrorMessage = maybeLoading.getError(itemInfo); */
  const itemAlerMessage: AlertMessage | null = itemErrorMessage
    ? {
      severity: "warning",
      title: "Item not found",
    }
    : null;
  const showDrawer = itemId !== null || showEvents;
  const isGlobalLoading =
    maybeLoading.isLoading(jsItemsData) ||
    (itemId !== null && maybeLoading.isLoading(itemInfo));

  const r = (
    <div className="h-full w-full flex flex-col relative gap-1 pt-1">
      {isGlobalLoading && <Loading />}
      <div className="flex items-center justify-between flex-col lg:flex-row">
        {itemId !== null ? (
          <div className="flex w-full justify-center p-2">
            {itemAlerMessage !== null ? (
              <Alert severity={itemAlerMessage.severity} className="w-full">
                <AlertTitle>{itemAlerMessage.title}</AlertTitle>
              </Alert>
            ) : (
              itemData && (
                <ItemInfo
                  itemData={itemData.data}
                  fullWidth
                  disableStatusDescription
                />
              )
            )}
          </div>
        ) : (
          <Tabs
            value={viewContext}
            onChange={handleChangeContext}
            aria-label="View Tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              value="topology"
              icon={<AccountTreeIcon />}
              iconPosition="start"
              label="Topology"
              disabled={showDrawer}
            />
            <Tab
              value="itemType"
              icon={<BallotOutlinedIcon />}
              iconPosition="start"
              label="Managed Objects"
              disabled={showDrawer}
            />
            <Tab
              value="openAlerts"
              icon={<NotificationImportantIcon />}
              iconPosition="start"
              label="Alerts"
              disabled={showDrawer}
            />
          </Tabs>
        )}
        {globalAlertMessage !== null && (
          <Alert severity={globalAlertMessage.severity} className="w-full">
            <AlertTitle>{globalAlertMessage.title}</AlertTitle>
          </Alert>
        )}
        <div className="flex gap-2 sm:items-end items-center">
          <DateTimeFilterFull
            rangeHighlighted={rangeHighlighted}
            pointInTimeHiglighted={pointInTimeHiglighted}
            setSearchParams={setSearchParams}
          />
          <ViewSettings
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            setMetricSource={handleSetSource}
            itemTypeDefinitions={
              itemId !== null
                ? itemInstanceItemTypeDefinitions
                : itemTypeDefinitions
            }
          />
        </div>
      </div>
      <div className="flex h-0 grow relative" ref={containerDOM}>
        <TabPanel<viewContexts>
          index="topology"
          value={viewContext}
          className="w-full"
        >
          <TopologyContext.Provider value={topologyContextValue}>
            <Topology data={topologyData} overQueryLimit={overQueryLimit} />
          </TopologyContext.Provider>
        </TabPanel>
        <TabPanel<viewContexts>
          index="itemType"
          value={viewContext}
          className="w-full"
        >
          <ViewItemType
            context={itemTypecontext}
            jsType={jsType}
            jsItems={jsItems}
            itemTypeDefinitions={itemTypeDefinitions}
            itemType={itemType}
            itemTypes={itemTypes}
            topologyDataNodeIds={topologyDataNodeIds}
            onClickItem={handleShowItem}
            setSearchParams={setSearchParams}
            searchParams={searchParams}
            onFilteredTable={handleOnFilterTable}
            onFilteredGrid={handleOnFilterGrid}
            metricSource={metricSource}
            onChangeContext={handleItemTypeContext}
          />
        </TabPanel>
        <TabPanel<viewContexts>
          index="openAlerts"
          value={viewContext}
          className="w-full"
        >
          <OpenAlertsTable
            data={openAlertsData}
            onFiltered={handleOnFilterOpenAlerts}
            onClickRow={handleShowItem}
            showItemTypeColumn
            extraTitle={
              filterElementsByTopology ? "Filtered from topology" : undefined
            }
          />
        </TabPanel>
        <Drawer
          anchor="right"
          open={itemId !== null}
          onClose={() => handleShowItem(null)}
          PaperProps={{
            className: "w-full h-full",
            sx: {
              position: "absolute",
              zIndex: 10,
            },
          }}
          variant="persistent"
        >
          <CloseIcon
            className="absolute cursor-pointer right-4 top-6 z-20"
            onClick={() => handleShowItem(null)}
          />
          {itemId !== null && (
            <ItemOverview
              context={itemContext}
              itemId={itemId}
              view={view}
              itemData={itemInfo}
              onClickItem={handleShowItem}
              itemTypeDefinitions={itemInstanceItemTypeDefinitions}
              jsItems={jsItems}
              jsType={jsType}
              topologyLimit={topologyLimit}
              topologyStatusFilter={topologyStatusFilter}
              setSearchParams={setSearchParams}
              searchParams={searchParams}
              metricSource={metricSource}
              onChangeContext={handleChangeItemContext}
              setItemIds={handleSetItemOverviewItemIds}
            />
          )}
        </Drawer>
        <Drawer
          anchor="right"
          open={showEvents}
          onClose={() => {
            handleShowEvents(false);
          }}
          PaperProps={{ className: "w-3/5" }}
        >
          <Toolbar className="flex justify-between">
            <span className="uppercase font-semibold">
              {changeEventSource} Changes
            </span>
            <CloseIcon
              className="cursor-pointer"
              onClick={() => {
                handleShowEvents(false);
              }}
            />
          </Toolbar>
          {showEvents && (
            <EventsTable
              changeEventResponse={binnedEvents}
              onClickRow={handleShowItem}
              initialTimeFilter={
                eventTableTimeFilter?.current !== null
                  ? eventTableTimeFilter.current
                  : undefined
              }
              timezone={datetimeFilter.timezone}
              locale={datetimeFilter.locale}
            />
          )}
        </Drawer>
      </div>
      <div
        className={`hidden sm:block ${uiSettings.showTimeline ? "h-52" : "h-0"}`}
      >
        <Timeline
          bins={bins}
          timeScale={timeScale}
          dateTimeIntervalDefault={dateTimeInterval}
          containerWidth={containerWidth}
          changeEventSource={changeEventSource}
          showEvents={handleShowEvents}
          onChangeEventSource={handleChangeEventSource}
        />
      </div>
    </div>
  );

  renderSpan.end();

  spans.current[key].endTime = new Date();
  if (spans.current[key].timeout !== undefined) {
    clearTimeout(spans.current[key].timeout);
  }
  spans.current[key].timeout = setTimeout(() => {
    const { span, endTime } = spans.current[key];
    span.end(endTime);
    delete spans.current[key];
  }, 5000);

  return r;

  function handleSetItemOverviewItemIds(itemId: string[]) {
    setItemOverviewItemIds(itemId);
  }
}
