/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useContext, useMemo, memo } from "react";
import {
  TopologyQueryFilter,
  AutocompleteFilter,
} from "@continuousc/relation-graph";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import Badge from "@mui/material/Badge";

import PortalButton from "./PortalButton";

import { TopologyContext } from "../context";
import * as topologyFilter from "../utils/topologyFilter";

import { SearchParamsValuesView } from "../types/frontend";
import { TOPOLOGY_FILTER_PREFIX, REV_STATUSES } from "../constants";

export const TopologyQueryFilterButton = () => {
  const { topologyId, topologyFilters } = useContext(TopologyContext);
  const filtered = Boolean(Object.keys(topologyFilters || {}).length);
  return (
    <PortalButton
      popperChild={TopologyFilter}
      popperProps={{}}
      buttonChild={
        <Badge color="primary" variant="dot" invisible={!filtered}>
          <FilterAltIcon fontSize="small" />
        </Badge>
      }
      disabled={topologyId === undefined}
      title="Query Filter"
      iconButton
    />
  );
};

const RANDOM_STRING = "RANDOM_STRING";
const TopologyFilter = () => {
  const {
    topologies,
    topologyId,
    topologyFilters,
    possibleTopologyFiltersValues,
  } = useContext(TopologyContext);
  return (
    <div className="flex flex-row gap-2 justify-between h-96 w-full">
      <div className="w-11/12 h-full overflow-y-auto">
        <div className="flex flex-col gap-4 pt-2">
          {topologies[topologyId]?.queryFilters.map(
            ({ name, label, filter }) => (
              <div key={name}>
                {filter.type === "autocomplete" && (
                  <AutoCompleteTopologyFilter
                    name={name}
                    label={label}
                    filter={filter}
                    key={name}
                    possibleValuesString={(
                      possibleTopologyFiltersValues?.[name] || []
                    )
                      .sort()
                      .join(RANDOM_STRING)}
                    value={topologyFilters?.[name]}
                  />
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export const AutoCompleteTopology = memo(function AutoCompleteTopology() {
  const { topologies, topologyId, setSearchParams } =
    useContext(TopologyContext);
  return (
    <Autocomplete
      value={topologyId}
      onChange={(_event, newValue) => {
        if (newValue !== null) {
          setSearchParams({
            filterName: SearchParamsValuesView.Topology,
            values: [newValue],
          });
        }
      }}
      options={Object.keys(topologies).sort()}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Topology"
          size="small"
          placeholder="Choose A Topology"
        />
      )}
      disableClearable
      size="small"
      autoComplete
      className="w-60"
      disabled={Object.keys(topologies).length === 0}
    />
  );
});

interface AutoCompleteTopologyFilterFilter {
  name: TopologyQueryFilter["name"];
  label: TopologyQueryFilter["label"];
  filter: AutocompleteFilter;
  possibleValuesString: string;
  value: string[] | undefined;
}
const AutoCompleteTopologyFilter = memo(function AutoCompleteTopologyFilter(
  props: AutoCompleteTopologyFilterFilter
) {
  const { setSearchParams, filterPrefix } = useContext(TopologyContext);
  const filterName =
    filterPrefix !== undefined
      ? filterPrefix + props.name
      : TOPOLOGY_FILTER_PREFIX + props.name;
  const value = topologyFilter.getAutoCompleteDefaultValue(
    props.value,
    props.filter.multipleSelection
  );
  const possibleValue = useMemo(
    () =>
      topologyFilter.getAutoCompleteValuePossible(
        props.possibleValuesString.split(RANDOM_STRING),
        value,
        props.filter.multipleSelection
      ),
    [props.possibleValuesString, value, props.filter.multipleSelection]
  );
  const handleDelete = (deleteValue: string) => {
    if (Array.isArray(value)) {
      const newValue = value.filter((v) => v !== deleteValue);
      setSearchParams({
        filterName,
        values: topologyFilter.getFromAutoCompleteFilterValuesForWasm(newValue),
      });
    }
  };

  return (
    <Autocomplete
      value={value}
      onChange={(_event, newValue) => {
        setSearchParams({
          filterName,
          values:
            topologyFilter.getFromAutoCompleteFilterValuesForWasm(newValue),
        });
      }}
      options={props.possibleValuesString.split(RANDOM_STRING)}
      renderInput={(params) => (
        <TextField
          placeholder={value?.length === 0 || value === null ? "All" : ""}
          {...params}
          label={props.label}
          size="small"
        />
      )}
      size="small"
      autoComplete
      multiple={props.filter.multipleSelection}
      limitTags={3}
      renderTags={(values) => {
        return (
          <>
            {values.map((value) => (
              <span key={value} className="pr-1 pt-1">
                <Chip
                  size="small"
                  color={possibleValue?.includes(value) ? "default" : "error"}
                  label={value}
                  onDelete={() => handleDelete(value)}
                />
              </span>
            ))}
          </>
        );
      }}
    />
  );
});

export const AutoCompleteStatusFilter = memo(
  function AutoCompleteStatusFilter() {
    const { statusFilter, setSearchParams, topologies } =
      useContext(TopologyContext);
    return (
      <Autocomplete
        value={statusFilter}
        onChange={(_event, newValue) => {
          if (newValue !== null) {
            setSearchParams({
              filterName: SearchParamsValuesView.TopologyStatus,
              values: [newValue],
            });
          }
        }}
        options={REV_STATUSES}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Status"
            size="small"
            placeholder="Status"
          />
        )}
        getOptionLabel={(option) =>
          option.charAt(0).toUpperCase() + option.slice(1)
        }
        disableClearable
        size="small"
        autoComplete
        className="w-28"
        disabled={Object.keys(topologies).length === 0}
      />
    );
  }
);
