/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useContext, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";

import PortalButton from "./PortalButton";
import Form from "./Form";

import {
  topologyMetricSettings,
  type TopologyMetricSettings,
  FormSpecification,
} from "../types/form";

import { TopologyContext } from "../context";

export function TopologyMetricSettingsButton() {
  const { topologies, topologyId } = useContext(TopologyContext);
  const hasTopologyMetricsStylesheet =
    topologies[topologyId]?.stylesheet.items?.find(
      (style) =>
        style.style.metric_badge !== undefined ||
        style.style.metric_size !== undefined
    ) ||
    topologies[topologyId]?.stylesheet.relations?.find(
      (style) =>
        style.style.metric_color !== undefined ||
        style.style.metric_size !== undefined ||
        style.style.metric_label !== undefined
    );
  return (
    <PortalButton
      popperChild={TopologyMetricSettingsForm}
      popperProps={{}}
      buttonChild={<FormatColorFillIcon fontSize="small" />}
      disabled={!hasTopologyMetricsStylesheet}
      title="Stylesheet Settings"
      iconButton
    />
  );
}

function TopologyMetricSettingsForm() {
  const { topologies, topologyId } = useContext(TopologyContext);
  const { form, initialValues } = useMemo<{
    form: FormSpecification<TopologyMetricSettings>[];
    initialValues: TopologyMetricSettings;
  }>(() => {
    const initialValues: { [key: string]: boolean } = {};
    const form: FormSpecification<TopologyMetricSettings>[] = [];
    topologies[topologyId]?.stylesheet.items?.forEach((style) => {
      if (style.style.metric_badge) {
        const name = style.style.metric_badge.name;
        const value = !style.style.metric_badge.default_enabled;
        const title = style.style.metric_badge.title;
        initialValues[name] = value;
        form.push({
          formType: "toggle",
          name,
          label: name,
          title,
        });
      }
      if (style.style.metric_size) {
        const name = style.style.metric_size.name;
        const value = !style.style.metric_size.default_enabled;
        const title = style.style.metric_size.title;
        initialValues[name] = value;
        form.push({
          formType: "toggle",
          name,
          label: name,
          title,
        });
      }
    });
    topologies[topologyId]?.stylesheet.relations?.forEach((style) => {
      if (style.style.metric_color) {
        const name = style.style.metric_color.name;
        const value = !style.style.metric_color.default_enabled;
        const title = style.style.metric_color.title;
        initialValues[name] = value;
        form.push({
          formType: "toggle",
          name,
          label: name,
          title,
        });
      }
      if (style.style.metric_size) {
        const name = style.style.metric_size.name;
        const value = !style.style.metric_size.default_enabled;
        const title = style.style.metric_size.title;
        initialValues[name] = value;
        form.push({
          formType: "toggle",
          name,
          label: name,
          title,
        });
      }
      if (style.style.metric_label) {
        const name = style.style.metric_label.name;
        const value = !style.style.metric_label.default_enabled;
        const title = style.style.metric_label.title;
        initialValues[name] = value;
        form.push({
          formType: "toggle",
          name,
          label: name,
          title,
        });
      }
    });
    return {
      form,
      initialValues,
    };
  }, [topologyId, topologies]);
  const methods = useForm<TopologyMetricSettings>({
    defaultValues: initialValues,
    values: initialValues,
    resolver: zodResolver(topologyMetricSettings),
  });
  return (
    <FormProvider {...methods}>
      <Form form={form} disabled />
    </FormProvider>
  );
}
