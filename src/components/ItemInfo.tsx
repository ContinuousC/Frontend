/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useSelector } from "react-redux";
import {
  type ItemId,
  type ItemData,
  type StatusInfo,
  ItemExtendedData,
} from "@continuousc/relation-graph";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Tooltip from "@mui/material/Tooltip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";
import Paper from "@mui/material/Paper";

import ItemAvatar from "./ItemAvatar";
import TableColumn, { STATUS_COLUMN_INFO } from "./TableColumn";

import * as timeUtils from "../utils/time";
import * as generalutils from "../utils/general";

import { type RootState } from "../state/store";
import * as maybeLoading from "../utils/maybeLoading";

export type ItemInfoProps = {
  itemData: ItemData;
  onClickItem?: (itemId: ItemId) => void;
  fullWidth?: boolean;
  disableStatusDescription?: boolean;
};

export default function ItemInfo(props: ItemInfoProps) {
  const itemName = props.itemData.itemName;
  return (
    <Card
      elevation={2}
      className={`group ${props.fullWidth ? "w-full h-[80px]" : "w-[600px] h-[150px]"}`}
    >
      <CardHeader
        avatar={
          <ItemAvatar
            itemData={props.itemData}
            onClickItem={props.onClickItem}
          />
        }
        title={
          <Tooltip title={itemName}>
            <div>{itemName}</div>
          </Tooltip>
        }
        titleTypographyProps={{
          sx: {
            fontWeight: "bold",
          },
          className: `w-80 ${
            props.onClickItem ? "cursor-pointer group-hover:underline" : ""
          }`,
          onClick: () =>
            props.onClickItem && props.onClickItem(props.itemData.itemId),
        }}
        subheader={
          props.disableStatusDescription ? undefined : (
            <ItemStatusDescription statusInfo={props.itemData.statusInfo} />
          )
        }
        subheaderTypographyProps={{
          className: "text-xs",
        }}
      />
    </Card>
  );
}

interface ItemStatusDescriptionProps {
  statusInfo: StatusInfo;
}

function ItemStatusDescription(props: ItemStatusDescriptionProps) {
  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );
  const individualStatus =
    props.statusInfo.individual_status?.value.status || "unknown";
  const aggregatedStatus = props.statusInfo.aggregated_status || "unknown";
  const lastChange = props.statusInfo.individual_status?.version.active.from;
  return (
    <div className="flex flex-col text-gray-400">
      <div>
        <span>Last change on </span>
        {lastChange
          ? timeUtils.formatISOToAbsoluteWithRelativeTime(
              lastChange,
              datetimeFilter.timezone,
              datetimeFilter.locale
            )
          : "Unknown"}
      </div>
      <div className="grid grid-cols-2">
        <span>Individual status is</span>
        <TableColumn value={individualStatus} columnInfo={STATUS_COLUMN_INFO} />
        <span>Aggregated status is</span>
        <TableColumn value={aggregatedStatus} columnInfo={STATUS_COLUMN_INFO} />
      </div>
    </div>
  );
}

interface ItemMetaDataProps {
  itemData: maybeLoading.MaybeLoading<ItemExtendedData | false | undefined>;
}

export function ItemMetaData(props: ItemMetaDataProps) {
  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );
  const metaData = maybeLoading.useMemo(
    { itemData: props.itemData },
    ({ itemData }) => {
      if (itemData) {
        return {
          statusInfo: itemData.data.statusInfo,
          properties: {
            data: itemData.metaData.properties.data,
            columns: itemData.metaData.properties.definition,
          },
        };
      }
    }
  );
  const metaDataData = maybeLoading.getData(metaData);
  if (metaData === "loading") {
    return <ItemMetaDataSkeleton />;
  }
  return (
    <Paper
      sx={{
        width: 400,
        height: "100%",
        overflowY: "auto",
      }}
      elevation={2}
    >
      {metaDataData && (
        <>
          <div className="p-2">
            <ItemStatusDescription statusInfo={metaDataData.statusInfo} />
          </div>
          <List dense>
            {metaDataData.properties.columns
              .filter((column) => "value" in column.type)
              .map((column) => {
                if ("value" in column.type) {
                  return (
                    <ListItem key={column.type.value.accessorKey}>
                      <ListItemText
                        primary={column.header}
                        secondary={generalutils.convertOutputType(
                          column.type.value.type,
                          metaDataData.properties.data[
                            column.type.value.accessorKey.replace(
                              "props.",
                              ""
                            ) as string
                          ],
                          datetimeFilter.timezone,
                          datetimeFilter.locale
                        )}
                        secondaryTypographyProps={{ component: "span" }}
                      />
                    </ListItem>
                  );
                }
              })}
          </List>
        </>
      )}
    </Paper>
  );
}

export function ItemMetaDataSkeleton() {
  return (
    <Paper
      sx={{
        width: 400,
        height: "100%",
        overflowY: "auto",
      }}
      elevation={2}
    >
      <Skeleton
        animation="wave"
        height={10}
        style={{ marginBottom: 20 }}
        width={50}
      />
      <Skeleton
        animation="wave"
        height={10}
        style={{ marginBottom: 6 }}
        variant="rectangular"
      />
      <Skeleton animation="wave" height={10} variant="rectangular" />
    </Paper>
  );
}
