/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext } from "react";
import {
  QueryResult,
  Filters,
  ItemId,
  Topology,
  type Status,
} from "@continuousc/relation-graph";

import { TimeZone, TOPOLOGY_FILTER_PREFIX } from "./constants";

import {
  DateTime,
  RelativeDateTime,
  type HandleQueryParams,
} from "./types/frontend";

export interface ITopologyContext {
  topologies: { [key: string]: Topology };
  topologyId: string;
  topologyFilters?: Filters;
  possibleTopologyFiltersValues?: QueryResult["template"];
  statusFilter?: Status;
  filterPrefix?: string;
  setSearchParams: (params: HandleQueryParams | HandleQueryParams[]) => void;
  onClickItem: (itemID: ItemId) => void;
}

export const TopologyContext = createContext<ITopologyContext>({
  topologies: {},
  topologyId: "",
  setSearchParams: () => {},
  onClickItem: () => {},
  filterPrefix: TOPOLOGY_FILTER_PREFIX,
});

export const DateTimeFilterContext = createContext<{
  onClose: () => void;
  onAccept: (value: DateTime) => void;
  initialValue?: DateTime;
  disableNow?: boolean;
  isValidRelativeDateTime?: (value: RelativeDateTime) => boolean;
  timezone: TimeZone;
  locale: string;
  globalClock: string;
}>({
  onClose: () => {},
  onAccept: () => {},
  timezone: "Europe/Brussels",
  locale: "en",
  globalClock: "",
});
