/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { memo, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_TableOptions,
  type MRT_ColumnDef,
  type MRT_Row,
  MRT_TableInstance,
} from "material-react-table";
import {
  type ItemId,
  type SingleVersioned,
  type AlertDoc,
  type Severity,
  type ItemTypeId,
} from "@continuousc/relation-graph";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import MenuItem from "@mui/material/MenuItem";

import TableColumn, { SEVERITY_COLUMN_INFO } from "./TableColumn";
import TableLegend from "./TableLegend";
import TableAggregated from "./TableAggregated";

import * as generalUtils from "../utils/general";
import * as tableUtils from "../utils/table";
import * as maybeLoading from "../utils/maybeLoading";

import { type RootState } from "../state/store";
import { TimeZone, SEVERITIES, REV_SEVERITIES } from "../constants";

interface OpenAlertsTableProps {
  data: maybeLoading.MaybeLoading<SingleVersioned<AlertDoc>[]>;
  onFiltered?: (itemIds: ItemId[]) => void;
  onClickRow?: (itemId: ItemId, itemType?: ItemTypeId) => void;
  showItemTypeColumn?: boolean;
  extraTitle?: string;
}

const OpenAlertsTable = memo(function OpenAlertsTable(
  props: OpenAlertsTableProps
) {
  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );
  const isLoading = maybeLoading.isLoading(props.data);
  const intialLoading = props.data === "loading";
  const error = maybeLoading.getError(props.data);
  const tableConfig = maybeLoading.useMemo(
    { data: props.data },
    ({ data }) => {
      const tableConfig: MRT_TableOptions<SingleVersioned<AlertDoc>> = {
        ...defaultTableConfig,
        data,
        columns: getColumns(datetimeFilter.timezone, datetimeFilter.locale),
        state: {
          showProgressBars: isLoading,
          showSkeletons: intialLoading,
        },
        getFilteredRowModel: tableUtils.getFilteredRowModelPatch(
          props.onFiltered,
          (row) => row.original.value.item_id
        ),
        muiTableBodyRowProps: ({ row }) => ({
          onClick: () => {
            if (
              "type" in row.original.value &&
              row.original.value.type === "item" &&
              props.onClickRow
            ) {
              props.onClickRow(
                row.original.value.item_id,
                row.original.value.item_type
              );
            }
          },
          sx: {
            cursor: "pointer",
          },
        }),
        renderTopToolbarCustomActions: () => {
          return (
            <>
              {error && (
                <Alert severity="error">
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}
              {props.extraTitle && (
                <Alert severity="info">
                  <AlertTitle>{props.extraTitle}</AlertTitle>
                </Alert>
              )}
            </>
          );
        },
      };
      return tableConfig;
    },
    [
      datetimeFilter.timezone,
      datetimeFilter.locale,
      intialLoading,
      isLoading,
      props.extraTitle,
      error,
    ]
  );
  const tableConfigData = maybeLoading.getData<
    MRT_TableOptions<SingleVersioned<AlertDoc>>
  >(tableConfig) || {
    ...defaultTableConfig,
    data: [],
    columns: getColumns(datetimeFilter.timezone, datetimeFilter.locale),
    state: { showProgressBars: true },
  };
  const table = useMaterialReactTable(tableConfigData);
  useEffect(() => {
    if (props.showItemTypeColumn) {
      table.setColumnVisibility({
        "value.item_name": true,
        "value.item_type": true,
      });
    } else {
      table.setColumnVisibility({
        "value.item_name": false,
        "value.item_type": false,
      });
    }
  }, [props.showItemTypeColumn]);
  return <MaterialReactTable table={table} />;
});

export default OpenAlertsTable;

