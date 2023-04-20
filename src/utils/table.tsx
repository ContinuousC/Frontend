/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ItemId,
  type ColumnDef,
  type AlertEvent as AlertEventApi,
  type ChangeEvent as ChangeEventApi,
  type StatusEvent as StatusEventApi,
} from "@continuousc/relation-graph";
import {
  getFilteredRowModel,
  Table,
  memo as memoTable,
} from "@tanstack/react-table";
import {
  MRT_ColumnDef,
  MRT_FilterFn,
  MRT_SortingFn,
} from "material-react-table";
import Tooltip from "@mui/material/Tooltip";

import { convertOutputType } from "./general";
import { TimeZone } from "../constants";

import { ChangeEvent, StatusEvent, AlertEvent } from "../types/frontend";

export function getFilteredRowModelPatch(
  onFiltered?: (itemIds: ItemId[]) => void,
  getter?: (row: any) => ItemId
) {
  return (table: Table<any>) =>
    memoTable(
      () => [
        table.getPreFilteredRowModel(),
        table.getState().columnFilters,
        table.getState().globalFilter,
      ],
      () => {
        const result = getFilteredRowModel()(table)();
        onFiltered &&
          onFiltered(
            result.rows.map((row: any) =>
              getter ? getter(row) : row.original.item_id
            )
          );
        return result;
      },
      {
        key: "getFilteredRowModel",
        debug: () => table.options.debugAll ?? table.options.debugTable,
        onChange: () => {
          table._autoResetPageIndex();
        },
      }
    );
}

export function getChangeEvents(events: ChangeEventApi[]): ChangeEvent[] {
  return events.map((event) => ({
    id: event.object_id,
    itemId: event.type === "item" ? event.item_id : undefined,
    elementKind: event.type,
    elementType: event.type === "item" ? event.item_type : event.relation_type,
    elementName:
      event.type === "item"
        ? event.item_name.join(" ▸ ")
        : [
            event.source.item_name.join(" ▸ "),
            event.target.item_name.join(" ▸ "),
          ].join(" → "),
    changeType: event.change_type,
    timestamp: event.timestamp,
  }));
}

export function getStatusEvents(events: StatusEventApi[]): StatusEvent[] {
  return events.map((event) => ({
    id: event.object_id,
    itemId: event.type === "item" ? event.item_id : undefined,
    elementKind: event.type,
    elementType: event.type === "item" ? event.item_type : event.relation_type,
    elementName:
      event.type === "item"
        ? event.item_name.join(" ▸ ")
        : [
            event.source.item_name.join(" ▸ "),
            event.target.item_name.join(" ▸ "),
          ].join(" → "),
    timestamp: event.timestamp,
    status: event.status,
    previous: event.previous,
  }));
}

export function getAlertEvents(events: AlertEventApi[]): AlertEvent[] {
  return events.map((event) => ({
    id: event.object_id,
    itemId:
      "type" in event && event.type === "item" ? event.item_id : undefined,
    elementKind: "type" in event ? event.type : undefined,
    elementType:
      "type" in event
        ? event.type === "item"
          ? event.item_type
          : event.type === "relation"
            ? event.relation_type
            : undefined
        : undefined,
    elementName:
      "type" in event
        ? event.type === "item"
          ? event.item_name.join(" ▸ ")
          : event.type === "relation"
            ? [
                event.source.item_name.join(" ▸ "),
                event.target.item_name.join(" ▸ "),
              ].join(" → ")
            : undefined
        : undefined,
    timestamp: event.timestamp,
    alertName: event.alert_name,
    severity: event.severity,
    summary: event.annotations.summary,
    description: event.annotations.description,
  }));
}

export function translateColumnDef({
  header,
  title,
  type,
  enableHiding,
  enableColumnDragging,
  timezone,
  locale,
}: ColumnDef & { timezone: TimeZone; locale: string }): MRT_ColumnDef<any> {
  if ("value" in type) {
    const accessorFn = (row: any) => {
      return type.value.accessorKey
        .split(".")
        .reduce(
          (value: any | null, comp: string) =>
            typeof value === "object" && value !== null ? value[comp] : null,
          row
        );
    };
    const columnSettings: MRT_ColumnDef<any> = {
      id: type.value.accessorKey,
      header,
      Header: (
        <Tooltip title={title}>
          <span>{header}</span>
        </Tooltip>
      ),
      accessorFn,
      enableGlobalFilter: false,
      enableColumnFilterModes: false,
      enableHiding,
      enableColumnDragging,
      enableSorting: true,
      Cell: ({ cell }) => {
        const value = cell.getValue<any>();
        return convertOutputType(type.value.type, value, timezone, locale);
      },
    };
    if ("props" in type.value.type) {
      if (type.value.type.props === "time") {
        columnSettings.filterVariant = "datetime-range";
      } else if (
        typeof type.value.type.props === "object" &&
        "map" in type.value.type.props
      ) {
        const [key, val] = type.value.type.props.map;
        if (key === "unicodestring" && val === "unicodestring") {
          columnSettings.enableSorting = false;
          columnSettings.filterFn = filterFnObjectMap;
        }
      } else if (
        type.value.type.props === "string" ||
        type.value.type.props === "binarystring" ||
        type.value.type.props === "unicodestring"
      ) {
        columnSettings.enableColumnFilterModes = false;
        columnSettings.filterFn = "fuzzy";
        columnSettings.filterVariant = "text";
      }
    } else if ("metric" in type.value.type) {
      columnSettings.sortingFn = (rowA, rowB, col) => {
        const a = rowA.getValue<number | null>(col);
        const b = rowB.getValue<number | null>(col);
        return a === null ? -1 : b === null ? 1 : a > b ? 1 : a < b ? -1 : 0;
      };
      columnSettings.filterVariant = "range-slider";
    }
    return columnSettings;
  } else {
    return {
      id: header,
      header,
      columns: type.columns.map((column) =>
        translateColumnDef({ ...column, timezone, locale })
      ),
    };
  }
}

export const sortingFnObjectMap: MRT_SortingFn<any> = (rowA, rowB, id) => {
  const a = rowA.getValue<{ [key: string]: string } | null>(id);
  const b = rowB.getValue<{ [key: string]: string } | null>(id);

  if (a === null || b === null) {
    return a === null ? (b === null ? 0 : 1) : -1;
  }

  const keys: Set<string> = new Set();
  Object.keys(a).forEach((k) => keys.add(k));
  Object.keys(b).forEach((k) => keys.add(k));

  for (const k of keys.keys()) {
    if (k in a && (!(k in b) || a[k] > b[k])) {
      return 1;
    } else if (k in b && (!(k in a) || a[k] < b[k])) {
      return -1;
    }
  }
  return 0;
};

export const filterFnObjectMap: MRT_FilterFn<any> = (row, id, flt) => {
  const val = row.getValue<{ [key: string]: string } | null>(id);

  if (val === null) {
    return false;
  }

  for (const m of flt.matchAll(/(.+?)(?:: (.*?))?(?:, |$)/g)) {
    if (!(m[1] in val && (m[2] === undefined || val[m[1]].includes(m[2])))) {
      return false;
    }
  }

  return true;
};
