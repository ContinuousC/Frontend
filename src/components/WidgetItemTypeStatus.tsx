/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { trace, Span } from "@opentelemetry/api";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Avatar from "@mui/material/Avatar";
import Fade from "@mui/material/Fade";
import {
  type ItemTypeId,
  type AggrStatusCounts,
  type Status,
  type Widget,
  type StatusCard,
  type ViewId,
} from "@continuousc/relation-graph";
import { CircularLoading } from "./Loading";

import ChartHoneycomb, { Hexagon } from "./ChartHoneyComb";

import * as services from "../services";
import * as itemUtils from "../utils/items";
import * as maybeLoading from "../utils/maybeLoading";
import {
  STATUS_TO_TAILWIND_COLOR,
  ITEM_OVERVIEW_CONTEXT,
  WIDGET_DIMENSIONS,
  VIEW_CONTEXT,
  VIEW_ITEM_TYPE_CONTEXT,
  REV_STATUSES,
} from "../constants";

import { QueryKey, SearchParamsValuesView } from "../types/frontend";
import { type RootState } from "../state/store";

interface WidgetItemTypeStatusProps {
  itemType: ItemTypeId;
}

const NUMBER_OF_ITEMS = 120;
export default function WidgetItemTypeStatus(
  props: WidgetItemTypeStatusProps & Widget<StatusCard>
) {
  const spans = useRef<{
    [key: string]: {
      span: Span;
      endTime?: Date;
      timeout?: ReturnType<typeof setTimeout>;
    };
  }>({});
  const key = "WidgetItemTypeStatus";
  const tracer = trace.getTracer("default");
  if (spans.current[key] === undefined) {
    spans.current[key] = { span: tracer.startSpan("loadWidgetItemTypeStatus") };
  }
  const { span: loadSpan } = spans.current[key];

  const datetimeFilterPointInTime = useSelector(
    (state: RootState) => state.datetimeFilter.datetimePointInTime
  );
  const view = maybeLoading.useQuery({
    loadSpan,
    queryArgs: {},
    queryKey: QueryKey.ItemTypeView,
    extraDeps: [props.itemType],
    queryFn: async () => {
      return await services.getItemTypeView(props.itemType);
    },
  });
  const statusInfo = maybeLoading.useQuery({
    loadSpan,
    queryArgs: {},
    queryKey: QueryKey.StatusCardInfo,
    extraDeps: [props.itemType, datetimeFilterPointInTime],
    queryFn: async () => {
      return await services.getStatusCardInfo(
        props.itemType,
        datetimeFilterPointInTime.relative.unit === "now"
          ? null
          : datetimeFilterPointInTime.absolute,
        NUMBER_OF_ITEMS
      );
    },
  });
  const initialLoading = view === "loading" || statusInfo === "loading";
  const isLoading =
    maybeLoading.isLoading(view) || maybeLoading.isLoading(statusInfo);
  const viewError = maybeLoading.getError(view);
  const statusError = maybeLoading.getError(statusInfo);
  const viewData = maybeLoading.getDataOr(view, "");
  const statusInfoData = maybeLoading.getDataOr(statusInfo, {
    count: 0,
    status: Object.fromEntries(REV_STATUSES.map((status) => [status, 0])) as {
      [key in Status]: number;
    },
    unknown: 0,
    items: [],
  });
  return (
    <div
      className={`relative flex flex-col justify-between ${WIDGET_DIMENSIONS[1].widthTailwind} ${WIDGET_DIMENSIONS[1].heightTailwind}`}
    >
      {isLoading && <CircularLoading />}
      {initialLoading ? (
        <WidgetItemTypeStatusBaseSkeleton />
      ) : (
        <>
          {(viewError || statusError) && (
            <Alert
              severity="error"
              className="absolute top-40 lef-1/2 w-full z-10 h-44"
            >
              <AlertTitle>{viewError || statusError}</AlertTitle>
            </Alert>
          )}
          <WidgetItemTypeStatusBase
            statusInfo={statusInfoData}
            view={viewData}
            itemType={props.itemType}
          />
        </>
      )}
    </div>
  );
}

interface WidgetItemTypeStatusBaseProps {
  statusInfo: AggrStatusCounts;
  view?: ViewId;
  itemType: ItemTypeId;
}

