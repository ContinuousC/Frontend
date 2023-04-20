/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { memo, useMemo } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  MRT_ColumnDef,
  MRT_Row,
  MRT_TableInstance,
} from "material-react-table";
import {
  ItemId,
  type Severity,
  type Status,
} from "@continuousc/relation-graph";
import MenuItem from "@mui/material/MenuItem";
import { DateTime as DateTimeVendor } from "luxon";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import TableColumn, {
  SEVERITY_COLUMN_INFO,
  STATUS_COLUMN_INFO,
  CHANGE_COLUMN_INFO,
} from "./TableColumn";
import TableLegend from "./TableLegend";
import TableAggregated from "./TableAggregated";

import * as tableUtils from "../utils/table";
import * as timeUtils from "../utils/time";
import * as maybeLoading from "../utils/maybeLoading";

import {
  AlertEvent,
  ChangeEvent,
  ChangeEventResponse,
  StatusEvent,
} from "../types/frontend";
import { TimeZone, STATUSES, REV_STATUSES, SEVERITIES } from "../constants";

type EventsTableProps = TableProps & {
  changeEventResponse: maybeLoading.MaybeLoading<ChangeEventResponse | null>;
};

interface TableProps {
  onClickRow: (itemId: ItemId) => void;
  initialTimeFilter?: { startDate: string; endDate: string };
  timezone: TimeZone;
  locale: string;
  isLoading?: boolean;
  isInitialLoading?: boolean;
  error?: string;
}

const EventsTable = memo(function EventsTable(props: EventsTableProps) {
  const { changeEventResponse, ...tableProps } = props;
  const changeEventResponseData = maybeLoading.getData(changeEventResponse);
  const isLoading = maybeLoading.isLoading(changeEventResponse);
  const isInitialLoading = changeEventResponse === "loading";
  const error = maybeLoading.getError(changeEventResponse);
  if (changeEventResponseData?.changeEventSource === "configuration") {
    const data = tableUtils.getChangeEvents(changeEventResponseData.events);
    return (
      <ChangeEventTable
        data={data}
        {...tableProps}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        error={error}
      />
    );
  } else if (changeEventResponseData?.changeEventSource === "status") {
    const data = tableUtils.getStatusEvents(changeEventResponseData.events);
    return (
      <StatusEventTable
        data={data}
        {...tableProps}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        error={error}
      />
    );
  } else if (changeEventResponseData?.changeEventSource === "alert") {
    const data = tableUtils.getAlertEvents(changeEventResponseData.events);
    return (
      <AlertEventTable
        data={data}
        {...tableProps}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        error={error}
      />
    );
  }
  return (
    <MaterialReactTable
      data={[]}
      columns={[]}
      enableStickyHeader
      enableStickyFooter
      enableColumnDragging
      paginateExpandedRows={false}
      positionToolbarAlertBanner="bottom"
      groupedColumnMode={false}
      muiTablePaperProps={{ className: "h-full flex flex-col p-2" }}
      muiTableContainerProps={{ className: "h-0 grow" }}
      columnFilterDisplayMode="popover"
      enableColumnFilterModes
      initialState={{
        pagination: {
          pageSize: 50,
          pageIndex: 0,
        },
      }}
      state={{
        showProgressBars: true,
      }}
    />
  );
});

export default EventsTable;

function ChangeEventTable(props: { data: ChangeEvent[] } & TableProps) {
  const table = useMaterialReactTable({
    data: props.data,
    columns: ChangeColumns(props.timezone, props.locale),
    enableStickyHeader: true,
    enableStickyFooter: true,
    enableColumnDragging: true,
    paginateExpandedRows: false,
    positionToolbarAlertBanner: "bottom",
    groupedColumnMode: false,
    muiTablePaperProps: { className: "h-full flex flex-col p-2" },
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
        { id: "timestamp", desc: true },
        { id: "elementName", desc: false },
      ],
      columnFilters:
        props.initialTimeFilter !== undefined
          ? [
              {
                id: "timestamp",
                value: [
                  DateTimeVendor.fromISO(
                    props.initialTimeFilter.startDate
                  ).toUTC(),
                  DateTimeVendor.fromISO(
                    props.initialTimeFilter.endDate
                  ).toUTC(),
                ],
              },
            ]
          : [],
    },
    state: {
      showProgressBars: props.isLoading,
      showSkeletons: props.isInitialLoading,
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        const itemId = row.original.itemId;
        if (props.onClickRow && itemId) {
          props.onClickRow(itemId);
        }
      },
      sx: {
        cursor: "pointer",
      },
    }),
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
    renderTopToolbarCustomActions: () =>
      props.error && (
        <Alert severity="error">
          <AlertTitle>{props.error}</AlertTitle>
        </Alert>
      ),
  });
  return <MaterialReactTable table={table} />;
}

