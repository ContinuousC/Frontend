/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { ReactNode, useState } from "react";

import InfoIcon from "@mui/icons-material/Info";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";

export default function Legend({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  const [legendSummary, setLegendSummary] = useState<boolean>(false);
  return (
    <>
      <Tooltip title={text} className="cursor-help">
        <InfoIcon color="info" onClick={() => setLegendSummary(true)} />
      </Tooltip>
      <Dialog onClose={() => setLegendSummary(false)} open={legendSummary}>
        <DialogTitle>{text}</DialogTitle>
        <DialogContent>{children}</DialogContent>
      </Dialog>
    </>
  );
}
