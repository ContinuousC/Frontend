/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import {
  Filters,
  View,
  Topology,
  QueryResult,
} from "@continuousc/relation-graph";

import { TOPOLOGY_FILTER_PREFIX } from "../constants";

import { optionValue } from "../types/frontend";

export const getFilterDefaultSearchParamsAsString = (
  view: View,
  filterPrefix: string = TOPOLOGY_FILTER_PREFIX
) => {
  const searchParamsDefault = new URLSearchParams();
  Object.entries(view.defaultTopologyFilters).forEach(
    ([filterName, filterValues]) => {
      filterValues.forEach((filterValue: string) => {
        searchParamsDefault.append(filterPrefix + filterName, filterValue);
      });
    }
  );
  return searchParamsDefault.toString();
};

export const getFilterSearchParamsAsString = (
  topology: Topology,
  searchParams: URLSearchParams,
  filterPrefix: string = TOPOLOGY_FILTER_PREFIX
) => {
  const topologyFilterNames: string[] = Object.keys(
    topology.query.template || {}
  );
  const searchParamsTopologyFilter = new URLSearchParams();
  searchParams.forEach((value, key) => {
    const filterName = key.replace(filterPrefix, "");
    if (topologyFilterNames.includes(filterName)) {
      searchParamsTopologyFilter.append(key, value);
    }
  });
  searchParamsTopologyFilter.sort();
  return searchParamsTopologyFilter.toString();
};

export const getFilterFromSearchParams = (
  searchParams: URLSearchParams,
  filterPrefix: string = TOPOLOGY_FILTER_PREFIX
) => {
  const filters: Filters = {};
  searchParams.forEach((value, key) => {
    const filterName = key.replace(filterPrefix, "");
    if (!(filterName in filters)) {
      filters[filterName] = [];
    }
    filters[filterName].push(value);
  });
  return filters;
};

export const getAutoCompleteDefaultValue = (
  defaultValue: string[] | undefined,
  multipleSelection?: boolean
) => {
  if (defaultValue && defaultValue.length > 0) {
    if (multipleSelection) {
      return defaultValue;
    } else {
      return defaultValue[0];
    }
  } else {
    if (multipleSelection) {
      return [];
    } else {
      return null;
    }
  }
};

export const getAutoCompleteValuePossible = (
  possibleValues: QueryResult["template"]["string"],
  newValue: optionValue,
  multipleSelection?: boolean
): optionValue => {
  let values = [];
  if (newValue === null) {
    values = [];
  }
  if (Array.isArray(newValue)) {
    if (!possibleValues) {
      values = newValue;
    }
    values = possibleValues.filter(
      (possibleValue: string) =>
        !!newValue.find((value) => value === possibleValue)
    );
  } else {
    if (!possibleValues) {
      values = [newValue];
    }
    values = newValue
      ? possibleValues.filter(
          (possibleValue: string) => newValue === possibleValue
        )
      : [];
  }

  if (multipleSelection) {
    return values;
  } else if (values.length > 0) {
    return values[0];
  } else {
    return null;
  }
};

export const getFromAutoCompleteFilterValuesForWasm = (values: optionValue) => {
  let filterValues: string[] = [];
  if (Array.isArray(values)) {
    if (values.length > 0) {
      filterValues = values;
    }
  } else if (values !== null) {
    filterValues = [values];
  }
  return filterValues;
};
