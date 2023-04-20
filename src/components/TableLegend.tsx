/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import Legend from "./Legend";

import { IconColumn } from "../types/frontend";

interface TableLegendProps<T> {
  text?: string;
  columnInfo: IconColumn<T>[];
}

export default function TableLegend<T>(props: TableLegendProps<T>) {
  return (
    <Legend text={props.text || "Legend"}>
      <List dense>
        {props.columnInfo.map(({ text, Icon, iconColor, statusColor }) => (
          <ListItem key={text}>
            <ListItemIcon>
              <Icon color={iconColor} style={{ color: statusColor }} />
            </ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </Legend>
  );
}
