/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { memo, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { trace, Span } from "@opentelemetry/api";
import {
  MaterialReactTable,
  type MRT_ColumnOrderState,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_TableOptions,
  type MRT_VisibilityState,
  MRT_TableInstance,
  MRT_Row,
} from "material-react-table";
import {
  type ItemId,
  type RowData,
  type Status,
  type ItemTypeDefinition,
  type TableDefinitions,
  JsTypes,
  JsItems,
} from "@continuousc/relation-graph";
import { MenuItem } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import TableColumn, { STATUS_COLUMN_INFO } from "./TableColumn";
import TableLegend from "./TableLegend";
import TableAggregated from "./TableAggregated";

import { STATUSES, REV_STATUSES } from "../constants";
import * as tableUtils from "../utils/table";
import * as services from "../services";
import * as maybeLoading from "../utils/maybeLoading";

import { type RootState } from "../state/store";
import {
  SearchParamsValuesView,
  QueryKey,
  type MetricSources,
} from "../types/frontend";

interface ItemTypeTableProps {
  itemType: maybeLoading.MaybeLoading<string | null>;
  jsItems: maybeLoading.MaybeLoading<JsItems>;
  jsType: maybeLoading.MaybeLoading<JsTypes>;
  itemTypeDefinitions: maybeLoading.MaybeLoading<
    ItemTypeDefinition | undefined
  >;
  topologyDataNodeIds: maybeLoading.MaybeLoading<string[]>;
  searchParams: URLSearchParams;
  metricSource: MetricSources;
  onFiltered?: (itemIds: ItemId[]) => void;
  onClickRow?: (itemId: ItemId) => void;
}

interface TableDefinitionsPreferences {
  columnOrder: string[];
  columnVisibility: { [key: string]: boolean };
}

const ItemTypeTable = memo(function ItemTypeTable(props: ItemTypeTableProps) {
  const spans = useRef<{
    [key: string]: {
      span: Span;
      endTime?: Date;
      timeout?: ReturnType<typeof setTimeout>;
    };
  }>({});
  const key = "itemTypeTable";
  const tracer = trace.getTracer("default");
  if (spans.current[key] === undefined) {
    spans.current[key] = { span: tracer.startSpan("loadItemTypeTable") };
  }
  const { span: loadSpan } = spans.current[key];

  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );
  const inView = true;
  const datetimeCurrentAbsolute = useSelector(
    (state: RootState) => state.datetimeFilter.datetimePointInTime.absolute
  );
  const filterElementsByTopology =
    props.searchParams.get(SearchParamsValuesView.FilterElementsByTopology) !==
    "false";
  const initialStatus = STATUSES.find(
    (status) =>
      status ===
      (props.searchParams.get(
        SearchParamsValuesView.GridFilterStatus
      ) as (typeof STATUSES)[number])
  );

  const metricsDataTable = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.TableMetric,
    queryArgs: {
      itemType: props.itemType,
      itemTypeDefinitions: props.itemTypeDefinitions,
    },
    extraDeps: [datetimeCurrentAbsolute, props.metricSource, inView],
    queryFn: async ({ itemType, itemTypeDefinitions }) => {
      if (
        itemType !== null &&
        itemTypeDefinitions?.metrics !== undefined &&
        Object.keys(props.metricSource).length !== 0 &&
        inView
      ) {
        return await services.getMetricsInstantBulk(
          itemTypeDefinitions.metrics,
          null,
          props.metricSource,
          datetimeCurrentAbsolute
        );
      }
      return null;
    },
    keepData: true,
  });
  const tableItems = maybeLoading.useMemo(
    {
      jsItems: props.jsItems,
      itemType: props.itemType,
      itemTypeDefinitions: props.itemTypeDefinitions,
      metricsDataTable,
      topologyDataNodeIds: props.topologyDataNodeIds,
    },
    ({
      jsItems,
      itemType,
      itemTypeDefinitions,
      metricsDataTable,
      topologyDataNodeIds,
    }) => {
      if (itemType !== null) {
        return jsItems
          .getTableData(
            itemType,
            itemTypeDefinitions?.metrics || {},
            metricsDataTable || {}
          )
          .filter((tableItem) =>
            filterElementsByTopology
              ? topologyDataNodeIds.includes(tableItem.item_id)
              : true
          );
      }
      return [];
    },
    [filterElementsByTopology]
  );
  const tableDefinitions = maybeLoading.useMemo(
    {
      jsType: props.jsType,
      itemType: props.itemType,
      itemTypeDefinitions: props.itemTypeDefinitions,
    },
    ({ jsType, itemType, itemTypeDefinitions }) => {
      if (itemType !== null) {
        const tableDefinitions = jsType.getTableDefs(
          itemType,
          itemTypeDefinitions?.metrics || {},
          {
            column_order: itemTypeDefinitions?.table.column_order,
            column_visibility: itemTypeDefinitions?.table.column_visibility,
          }
        );
        let column_order = tableDefinitions.column_order;
        let column_visibility = tableDefinitions.column_visibility;
        const tableDefinitionsPreferencesData = localStorage.getItem(
          itemType + "-table"
        );
        if (tableDefinitionsPreferencesData !== null) {
          const tableDefinitionsPreferences: TableDefinitionsPreferences =
            JSON.parse(tableDefinitionsPreferencesData);
          column_order = tableDefinitionsPreferences.columnOrder.filter(
            (column) => {
              return (
                !STATIC_COLUMN_ORDER.includes(column) &&
                (column.includes("props.") || column.includes("metrics."))
              );
            }
          );
          column_visibility = tableDefinitionsPreferences.columnVisibility;
        }
        return {
          columns: tableDefinitions.columns,
          column_order: [...STATIC_COLUMN_ORDER, ...column_order],
          column_visibility: Object.fromEntries([
            ...Object.entries(column_visibility),
            ...STATIC_COLUMN_ORDER.map((key) => [key, true]),
          ]),
        };
      }
      return emptyTableDefinitions;
    }
  );
  const tableDefinitionsData = maybeLoading.getDataOr(
    tableDefinitions,
    emptyTableDefinitions
  );

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    tableDefinitionsData.column_visibility
  );
  const [columnOrder, setColumnOrder] = useState<MRT_ColumnOrderState>(
    tableDefinitionsData.column_order
  );
  maybeLoading.useEffect(
    { itemType: props.itemType },
    ({ itemType }) => {
      if (itemType) {
        const tableDefinitionsPreferences: TableDefinitionsPreferences = {
          columnOrder: columnOrder,
          columnVisibility: columnVisibility,
        };
        localStorage.setItem(
          itemType + "-table",
          JSON.stringify(tableDefinitionsPreferences)
        );
      }
    },
    [columnOrder, columnVisibility]
  );
  const columnsTable = maybeLoading.useMemo(
    { tableDefinitions },
    ({ tableDefinitions }) => [
      ...STATIC_COLUMNS,
      ...(tableDefinitions.columns.map((column) =>
        tableUtils.translateColumnDef({
          ...column,
          timezone: datetimeFilter.timezone,
          locale: datetimeFilter.locale,
        })
      ) as MRT_ColumnDef<RowData>[]),
    ],
    [datetimeFilter.timezone, datetimeFilter.locale]
  );

  const isLoading = maybeLoading.isLoading(tableItems);
  const initialLoading = tableItems === "loading";
  const error = maybeLoading.getError(tableItems);
  const tableConfig = maybeLoading.useMemo(
    { data: tableItems, columns: columnsTable },
    ({ data, columns }) => {
      const tableConfig: MRT_TableOptions<RowData> = {
        ...emptyTableConfig,
        data,
        columns,
        initialState: {
          pagination: {
            pageSize: 50,
            pageIndex: 0,
          },
          density: "compact",
          columnFilters: initialStatus
            ? [
                {
                  id: "status_info.individual_status.value.status",
                  value: initialStatus,
                },
              ]
            : [],
        },
        state: {
          showProgressBars: isLoading,
          showSkeletons: initialLoading,
          columnVisibility,
          columnOrder,
        },
        getFilteredRowModel: tableUtils.getFilteredRowModelPatch(
          props.onFiltered
        ),
        muiTableBodyRowProps: ({ row }) => ({
          onClick: () => {
            if (props.onClickRow) {
              props.onClickRow(row.original.item_id);
            }
          },
          sx: {
            cursor: "pointer",
          },
        }),
        onColumnVisibilityChange: setColumnVisibility,
        onColumnOrderChange: setColumnOrder,
        renderTopToolbarCustomActions: () => {
          return (
            <>
              {error && (
                <Alert severity="error">
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}
            </>
          );
        },
      };
      return tableConfig;
    },
    [columnVisibility, columnOrder, isLoading, initialLoading, error]
  );
  const tableConfigData = maybeLoading.getDataOr<MRT_TableOptions<RowData>>(
    tableConfig,
    emptyTableConfig
  );
  const table = useMaterialReactTable(tableConfigData);
  return (
    <div className="h-full">
      <MaterialReactTable table={table} />
    </div>
  );
});

