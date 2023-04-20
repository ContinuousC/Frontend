/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { memo, useEffect, useMemo, useRef } from "react";
import { useForm, FormProvider, UseFormWatch } from "react-hook-form";
import { trace, Span } from "@opentelemetry/api";
import {
  type QualifiedItemName,
  type SourceId,
  type ItemTypeDefinition,
} from "@continuousc/relation-graph";
import { zodResolver } from "@hookform/resolvers/zod";
import TuneIcon from "@mui/icons-material/Tune";

import PortalButton from "./PortalButton";
import Form from "./Form";

import * as services from "../services";
import * as chartUtils from "../utils/chart";
import * as generalUtils from "../utils/general";
import * as maybeLoading from "../utils/maybeLoading";

import {
  HandleQueryParams,
  SearchParamsValuesView,
  QueryKey,
  type MetricSources,
} from "../types/frontend";
import {
  viewSettings,
  type ViewSettings,
  FormSpecification,
} from "../types/form";
import { TOPOLOGY_LIMIT } from "../constants";

interface ViewSettingsProps {
  searchParams: URLSearchParams;
  setSearchParams: (params: HandleQueryParams | HandleQueryParams[]) => void;
  setMetricSource: (metricSource: MetricSources) => void;
  itemTypeDefinitions: maybeLoading.MaybeLoading<
    ItemTypeDefinition | undefined
  >;
}

const ViewSettings = memo(function ViewSettings(props: ViewSettingsProps) {
  const spans = useRef<{
    [key: string]: {
      span: Span;
      endTime?: Date;
      timeout?: ReturnType<typeof setTimeout>;
    };
  }>({});
  const key = "viewSettings";
  const tracer = trace.getTracer("default");
  if (spans.current[key] === undefined) {
    spans.current[key] = { span: tracer.startSpan("loadViewSettings") };
  }
  const { span: loadSpan } = spans.current[key];

  const metricSources = maybeLoading.useQuery({
    loadSpan,
    queryKey: QueryKey.SourceMetric,
    queryArgs: { itemTypeDefinitions: props.itemTypeDefinitions },
    queryFn: async ({ itemTypeDefinitions }) => {
      if (itemTypeDefinitions !== undefined) {
        const metricSourcesNew: { [key: QualifiedItemName]: SourceId[] } = {};
        const promItems = chartUtils.getPromItems(itemTypeDefinitions.metrics);
        for (const promItem of promItems) {
          metricSourcesNew[promItem] =
            await services.getMetricSources(promItem);
        }
        return metricSourcesNew;
      }
    },
  });
  const metricSourcesData = maybeLoading.getData(metricSources);
  const form: FormSpecification<ViewSettings>[] = useMemo(() => {
    const form: FormSpecification<ViewSettings>[] = [
      {
        formType: "group",
        name: SearchParamsValuesView.GridtFilterStatusByEqual,
        label: "",
        withToggle: true,
        forms: [
          {
            label: "Topology",
            form: [
              {
                formType: "textField",
                name: SearchParamsValuesView.TopologyLimit,
                label: "Limit for query limit",
                number: "integer",
              },
            ],
          },
          {
            label: "Managed Objects",
            form: [
              {
                formType: "toggle",
                name: SearchParamsValuesView.FilterElementsByTopology,
                label: "Filter managed objects from topology",
                title:
                  "Filter managed objects from topology in properties table, health grid and open alerts",
              },
              {
                formType: "toggle",
                name: SearchParamsValuesView.GridtFilterByManagedObjectType,
                label: "Filter Grid By Managed Object Type",
              },
              {
                formType: "toggle",
                name: SearchParamsValuesView.OpenAlertsIncludeChildren,
                label: "Include children for alerts in managed object overview",
              },
            ],
          },
        ],
      },
    ];
    if (metricSourcesData !== undefined) {
      form.push({
        formType: "subForm",
        name: "metricSources",
        label: "Metrics Prometheus Sources",
        form: Object.entries(metricSourcesData || {}).map(
          ([promItem, sourcIds]) => ({
            formType: "select",
            name: `metricSources.${promItem}`,
            label: promItem,
            options: sourcIds.map((sourceId) => ({
              name: `metricSources.${promItem}`,
              label: sourceId,
              value: sourceId,
            })),
          })
        ),
      });
    }
    return form;
  }, [metricSourcesData]);
  const filterValue = useMemo<ViewSettings>(() => {
    const topologyLimitParam = Number(
      props.searchParams.get(SearchParamsValuesView.TopologyLimit)
    );
    return {
      topologyLimit:
        Number.isInteger(topologyLimitParam) && topologyLimitParam > 0
          ? topologyLimitParam
          : TOPOLOGY_LIMIT,
      filterElementsByTopology:
        props.searchParams.get(
          SearchParamsValuesView.FilterElementsByTopology
        ) !== "false",
      gridFilterStatusByEqual:
        props.searchParams.get(
          SearchParamsValuesView.GridtFilterStatusByEqual
        ) === "true",
      gridFilterByManagedObjectType:
        props.searchParams.get(
          SearchParamsValuesView.GridtFilterByManagedObjectType
        ) === "true",
      metricSources: Object.fromEntries(
        Object.entries(metricSourcesData || {}).map(
          ([promItem, sourcesParam]) => [promItem, sourcesParam[0]]
        )
      ),
      openAlertsIncludeChildren:
        props.searchParams.get(
          SearchParamsValuesView.OpenAlertsIncludeChildren
        ) === "true",
    };
  }, [metricSourcesData]);
  const methods = useForm<ViewSettings>({
    defaultValues: filterValue,
    values: filterValue,
    resolver: zodResolver(viewSettings),
  });

  watcher({
    setSearchParams: props.setSearchParams,
    watch: methods.watch,
    setMetricSource: props.setMetricSource,
  });
  return (
    <FormProvider {...methods}>
      <PortalButton
        popperChild={Form}
        popperProps={{ form }}
        title="Settings"
        buttonChild={<TuneIcon fontSize="small" />}
        iconButton
      />
    </FormProvider>
  );
});