function WidgetItemTypeStatusBase(props: WidgetItemTypeStatusBaseProps) {
  return (
    <>
      <Title
        itemType={props.itemType}
        countTotal={props.statusInfo.count}
        view={props.view}
      />
      <ChartHoneycomb
        columns={12}
        size={15}
        items={props.statusInfo.items}
        renderItem={(item, index) => {
          return (
            <>
              <Fade in timeout={1000 + index * 100}>
                <div title={itemUtils.getItemName(item.name)}>
                  <Link
                    to={
                      props.view
                        ? `/view/${props.view}?${SearchParamsValuesView.ItemId}=${item.id}&${SearchParamsValuesView.ItemContext}=${ITEM_OVERVIEW_CONTEXT[2]}&${SearchParamsValuesView.OpenAlertsIncludeChildren}=true`
                        : ""
                    }
                    className="cursor-pointer"
                  >
                    <Hexagon
                      className={`${STATUS_TO_TAILWIND_COLOR[item.status].background} hover:scale-125 flex items-center justify-center`}
                    />
                  </Link>
                  {index === NUMBER_OF_ITEMS - 1 &&
                    props.statusInfo.count > NUMBER_OF_ITEMS && (
                      <span className="absolute left-6 text-xs top-1">
                        +
                        {numberFormatter.format(
                          props.statusInfo.count - NUMBER_OF_ITEMS
                        )}
                      </span>
                    )}
                </div>
              </Fade>
            </>
          );
        }}
      />
      <div className="flex justify-between w-full">
        {REV_STATUSES.map((status) => (
          <StatusCount
            key={status}
            count={props.statusInfo.status[status] || 0}
            status={status}
            view={props.view}
            itemType={props.itemType}
          />
        ))}
      </div>
    </>
  );
}

function Title(props: { itemType: string; countTotal: number; view?: string }) {
  return (
    <div className="flex gap-2 items-center">
      <Avatar
        src={`/icons/${props.itemType}.svg`}
        variant="circular"
        alt={props.itemType}
        sx={{ width: 32, height: 32 }}
      />
      <span className="font-semibold">
        {numberFormatter.format(props.countTotal)}
      </span>
      <Link
        className="hover:underline cursor-pointer truncate"
        to={
          props.view
            ? `/view/${props.view}?${SearchParamsValuesView.ViewContext}=${VIEW_CONTEXT[1]}&${SearchParamsValuesView.ViewItemTypeContext}=${VIEW_ITEM_TYPE_CONTEXT[0]}&${SearchParamsValuesView.ItemType}=${props.itemType}&${SearchParamsValuesView.GridtFilterByManagedObjectType}=true`
            : ""
        }
      >
        {props.itemType}
      </Link>
    </div>
  );
}

const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });
function StatusCount(props: {
  count: number;
  status: Status;
  view?: ViewId;
  itemType: ItemTypeId;
}) {
  return (
    <div className="flex flex-col items-center">
      <Link
        to={
          props.view
            ? `/view/${props.view}?${SearchParamsValuesView.ViewContext}=${VIEW_CONTEXT[1]}&${SearchParamsValuesView.ViewItemTypeContext}=${VIEW_ITEM_TYPE_CONTEXT[0]}&${SearchParamsValuesView.ItemType}=${props.itemType}&${SearchParamsValuesView.GridtFilterByManagedObjectType}=true&${SearchParamsValuesView.GridFilterStatus}=${props.status}&${SearchParamsValuesView.GridtFilterStatusByEqual}=true`
            : ""
        }
        className={`font-bold text-base cursor-pointer hover:scale-125 ${props.count > 0 ? STATUS_TO_TAILWIND_COLOR[props.status].text : ""}`}
      >
        {numberFormatter.format(props.count)}
      </Link>
      <span className="text-xs capitalize opacity-75">{props.status}</span>
    </div>
  );
}

function WidgetItemTypeStatusBaseSkeleton() {
  return (
    <>
      <Skeleton animation="wave" variant="circular" width={32} height={32} />
      <Skeleton
        animation="wave"
        variant="rectangular"
        width={"50%"}
        height={30}
        className="self-center"
      />
      <Skeleton animation="wave" variant="rectangular" />
    </>
  );
}
