/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import {
  type Severity,
  type Status,
  type EventType as ChangeEventType,
} from "@continuousc/relation-graph";
import ErrorIcon from "@mui/icons-material/Error";
import NearbyErrorIcon from "@mui/icons-material/NearbyError";
import WarningIcon from "@mui/icons-material/Warning";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";

import {
  WARNING_COLOR,
  CRITICAL_COLOR,
  MAJOR_COLOR,
  MINOR_COLOR,
  OK_COLOR,
} from "../constants";

import { IconColumn } from "../types/frontend";

interface TableColumnProps<T> {
  value: T;
  columnInfo: IconColumn<T>[];
}

export default function TableColumn<T>(props: TableColumnProps<T>) {
  const column = props.columnInfo.find((col) => col.value === props.value);
  if (column) {
    return (
      <div className="flex items-center">
        <column.Icon
          color={column.iconColor}
          style={{ color: column.statusColor }}
        />
        <span className="italic">{column.text}</span>
      </div>
    );
  } else {
    return props.value;
  }
}

export const SEVERITY_COLUMN_INFO: IconColumn<Severity>[] = [
  {
    value: "critical",
    text: "Critical",
    Icon: ErrorIcon,
    statusColor: CRITICAL_COLOR,
  },
  {
    value: "major",
    text: "Major",
    Icon: NearbyErrorIcon,
    statusColor: MAJOR_COLOR,
  },
  {
    value: "warning",
    text: "Warning",
    Icon: WarningIcon,
    statusColor: WARNING_COLOR,
  },
  {
    value: "minor",
    text: "Minor",
    Icon: WarningAmberIcon,
    statusColor: MINOR_COLOR,
  },
];

export const STATUS_COLUMN_INFO: IconColumn<Status>[] = [
  ...(SEVERITY_COLUMN_INFO as IconColumn<Status>[]),
  {
    value: "ok",
    text: "Ok",
    Icon: CheckCircleIcon,
    statusColor: OK_COLOR,
  },
];

export const CHANGE_COLUMN_INFO: IconColumn<ChangeEventType>[] = [
  {
    value: "added",
    text: "Added",
    Icon: BookmarkAddIcon,
    iconColor: "info",
  },
  {
    value: "modified",
    text: "Modified",
    Icon: SettingsSuggestIcon,
    iconColor: "action",
  },
  {
    value: "removed",
    text: "Removed",
    Icon: BookmarkRemoveIcon,
    iconColor: "warning",
  },
];
