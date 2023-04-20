/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { context, trace, Span } from "@opentelemetry/api";
import { useSelector } from "react-redux";
import { type ItemId, type ItemTypeId } from "@continuousc/relation-graph";

import useSearchParams from "../hooks/useSearchParams";

import OpenAlertsTable from "../components/OpenAlertsTable";

import * as services from "../services";
import * as maybeLoading from "../utils/maybeLoading";

import { QueryKey, SearchParamsValuesView } from "../types/frontend";
import { type RootState } from "../state/store";
import DateTimeFilterFull from "../components/DateTimeFilterFull";
import { toast } from "react-toastify";
import { ITEM_OVERVIEW_CONTEXT } from "../constants";

export default function OpenAlerts() {
  const spans = useRef<{
    [key: string]: {
      span: Span;
      endTime?: Date;
      timeout?: ReturnType<typeof setTimeout>;
    };
  }>({});
  const key = "openAlerts";
  const tracer = trace.getTracer("default");
  if (spans.current[key] === undefined) {
    spans.current[key] = { span: tracer.startSpan("loadOpenAlerts") };
  }
  const { span: loadSpan } = spans.current[key];
  const renderSpan = tracer.startSpan(
    "renderOpenAlerts",
    undefined,
    trace.setSpan(context.active(), loadSpan)
  );

  const navigate = useNavigate();

  const [_searchParams, setSearchParams] = useSearchParams();
  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );

  const openAlerts = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.OpenAlertsAll,
    queryArgs: {},
    extraDeps: [datetimeFilter.datetimePointInTime],
    queryFn: async () => {
      return await services.getOpenAlerts(
        datetimeFilter.datetimePointInTime.relative.unit === "now"
          ? null
          : datetimeFilter.datetimePointInTime.absolute
      );
    },
  });

  const views = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.Views,
    queryArgs: {},
    extraDeps: [],
    queryFn: async () => {
      return services.getViews();
    },
  });
  const viewData = maybeLoading.getData(views);
  const handleClickItem = useCallback(
    (itemId: ItemId, itemType?: ItemTypeId) => {
      const view = Object.entries(viewData || {})
        .map(([viewId, view]) => ({
          id: viewId,
          itemTypes: view.elements.internal.item_types,
        }))
        .find(
          (view) => itemType !== undefined && view.itemTypes.includes(itemType)
        );
      if (view?.id) {
        navigate(
          `/view/${view.id}?${SearchParamsValuesView.ItemType}=${itemType}&${SearchParamsValuesView.ItemId}=${itemId}&${SearchParamsValuesView.ItemContext}=${ITEM_OVERVIEW_CONTEXT[2]}`
        );
      } else {
        toast.warning("Managed object does not belong to a layer", {
          toastId: "openAlertsPage",
        });
      }
    },
    [viewData]
  );
  const r = (
    <div className="flex flex-col gap-2 h-full">
      <div className="self-end">
        <DateTimeFilterFull
          pointInTimeHiglighted
          setSearchParams={setSearchParams}
        />
      </div>
      <div className="w-full grow h-full">
        <OpenAlertsTable
          data={openAlerts}
          onClickRow={handleClickItem}
          showItemTypeColumn
        />
      </div>
    </div>
  );

  renderSpan.end();

  spans.current[key].endTime = new Date();
  if (spans.current[key].timeout !== undefined) {
    clearTimeout(spans.current[key].timeout);
  }
  spans.current[key].timeout = setTimeout(() => {
    const { span, endTime } = spans.current[key];
    span.end(endTime);
    delete spans.current[key];
  }, 5000);

  return r;
}