export default ViewSettings;

function watcher(props: {
  setSearchParams: (params: HandleQueryParams | HandleQueryParams[]) => void;
  watch: UseFormWatch<ViewSettings>;
  setMetricSource: (metricSource: MetricSources) => void;
}) {
  const filterElementsByTopology = props.watch(
    SearchParamsValuesView.FilterElementsByTopology
  );
  useEffect(() => {
    props.setSearchParams({
      filterName: SearchParamsValuesView.FilterElementsByTopology,
      values: filterElementsByTopology ? ["true"] : ["false"],
    });
  }, [filterElementsByTopology]);

  const gridtFilterByManagedObjectType = props.watch(
    SearchParamsValuesView.GridtFilterByManagedObjectType
  );
  useEffect(() => {
    props.setSearchParams({
      filterName: SearchParamsValuesView.GridtFilterByManagedObjectType,
      values: gridtFilterByManagedObjectType ? ["true"] : [],
    });
  }, [gridtFilterByManagedObjectType]);

  const gridtFilterStatusByEqual = props.watch(
    SearchParamsValuesView.GridtFilterStatusByEqual
  );
  useEffect(() => {
    props.setSearchParams({
      filterName: SearchParamsValuesView.GridtFilterStatusByEqual,
      values: gridtFilterStatusByEqual ? ["true"] : [],
    });
  }, [gridtFilterStatusByEqual]);

  const openAlertsIncludeChildren = props.watch(
    SearchParamsValuesView.OpenAlertsIncludeChildren
  );
  useEffect(() => {
    props.setSearchParams({
      filterName: SearchParamsValuesView.OpenAlertsIncludeChildren,
      values: openAlertsIncludeChildren ? ["true"] : [],
    });
  }, [openAlertsIncludeChildren]);

  const topologyLimit = props.watch(SearchParamsValuesView.TopologyLimit);
  useEffect(() => {
    generalUtils.debounce((topologyLimit: number) => {
      props.setSearchParams([
        {
          filterName: SearchParamsValuesView.TopologyLimit,
          values: topologyLimit !== undefined ? [topologyLimit.toString()] : [],
        },
      ]);
    }, 1000)(topologyLimit);
  }, [topologyLimit]);

  const metricSources = props.watch("metricSources");
  useEffect(() => {
    props.setMetricSource(metricSources as MetricSources);
  }, [metricSources]);
}
