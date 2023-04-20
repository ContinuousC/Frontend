/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { ReactNode } from "react";
import { type OverviewDashboard } from "@continuousc/relation-graph";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import WidgetItemTypeStatus from "./WidgetItemTypeStatus";
import DateTimeFilterFull from "../components/DateTimeFilterFull";

import * as maybeLoading from "../utils/maybeLoading";

import { HandleQueryParams } from "../types/frontend";

export default function OverviewDashboard(props: {
  dashboard: maybeLoading.MaybeLoading<OverviewDashboard>;
  setSearchParams: (params: HandleQueryParams | HandleQueryParams[]) => void;
}) {
  const dashboard = maybeLoading.getData(props.dashboard);
  const error = maybeLoading.getError(props.dashboard);
  if (props.dashboard === "loading") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full h-full p-2 gap-4">
        {new Array(3).map((_d, index) => (
          <PanelSkeleton key={index} />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full gap-1">
      <div className="self-end">
        <DateTimeFilterFull
          pointInTimeHiglighted
          setSearchParams={props.setSearchParams}
        />
      </div>
      {error ? (
        <Alert severity="error">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      ) : (
        <div className="flex flex-col flex-wrap gap-4 overflow-auto flex-grow">
          {dashboard?.panels.map((panelRow, index) => (
            <div
              className="flex flex-row flex-wrap gap-4 m-1"
              key={index.toString()}
            >
              {panelRow.map((panel, index) => (
                <Panel {...panel} key={index.toString() + panel.name} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Panel(props: OverviewDashboard["panels"][0][0]) {
  return (
    <Paper className="flex flex-col gap-2 p-2">
      <span
        className="text-2xl capitalize"
        title={props.documentation || undefined}
      >
        {" "}
        {props.name}
      </span>
      <div className="flex flex-col gap-2">
        {props.widgets.map((widgetRow, index) => (
          <div
            className="flex flex-row flex-wrap gap-2 justify-center"
            key={index.toString()}
          >
            {widgetRow.map((widget, index) => (
              <WidgetItemType
                {...widget}
                key={index.toString() + widget.name}
              />
            ))}
          </div>
        ))}
      </div>
    </Paper>
  );
}

export function WidgetItemType(
  props: OverviewDashboard["panels"][0][0]["widgets"][0][0]
) {
  const { widget_type, itemType, ...widget } = props;
  if (widget_type === "status") {
    return (
      <WidgetWrapper>
        <WidgetItemTypeStatus itemType={itemType} {...widget} />
      </WidgetWrapper>
    );
  }
}

function WidgetWrapper(props: { children: ReactNode }) {
  return (
    <Paper className={`p-1`} elevation={5}>
      {props.children}
    </Paper>
  );
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col h-full gap-2 p-2">
      <Skeleton
        animation="wave"
        height={10}
        style={{ marginBottom: 6 }}
        variant="rectangular"
      />
      <Skeleton
        animation="wave"
        height={"100%"}
        width={"100%"}
        variant="rectangular"
      />
    </div>
  );
}
