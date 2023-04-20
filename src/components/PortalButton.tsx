/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import React, { ReactNode, useState } from "react";
import Popper from "@mui/material/Popper";
import Tooltip from "@mui/material/Tooltip";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

interface PortalButtonProps<T> {
  disabled?: boolean;
  buttonChild?: ReactNode;
  buttonVariant?: "text" | "outlined" | "contained";
  buttonClassname?: string;
  popperChild: React.FC<T & { handleClose?: () => void }>;
  popperProps: T;
  popperChildOverride?: boolean;
  title: string;
  overridePopperClassname?: string;
  iconButton?: boolean;
}

function PortalButton<T>(props: PortalButtonProps<T>) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const handleOpen = (event: React.MouseEvent<HTMLElement>) =>
    open ? setAnchor(null) : setAnchor(event.currentTarget);
  const handleClose = () => setAnchor(null);
  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div>
        <Tooltip title={props.title}>
          <span>
            {props.iconButton ? (
              <IconButton
                size="small"
                onClick={handleOpen}
                color={open ? "primary" : "inherit"}
                disabled={props.disabled}
                className={props.buttonClassname}
              >
                {props.buttonChild}
              </IconButton>
            ) : (
              <Button
                variant={props.buttonVariant}
                size="small"
                onClick={handleOpen}
                color={open ? "primary" : "inherit"}
                disabled={props.disabled}
                className={props.buttonClassname}
              >
                {props.buttonChild}
              </Button>
            )}
          </span>
        </Tooltip>
        <Popper
          anchorEl={anchor}
          open={open}
          className={
            props.overridePopperClassname
              ? props.overridePopperClassname
              : "w-96 h-[450px] z-50"
          }
        >
          {props.popperChildOverride ? (
            props.popperChild({ ...props.popperProps, onClose: handleClose })
          ) : (
            <Paper className="flex flex-col items-end p-1 h-[450px] w-full border overflow-auto">
              <IconButton onClick={handleClose} size="small">
                <CloseIcon />
              </IconButton>
              {props.popperChild({
                ...props.popperProps,
                onClose: handleClose,
              })}
            </Paper>
          )}
        </Popper>
      </div>
    </ClickAwayListener>
  );
}

export default PortalButton;