function ChangeColumns(timezone: TimeZone, locale: string) {
  return useMemo<MRT_ColumnDef<ChangeEvent>[]>(
    () => [
      {
        accessorKey: "changeType",
        header: "Event",
        size: 30,
        filterVariant: "multi-select",
        filterSelectOptions: [
          {
            label: "Added",
            value: "added",
          },
          {
            label: "Modified",
            value: "modified",
          },
          {
            label: "Removed",
            value: "removed",
          },
        ],
        Cell: ({ row }: { row: MRT_Row<ChangeEvent> }) => (
          <TableColumn
            value={row.original.changeType}
            columnInfo={CHANGE_COLUMN_INFO}
          />
        ),
        Footer: ({ table }: { table: MRT_TableInstance<ChangeEvent> }) => {
          const filteredData = table
            .getFilteredRowModel()
            .rows.map((row) => row.original);
          const totals = {
            added: filteredData.filter((data) => data.changeType === "added")
              .length,
            modified: filteredData.filter(
              (data) => data.changeType === "modified"
            ).length,
            removed: filteredData.filter(
              (data) => data.changeType === "removed"
            ).length,
          };
          return (
            <div className="flex gap-1 pt-2">
              <TableLegend columnInfo={CHANGE_COLUMN_INFO} />
              <TableAggregated
                totals={totals}
                columnInfo={CHANGE_COLUMN_INFO}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "elementName",
        header: "Name",
        size: 50,
      },
      {
        accessorKey: "timestamp",
        header: "Time",
        filterVariant: "datetime-range",
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return timeUtils.formatISOToAbsoluteWithRelativeTime(
            value,
            timezone,
            locale
          );
        },
      },
      {
        accessorKey: "elementKind",
        header: "Kind",
        size: 50,
        filterVariant: "select",
        filterSelectOptions: [
          {
            label: "Item",
            value: "item",
          },
          {
            label: "Relation",
            value: "relation",
          },
        ],
      },
      {
        accessorKey: "elementType",
        header: "Type",
        size: 50,
      },
    ],
    []
  );
}

function StatusEventTable(props: { data: StatusEvent[] } & TableProps) {
  const table = useMaterialReactTable({
    data: props.data,
    columns: StatusColumns(props.timezone, props.locale),
    enableStickyHeader: true,
    enableStickyFooter: true,
    enableColumnDragging: true,
    paginateExpandedRows: false,
    positionToolbarAlertBanner: "bottom",
    groupedColumnMode: false,
    muiTablePaperProps: { className: "h-full flex flex-col p-2" },
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
        { id: "timestamp", desc: true },
        { id: "elementName", desc: false },
      ],
      columnFilters:
        props.initialTimeFilter !== undefined
          ? [
              {
                id: "timestamp",
                value: [
                  DateTimeVendor.fromISO(
                    props.initialTimeFilter.startDate
                  ).toUTC(),
                  DateTimeVendor.fromISO(
                    props.initialTimeFilter.endDate
                  ).toUTC(),
                ],
              },
            ]
          : [],
    },
    state: {
      showProgressBars: props.isLoading,
      showSkeletons: props.isInitialLoading,
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        const itemId = row.original.itemId;
        if (props.onClickRow && itemId) {
          props.onClickRow(itemId);
        }
      },
      sx: {
        cursor: "pointer",
      },
    }),
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
    renderTopToolbarCustomActions: () =>
      props.error && (
        <Alert severity="error">
          <AlertTitle>{props.error}</AlertTitle>
        </Alert>
      ),
  });
  return <MaterialReactTable table={table} />;
}