const getColumns: (
  timezone: TimeZone,
  locale: string
) => MRT_ColumnDef<SingleVersioned<AlertDoc>>[] = (timezone, locale) => {
  return [
    {
      accessorKey: "value.severity",
      header: "Severity",
      filterVariant: "autocomplete",
      filterFn: "severityGreaterThan",
      filterSelectOptions: REV_SEVERITIES.map((severity) => ({
        label: severity[0].toUpperCase() + severity.slice(1),
        value: severity,
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
          onClick={() => onSelectFilterMode("severityGreaterThan")}
        >
          <div>≥ Greater or Equal</div>
        </MenuItem>,
      ],
      sortingFn: (rowA, rowB, col) => {
        const a = rowA.getValue<Severity>(col);
        const b = rowB.getValue<Severity>(col);
        return a === b
          ? 0
          : SEVERITIES.indexOf(a) > SEVERITIES.indexOf(b)
            ? 1
            : -1;
      },
      Cell: ({ row }: { row: MRT_Row<SingleVersioned<AlertDoc>> }) => (
        <TableColumn
          value={row.original.value.severity}
          columnInfo={SEVERITY_COLUMN_INFO}
        />
      ),
      Footer: ({
        table,
      }: {
        table: MRT_TableInstance<SingleVersioned<AlertDoc>>;
      }) => {
        const filteredData = table
          .getFilteredRowModel()
          .rows.map((row) => row.original);
        const totals = Object.fromEntries(
          SEVERITIES.map(
            (severity) =>
              [
                severity,
                filteredData.filter((data) => data.value.severity === severity)
                  .length,
              ] as [string, number]
          )
        ) as { [key in Severity]: number };
        return (
          <div className="flex gap-1 pt-2">
            <TableLegend columnInfo={SEVERITY_COLUMN_INFO} />
            <TableAggregated
              totals={totals}
              columnInfo={SEVERITY_COLUMN_INFO}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "value.item_name",
      header: "Object Name",
      visibleInShowHideMenu: false,
      Cell: ({ row }: { row: MRT_Row<SingleVersioned<AlertDoc>> }) => (
        <span>
          {"type" in row.original.value && row.original.value.type === "item"
            ? row.original.value.item_name.join(" ▸ ")
            : ""}
        </span>
      ),
    },
    {
      accessorKey: "value.item_type",
      header: "Managed Object Type",
      visibleInShowHideMenu: false,
    },
    {
      accessorKey: "version.active.created",
      header: "Fired at",
      filterVariant: "datetime-range",
      enableGlobalFilter: false,
      Cell: ({ cell }) => {
        const value = cell.getValue();
        return generalUtils.convertOutputType(
          { props: "time" },
          value,
          timezone,
          locale
        );
      },
    },
    {
      accessorKey: "version.active.to",
      header: "Closed at",
      filterVariant: "datetime-range",
      enableGlobalFilter: false,
      Cell: ({ cell }) => {
        const value = cell.getValue();
        return generalUtils.convertOutputType(
          { props: "time" },
          value,
          timezone,
          locale
        );
      },
    },
    {
      accessorKey: "value.alert_rule",
      header: "Ruleform",
      size: 50,
    },
    {
      accessorKey: "value.alert_name",
      header: "Alert Name",
      size: 50,
    },
    {
      accessorKey: "value.alert_config",
      header: "Rule",
      size: 50,
    },
    {
      accessorKey: "value.annotations.summary",
      header: "Summary",
      size: 50,
    },
    {
      accessorKey: "value.annotations.description",
      header: "Description",
      size: 50,
    },
    {
      accessorKey: "value.annotations.runbook_url",
      header: "Runbook Url",
      size: 50,
    },
    {
      accessorKey: "value.labels",
      header: "Prometheus Labels",
      sortingFn: tableUtils.sortingFnObjectMap,
      filterFn: tableUtils.filterFnObjectMap,
      Cell: ({ cell }) => {
        const value = cell.getValue();
        return generalUtils.convertOutputType(
          { props: { map: ["unicodestring", "unicodestring"] } },
          value,
          timezone,
          locale
        );
      },
    },
  ];
};

const defaultTableConfig: MRT_TableOptions<SingleVersioned<AlertDoc>> = {
  columns: [],
  data: [],
  enableStickyHeader: true,
  enableStickyFooter: true,
  enableColumnDragging: true,
  paginateExpandedRows: false,
  positionToolbarAlertBanner: "bottom",
  groupedColumnMode: false,
  muiTablePaperProps: { className: "h-full flex flex-col" },
  muiTableContainerProps: { className: "h-0 grow" },
  columnFilterDisplayMode: "popover",
  enableColumnFilterModes: true,
  initialState: {
    pagination: {
      pageSize: 50,
      pageIndex: 0,
    },
    density: "compact",
    sorting: [
      { id: "version.active.created", desc: true },
      { id: "value.item_name", desc: false },
      { id: "value.severity", desc: false },
    ],
  },
  filterFns: {
    severityGreaterThan: (row, id, filterValue) => {
      const filter = SEVERITIES.indexOf(filterValue);
      const value = SEVERITIES.indexOf(row.getValue(id));
      return value >= filter;
    },
  },
  localization: {
    filterSeverityGreaterThan: "Greater or Equal",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
};
