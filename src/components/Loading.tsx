/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";

export default function Loading() {
  return (
    <div className="w-full absolute">
      <LinearProgress />
    </div>
  );
}

export function CircularLoading() {
  return (
    <div className="w-full absolute top-1/2 left-1/2 z-10">
      <CircularProgress />
    </div>
  );
}
