/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { SyntheticEvent, memo } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Tooltip from "@mui/material/Tooltip";
import GridViewIcon from "@mui/icons-material/GridView";
import BarChartIcon from "@mui/icons-material/BarChart";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import {
  JsItems,
  JsTypes,
  type ItemId,
  type ItemTypeDefinition,
} from "@continuousc/relation-graph";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import TabPanel from "./TabPanel";
import ItemTypeTable from "./ItemTypeTable";
import ItemTypeGrid from "./ItemTypeGrid";
import DashboardItemType from "./DashboardItemType";

import { VIEW_ITEM_TYPE_CONTEXT } from "../constants";
import * as maybeLoading from "../utils/maybeLoading";

import {
  HandleQueryParams,
  SearchParamsValuesView,
  type MetricSources,
} from "../types/frontend";

type contexts = (typeof VIEW_ITEM_TYPE_CONTEXT)[number];
interface ViewItemTypeProps {
  jsType: maybeLoading.MaybeLoading<JsTypes>;
  jsItems: maybeLoading.MaybeLoading<JsItems>;
  itemTypeDefinitions: maybeLoading.MaybeLoading<
    ItemTypeDefinition | undefined
  >;
  context: contexts;
  itemType: maybeLoading.MaybeLoading<string | null>;
  itemTypes: maybeLoading.MaybeLoading<string[]>;
  topologyDataNodeIds: maybeLoading.MaybeLoading<string[]>;
  onClickItem: (itemId: ItemId) => void;
  setSearchParams: (params: HandleQueryParams | HandleQueryParams[]) => void;
  searchParams: URLSearchParams;
  onFilteredTable?: (itemIds: ItemId[]) => void;
  onFilteredGrid?: (itemIds: ItemId[]) => void;
  metricSource: MetricSources;
  onChangeContext: (context: contexts) => void;
}

const emptyItemTypes: string[] = [];

const ViewItemType = memo(function ViewItemType(props: ViewItemTypeProps) {
  const itemTypes = maybeLoading.getDataOr(props.itemTypes, emptyItemTypes);
  const itemType = maybeLoading.getData(props.itemType);
  const itemTypeDefinitions = maybeLoading.getData(props.itemTypeDefinitions);
  const isLoadingItemTypes = maybeLoading.isLoading(props.itemTypes);
  const filterElementsByTopology =
    props.searchParams.get(SearchParamsValuesView.FilterElementsByTopology) !==
    "false";

  return (
    <div className="h-full flex flex-col w-full gap-2 pt-2">
      <div className="flex justify-between w-full gap-3 items-center h-[52px]">
        <div className="flex gap-2 items-center">
          <ToggleButtonGroup
            value={props.context}
            onChange={(_event: SyntheticEvent, context: contexts) => {
              if (context !== null) {
                props.onChangeContext(context);
              }
            }}
            exclusive
            size="small"
          >
            <ToggleButton value="grid">
              <Tooltip title="Grid View">
                <GridViewIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="table">
              <Tooltip title="Table View">
                <FormatListBulletedIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="metrics">
              <Tooltip title="Charts View">
                <BarChartIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          {filterElementsByTopology && props.context !== "metrics" && (
            <Alert severity="info">
              <AlertTitle>Filtered from topology</AlertTitle>
            </Alert>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-60">
            <Autocomplete
              disableClearable={itemTypes.length !== 0}
              value={itemType || ""}
              disabled={
                itemTypes.length === 0 || isLoadingItemTypes || !itemType
              }
              onChange={(_event: SyntheticEvent, newValue: string | null) => {
                if (newValue !== null) {
                  props.setSearchParams({
                    filterName: SearchParamsValuesView.ItemType,
                    values: [newValue],
                  });
                }
              }}
              options={itemTypes}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Managed Object Type"
                  size="small"
                  disabled={itemTypes.length === 0}
                />
              )}
            />
          </div>
        </div>
      </div>
      {props.jsItems === "loading" ? (
        <Alert severity="info" className="w-48">
          <AlertTitle>Items loading</AlertTitle>
        </Alert>
      ) : props.itemType === null ? (
        <Alert severity="warning" className="w-48">
          <AlertTitle>No item type selected</AlertTitle>
        </Alert>
      ) : (
        <>
          <TabPanel<contexts>
            index="grid"
            value={props.context}
            className="h-0 grow"
          >
            <ItemTypeGrid
              itemType={props.itemType}
              itemTypes={props.itemTypes}
              onClickItem={props.onClickItem}
              setSearchParams={props.setSearchParams}
              topologyDataNodeIds={props.topologyDataNodeIds}
              searchParams={props.searchParams}
              jsItems={props.jsItems}
              onFilteredItems={props.onFilteredGrid}
            />
          </TabPanel>
          <TabPanel<contexts>
            index="table"
            value={props.context}
            className="h-0 grow"
          >
            <ItemTypeTable
              itemType={props.itemType}
              searchParams={props.searchParams}
              metricSource={props.metricSource}
              jsItems={props.jsItems}
              jsType={props.jsType}
              itemTypeDefinitions={props.itemTypeDefinitions}
              topologyDataNodeIds={props.topologyDataNodeIds}
              onFiltered={props.onFilteredTable}
              onClickRow={props.onClickItem}
            />
          </TabPanel>
          <TabPanel<contexts>
            index="metrics"
            value={props.context}
            className="h-0 grow overflow-auto"
          >
            <DashboardItemType
              metricDefintions={itemTypeDefinitions?.metrics || {}}
              rangeDashboard={
                itemTypeDefinitions?.dashboards.type_range || {
                  panels: [],
                }
              }
              items={props.jsItems}
              itemType={props.itemType}
              sources={props.metricSource}
            />
          </TabPanel>
        </>
      )}
    </div>
  );
});

export default ViewItemType;
