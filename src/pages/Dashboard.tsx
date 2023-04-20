/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useRef } from "react";
import { useParams } from "react-router-dom";
import { context, trace, Span } from "@opentelemetry/api";

import useSearchParams from "../hooks/useSearchParams";

import Loading from "../components/Loading";
import DashboardOverview from "../components/DashboardOverview";

import * as services from "../services";
import * as maybeLoading from "../utils/maybeLoading";

import { QueryKey } from "../types/frontend";

export default function Dashboard() {
  const spans = useRef<{
    [key: string]: {
      span: Span;
      endTime?: Date;
      timeout?: ReturnType<typeof setTimeout>;
    };
  }>({});
  const key = "dashboard";
  const tracer = trace.getTracer("default");
  if (spans.current[key] === undefined) {
    spans.current[key] = { span: tracer.startSpan("loadDashboard") };
  }
  const { span: loadSpan } = spans.current[key];
  const renderSpan = tracer.startSpan(
    "renderDashboard",
    undefined,
    trace.setSpan(context.active(), loadSpan)
  );
  const { dashboardId } = useParams();
  const [_searchParams, setSearchParams] = useSearchParams();

  const dashboard = maybeLoading.useQuery({
    loadSpan,
    queryArgs: {},
    queryKey: QueryKey.Dashboard,
    extraDeps: [dashboardId],
    queryFn: async () => {
      const newDashboard = await services.getDashboard(dashboardId as string);
      return newDashboard;
    },
  });

  const r = (
    <>
      {maybeLoading.isLoading(dashboard) && <Loading />}
      <DashboardOverview
        dashboard={dashboard}
        setSearchParams={setSearchParams}
      />
    </>
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
