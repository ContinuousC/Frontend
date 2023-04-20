/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import { type ItemData } from "@continuousc/relation-graph";

import { STATUS_TO_TAILWIND_COLOR } from "../constants";

type ItemAvatarProps = {
  itemData: ItemData;
  onClickItem?: (itemId: string) => void;
};

export default function ItemAvatar(props: ItemAvatarProps) {
  const alerts = props.itemData.statusInfo.alerts;
  const itemTypeName = props.itemData.itemTypeName.singular;
  const itemType = props.itemData.itemType;
  const status = props.itemData.statusInfo.individual_status?.value.status;
  const statusTailwind =
    status !== undefined && status !== "ok"
      ? `${STATUS_TO_TAILWIND_COLOR[status].background}`
      : "bg-primary";
  return (
    <Tooltip title={itemTypeName}>
      <Badge
        badgeContent={alerts}
        color="primary"
        overlap="circular"
        invisible={alerts === 0}
      >
        <div
          className={`relative inline-flex items-center justify-center w-10 h-10 overflow-hidden rounded-full ${props.onClickItem ? "cursor-pointer group-hover:ring-8 group-hover:ring-primary group-hover:ring-opacity-50" : ""} ${statusTailwind}`}
        >
          <Avatar
            src={`/icons/${itemType}.svg`}
            variant="circular"
            alt={itemTypeName}
            sx={{ width: 32, height: 32 }}
            onClick={() =>
              props.onClickItem && props.onClickItem(props.itemData.itemId)
            }
          />
        </div>
      </Badge>
    </Tooltip>
  );
}
