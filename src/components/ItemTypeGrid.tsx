/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo, SyntheticEvent, useCallback, useEffect, useMemo } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import { type ItemId, type Status, JsItems } from "@continuousc/relation-graph";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";

import ItemInfo from "./ItemInfo";
import SearchButton from "./SearchButton";

import { STATUSES, REV_STATUSES } from "../constants";
import * as generalUtils from "../utils/general";
import * as maybeLoading from "../utils/maybeLoading";

import { HandleQueryParams, SearchParamsValuesView } from "../types/frontend";

interface PropertiesGridProps {
  jsItems: maybeLoading.MaybeLoading<JsItems>;
  itemType: maybeLoading.MaybeLoading<string | null>;
  itemTypes: maybeLoading.MaybeLoading<string[]>;
  topologyDataNodeIds: maybeLoading.MaybeLoading<string[]>;
  searchParams: URLSearchParams;
  onClickItem: (itemId: ItemId) => void;
  setSearchParams: (params: HandleQueryParams | HandleQueryParams[]) => void;
  onFilteredItems?: (itemIds: ItemId[]) => void;
}

const ItemTypeGrid = memo(function ItemTypeGrid(props: PropertiesGridProps) {
  const gridStatus =
    STATUSES.find(
      (status) =>
        status ===
        (props.searchParams.get(
          SearchParamsValuesView.GridFilterStatus
        ) as (typeof STATUSES)[number])
    ) || STATUSES[0];
  const gridName =
    props.searchParams.get(SearchParamsValuesView.GridFilterName) || null;
  const gridtFilterStatusByEqual =
    props.searchParams.get(SearchParamsValuesView.GridtFilterStatusByEqual) ===
    "true";
  const gridtFilterByManagedObject =
    props.searchParams.get(
      SearchParamsValuesView.GridtFilterByManagedObjectType
    ) === "true";
  const filterElementsByTopology =
    props.searchParams.get(SearchParamsValuesView.FilterElementsByTopology) !==
    "false";

  const gridItemsData = maybeLoading.useMemo(
    {
      jsItems: props.jsItems,
      itemType: props.itemType,
      itemTypes: props.itemTypes,
    },
    ({ jsItems, itemType, itemTypes }) => {
      if (itemType !== null) {
        return jsItems.getGridData(
          gridtFilterByManagedObject ? [itemType] : itemTypes
        );
      }
      return [];
    },
    [gridtFilterByManagedObject]
  );
  const gridItems = maybeLoading.useMemo(
    { gridItemsData, topologyDataNodeIds: props.topologyDataNodeIds },
    ({ gridItemsData, topologyDataNodeIds }) => {
      const gridItemsFiltered = gridItemsData
        .filter((gridItem) => {
          if (gridName !== null && !gridItem.itemName.includes(gridName)) {
            return false;
          }
          if (
            filterElementsByTopology &&
            !topologyDataNodeIds.includes(gridItem.itemId)
          ) {
            return false;
          }
          const status = gridItem.statusInfo.individual_status?.value.status;
          if (gridtFilterStatusByEqual && status !== gridStatus) {
            return false;
          } else if (
            status &&
            STATUSES.indexOf(status) < STATUSES.indexOf(gridStatus)
          ) {
            return false;
          }
          return true;
        })
        .sort((itemA, itemB) => {
          const individualStatusA =
            itemA.statusInfo.individual_status?.value.status;
          const individualStatusB =
            itemB.statusInfo.individual_status?.value.status;
          if (individualStatusA !== individualStatusB) {
            return REV_STATUSES.indexOf(individualStatusA || "ok") >
              REV_STATUSES.indexOf(individualStatusB || "ok")
              ? 1
              : -1;
          }
          const aggregatedStatusA = itemA.statusInfo.aggregated_status;
          const aggregatedStatusB = itemA.statusInfo.aggregated_status;
          if (aggregatedStatusA !== aggregatedStatusB) {
            return REV_STATUSES.indexOf(aggregatedStatusA || "ok") >
              REV_STATUSES.indexOf(aggregatedStatusB || "ok")
              ? 1
              : -1;
          }
          const itemTypeA = itemA.itemType;
          const itemTypeB = itemA.itemType;
          if (itemTypeA !== itemTypeB) {
            return itemTypeA.localeCompare(itemTypeB);
          }
          return itemA.itemName.localeCompare(itemB.itemName);
        });
      return gridItemsFiltered;
    },
    [gridName, gridStatus, gridtFilterStatusByEqual, filterElementsByTopology]
  );

  const gridItemData = maybeLoading.getData(gridItems);
  useEffect(() => {
    if (gridItemData !== undefined) {
      const gridItemIds = gridItemData.map(({ itemId }) => itemId);
      if (props.onFilteredItems) {
        props.onFilteredItems(gridItemIds);
      }
    }
  }, [gridItemData]);

  const handleOnNameStatus = useCallback((status: Status) => {
    props.setSearchParams({
      filterName: SearchParamsValuesView.GridFilterStatus,
      values: [status],
    });
  }, []);
  const handleOnNameChange = useMemo(() => {
    return generalUtils.debounce(
      (newSearchName: string | null) =>
        props.setSearchParams({
          filterName: SearchParamsValuesView.GridFilterName,
          values: newSearchName === null ? undefined : [newSearchName],
        }),
      1000
    );
  }, []);
  const handleOnToggleGridtFilterStatusByEqual = useCallback(
    (event: SyntheticEvent) => {
      props.setSearchParams({
        filterName: SearchParamsValuesView.GridtFilterStatusByEqual,
        values: gridtFilterStatusByEqual ? undefined : ["true"],
      });
      event?.preventDefault();
    },
    [gridtFilterStatusByEqual]
  );

  const items = maybeLoading.getDataOr(gridItems, []);
  const itemType = maybeLoading.getData(props.itemType);
  return (
    <Paper className="flex flex-col h-full p-1">
      <div className="flex flex-row justify-between text-gray-500 mb-8">
        {items.length === 0 ? (
          "Empty"
        ) : (
          <span>
            Showing <span className="font-bold">{items.length.toString()}</span>{" "}
            {gridtFilterByManagedObject && itemType
              ? itemType
              : "managed objects"}
          </span>
        )}
        <div className="flex items-center gap-2">
          <Autocomplete
            value={gridStatus}
            onChange={(_event, newValue) => {
              if (newValue !== null) {
                handleOnNameStatus(newValue as Status);
              }
            }}
            autoComplete
            options={REV_STATUSES}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Status"
                size="small"
                helperText={
                  gridtFilterStatusByEqual
                    ? "Filter mode: Equals"
                    : "Filter mode: Greater or Equals"
                }
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <Tooltip title="Toggle filter mode">
                        <Button
                          color="inherit"
                          onClick={handleOnToggleGridtFilterStatusByEqual}
                        >
                          {gridtFilterStatusByEqual ? "=" : "≥"}
                        </Button>
                      </Tooltip>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            disableClearable
            size="small"
            className="w-52"
          />
          <SearchButton
            initialValue={gridName || ""}
            onChange={(newSearchValue) => handleOnNameChange(newSearchValue)}
          />
        </div>
      </div>
      <VirtuosoGrid
        data={items}
        style={{ height: 0 }}
        className="grow"
        listClassName="flex flex-wrap gap-2"
        itemClassName="flex content-stretch"
        totalCount={items.length}
        overscan={10}
        components={{
          ScrollSeekPlaceholder: () => (
            <div className="p-4">
              <Skeleton variant="rounded" width={600} height={150} />
            </div>
          ),
        }}
        itemContent={(_index, data) => (
          <ItemInfo itemData={data} onClickItem={props.onClickItem} />
        )}
      />
    </Paper>
  );
});

export default ItemTypeGrid;