export default ItemTypeTable;

const STATIC_COLUMN_ORDER = [
  "status_info.individual_status.value.status",
  "status_info.aggregated_status",
  "item_name",
  "item_type",
];

const STATIC_COLUMNS: MRT_ColumnDef<RowData>[] = [
  {
    accessorKey: "status_info.individual_status.value.status",
    header: "Individual Status",
    enableColumnDragging: false,
    enableHiding: false,
    enableGlobalFilter: false,
    filterVariant: "autocomplete",
    filterFn: "statusGreaterThan",
    filterSelectOptions: REV_STATUSES.map((status) => ({
      label: status[0].toUpperCase() + status.slice(1),
      value: status,
    })),
    renderColumnFilterModeMenuItems: ({ onSelectFilterMode }) => [
      <MenuItem
        key="Equals"
        id="Equals"
        onClick={() => onSelectFilterMode("equals")}
      >
        <div>= Equals</div>
      </MenuItem>,
      <MenuItem
        key="GreaterOrEqual"
        id="GreaterOrEqual"
        onClick={() => onSelectFilterMode("statusGreaterThan")}
      >
        <div>≥ Greater or Equal</div>
      </MenuItem>,
    ],
    sortingFn: (rowA, rowB, col) => {
      const a = rowA.getValue<Status>(col);
      const b = rowB.getValue<Status>(col);
      return a === b ? 0 : STATUSES.indexOf(a) > STATUSES.indexOf(b) ? 1 : -1;
    },
    Cell: ({ row }: { row: MRT_Row<RowData> }) => (
      <TableColumn
        value={row.getValue("status_info.individual_status.value.status")}
        columnInfo={STATUS_COLUMN_INFO}
      />
    ),
    Footer: ({ table }: { table: MRT_TableInstance<RowData> }) => {
      const filteredData = table
        .getFilteredRowModel()
        .rows.map(
          (row) => row.original.status_info?.individual_status?.value.status
        );
      const totals = Object.fromEntries(
        STATUSES.map(
          (status) =>
            [status, filteredData.filter((data) => data === status).length] as [
              string,
              number,
            ]
        )
      ) as { [key in Status]: number };
      return (
        <div className="flex gap-1 pt-2">
          <TableLegend columnInfo={STATUS_COLUMN_INFO} />
          <TableAggregated totals={totals} columnInfo={STATUS_COLUMN_INFO} />
        </div>
      );
    },
  },
  {
    accessorKey: "status_info.aggregated_status",
    header: "Aggregated Status",
    enableColumnDragging: false,
    enableHiding: false,
    enableGlobalFilter: false,
    filterVariant: "autocomplete",
    filterFn: "statusGreaterThan",
    filterSelectOptions: REV_STATUSES.map((status) => ({
      label: status[0].toUpperCase() + status.slice(1),
      value: status,
    })),
    renderColumnFilterModeMenuItems: ({ onSelectFilterMode }) => [
      <MenuItem
        key="Equals"
        id="Equals"
        onClick={() => onSelectFilterMode("equals")}
      >
        <div>= Equals</div>
      </MenuItem>,
      <MenuItem
        key="GreaterOrEqual"
        id="GreaterOrEqual"
        onClick={() => onSelectFilterMode("statusGreaterThan")}
      >
        <div>≥ Greater or Equal</div>
      </MenuItem>,
    ],
    sortingFn: (rowA, rowB, col) => {
      const a = rowA.getValue<Status>(col);
      const b = rowB.getValue<Status>(col);
      return a === b ? 0 : STATUSES.indexOf(a) > STATUSES.indexOf(b) ? 1 : -1;
    },
    Cell: ({ row }: { row: MRT_Row<RowData> }) => (
      <TableColumn
        value={row.getValue("status_info.aggregated_status")}
        columnInfo={STATUS_COLUMN_INFO}
      />
    ),
    Footer: ({ table }: { table: MRT_TableInstance<RowData> }) => {
      const filteredData = table
        .getFilteredRowModel()
        .rows.map((row) => row.original.status_info?.aggregated_status);
      const totals = Object.fromEntries(
        STATUSES.map(
          (status) =>
            [status, filteredData.filter((data) => data === status).length] as [
              string,
              number,
            ]
        )
      ) as { [key in Status]: number };
      return (
        <div className="flex gap-1 pt-2">
          <TableLegend columnInfo={STATUS_COLUMN_INFO} />
          <TableAggregated totals={totals} columnInfo={STATUS_COLUMN_INFO} />
        </div>
      );
    },
  },
];

const emptyTableDefinitions: TableDefinitions = {
  columns: [] as TableDefinitions["columns"],
  column_order: [],
  column_visibility: {},
} as TableDefinitions;

const emptyTableConfig: MRT_TableOptions<RowData> = {
  data: [],
  columns: STATIC_COLUMNS,
  state: { showProgressBars: true },
  enableStickyHeader: true,
  enableStickyFooter: true,
  enableColumnDragging: true,
  paginateExpandedRows: false,
  positionToolbarAlertBanner: "bottom",
  groupedColumnMode: false,
  muiTablePaperProps: { className: "h-full flex flex-col" },
  muiTableContainerProps: { className: "h-0 grow" },
  columnFilterDisplayMode: "popover",
  enableColumnOrdering: true,
  enablePinning: false,
  enableFacetedValues: true,
  enableColumnFilterModes: true,
  enableRowVirtualization: true,
  //enableColumnVirtualization: true,
  filterFns: {
    statusGreaterThan: (row, id, filterValue) => {
      const filter = STATUSES.indexOf(filterValue);
      const value = STATUSES.indexOf(row.getValue(id));
      return value >= filter;
    },
  },
  localization: {
    filterStatusGreaterThan: "Greater or Equal",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
};
