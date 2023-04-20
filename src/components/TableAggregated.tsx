/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";

import { IconColumn, Entries } from "../types/frontend";

interface TableAggregatedProps<T extends string> {
  totals: { [key in T]: number };
  columnInfo: IconColumn<T>[];
}

export default function TableAggregated<T extends string>(
  props: TableAggregatedProps<T>
) {
  const totals = Object.entries(props.totals) as Entries<typeof props.totals>;
  return (
    <div className="flex flex-row gap-2">
      {totals
        .filter(([, total]) => total > 0)
        .map(([value, total]) => {
          const column = props.columnInfo.find((col) => col.value === value);
          if (column) {
            return (
              <Badge badgeContent={total} color="primary" key={column.text}>
                <Tooltip title={column.text}>
                  <column.Icon
                    color={column.iconColor}
                    style={{ color: column.statusColor }}
                  />
                </Tooltip>
              </Badge>
            );
          }
        })}
    </div>
  );
}