function StatusColumns(timezone: TimeZone, locale: string) {
  return useMemo<MRT_ColumnDef<StatusEvent>[]>(
    () => [
      {
        accessorKey: "previous",
        header: "Previous Status",
        filterVariant: "autocomplete",
        filterFn: "statusGreaterThan",
        columnFilterModeOptions: ["Equals", "GreaterOrEqual"],
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
        Cell: ({ row }: { row: MRT_Row<StatusEvent> }) => (
          <TableColumn
            value={row.original.previous}
            columnInfo={STATUS_COLUMN_INFO}
          />
        ),
        Footer: ({ table }: { table: MRT_TableInstance<StatusEvent> }) => {
          const filteredData = table
            .getFilteredRowModel()
            .rows.map((row) => row.original);
          const totals = Object.fromEntries(
            STATUSES.map(
              (status) =>
                [
                  status,
                  filteredData.filter((data) => data.previous === status)
                    .length,
                ] as [string, number]
            )
          ) as { [key in Status]: number };
          return (
            <div className="flex gap-1 pt-2">
              <TableLegend columnInfo={STATUS_COLUMN_INFO} />
              <TableAggregated
                totals={totals}
                columnInfo={STATUS_COLUMN_INFO}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Current Status",
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
        Cell: ({ row }: { row: MRT_Row<StatusEvent> }) => (
          <TableColumn
            value={row.original.status}
            columnInfo={STATUS_COLUMN_INFO}
          />
        ),
        Footer: ({ table }: { table: MRT_TableInstance<StatusEvent> }) => {
          const filteredData = table
            .getFilteredRowModel()
            .rows.map((row) => row.original);
          const totals = Object.fromEntries(
            STATUSES.map(
              (status) =>
                [
                  status,
                  filteredData.filter((data) => data.status === status).length,
                ] as [string, number]
            )
          ) as { [key in Status]: number };
          return (
            <div className="flex gap-1 pt-2">
              <TableLegend columnInfo={STATUS_COLUMN_INFO} />
              <TableAggregated
                totals={totals}
                columnInfo={STATUS_COLUMN_INFO}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "elementName",
        header: "Name",
        size: 50,
      },
      {
        accessorKey: "timestamp",
        header: "Time",
        filterVariant: "datetime-range",
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return timeUtils.formatISOToAbsoluteWithRelativeTime(
            value,
            timezone,
            locale
          );
        },
      },
      {
        accessorKey: "elementKind",
        header: "Kind",
        size: 50,
        filterVariant: "select",
        filterSelectOptions: [
          {
            label: "Item",
            value: "item",
          },
          {
            label: "Relation",
            value: "relation",
          },
        ],
      },
      {
        accessorKey: "elementType",
        header: "Type",
        size: 50,
      },
    ],
    []
  );
}

function AlertEventTable(props: { data: AlertEvent[] } & TableProps) {
  const table = useMaterialReactTable({
    data: props.data,
    columns: AlertColumns(props.timezone, props.locale),
    enableStickyHeader: true,
    enableStickyFooter: true,
    enableColumnDragging: true,
    paginateExpandedRows: false,
    positionToolbarAlertBanner: "bottom",
    groupedColumnMode: false,
    muiTablePaperProps: { className: "h-full flex flex-col p-2" },
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
        { id: "timestamp", desc: true },
        { id: "elementName", desc: false },
      ],
      columnFilters:
        props.initialTimeFilter !== undefined
          ? [
              {
                id: "timestamp",
                value: [
                  DateTimeVendor.fromISO(
                    props.initialTimeFilter.startDate
                  ).toUTC(),
                  DateTimeVendor.fromISO(
                    props.initialTimeFilter.endDate
                  ).toUTC(),
                ],
              },
            ]
          : [],
    },
    state: {
      showProgressBars: props.isLoading,
      showSkeletons: props.isInitialLoading,
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        const itemId = row.original.itemId;
        if (props.onClickRow && itemId) {
          props.onClickRow(itemId);
        }
      },
      sx: {
        cursor: "pointer",
      },
    }),
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
    renderTopToolbarCustomActions: () =>
      props.error && (
        <Alert severity="error">
          <AlertTitle>{props.error}</AlertTitle>
        </Alert>
      ),
  });
  return <MaterialReactTable table={table} />;
}

function AlertColumns(timezone: TimeZone, locale: string) {
  return useMemo<MRT_ColumnDef<AlertEvent>[]>(
    () => [
      {
        accessorKey: "severity",
        header: "Severity",
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
            <div>{`≥ Greater or Equal`}</div>
          </MenuItem>,
        ],
        sortingFn: (rowA, rowB, col) => {
          const a = rowA.getValue<Status>(col);
          const b = rowB.getValue<Status>(col);
          return a === b
            ? 0
            : STATUSES.indexOf(a) > STATUSES.indexOf(b)
              ? 1
              : -1;
        },
        Cell: ({ row }: { row: MRT_Row<AlertEvent> }) => (
          <TableColumn
            value={row.original.severity}
            columnInfo={SEVERITY_COLUMN_INFO}
          />
        ),
        Footer: ({ table }: { table: MRT_TableInstance<AlertEvent> }) => {
          const filteredData = table
            .getFilteredRowModel()
            .rows.map((row) => row.original);
          const totals = Object.fromEntries(
            SEVERITIES.map(
              (severity) =>
                [
                  severity,
                  filteredData.filter((data) => data.severity === severity)
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
        accessorKey: "elementName",
        header: "Name",
        size: 50,
      },
      {
        accessorKey: "timestamp",
        header: "Time",
        filterVariant: "datetime-range",
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return timeUtils.formatISOToAbsoluteWithRelativeTime(
            value,
            timezone,
            locale
          );
        },
      },
      {
        accessorKey: "alertName",
        header: "Alert",
      },
      {
        accessorKey: "summary",
        header: "Summary",
      },
      {
        accessorKey: "elementKind",
        header: "Kind",
        size: 50,
        filterVariant: "select",
        filterSelectOptions: [
          {
            label: "Item",
            value: "item",
          },
          {
            label: "Relation",
            value: "relation",
          },
        ],
      },
      {
        accessorKey: "elementType",
        header: "Type",
        size: 50,
      },
    ],
    []
  );
}
