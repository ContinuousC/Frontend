/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useState, SyntheticEvent } from "react";
import {
  type TypeRangeDashboard,
  type JsItems,
  type ItemTypeDefinition,
  type DashboardMetricId,
  type DashboardMetric,
  type Widget,
  type TypeRangeWidget,
} from "@continuousc/relation-graph";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import WidgetItemTypeRange from "./WidgetItemTypeRange";
import { WidgetItemTypeAnomalyTraces } from "./WidgetAnomalyTraces";

import * as maybeLoading from "../utils/maybeLoading";

import { type MetricSources } from "../types/frontend";

interface DashboardProps {
  items: maybeLoading.MaybeLoading<JsItems>;
  itemType: maybeLoading.MaybeLoading<string | null>;
  metricDefintions: ItemTypeDefinition["metrics"];
  rangeDashboard?: TypeRangeDashboard;
  sources: MetricSources;
}

export default function DashboardItemType(props: DashboardProps) {
  const [expanedPanel, setExpandedPanel] = useState<number | false>(0);
  const handleExpandPanel =
    (panel: number) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpandedPanel(isExpanded ? panel : false);
    };

  return (
    <div>
      {props.rangeDashboard !== undefined &&
      props.rangeDashboard.panels.length > 0 ? (
        props.rangeDashboard.panels.map((panel, index) => (
          <Accordion
            key={panel.name}
            expanded={expanedPanel === index}
            onChange={handleExpandPanel(index)}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className="text-base font-bold"
            >
              <span className="relative">
                {panel.name}{" "}
                {panel.documentation && (
                  <Tooltip
                    title={panel.documentation}
                    className="cursor-help absolute"
                  >
                    <InfoIcon color="info" fontSize="small" />
                  </Tooltip>
                )}
              </span>
            </AccordionSummary>
            <AccordionDetails>
              <WidgetItemType
                metrics={props.metricDefintions}
                definitions={panel.widgets}
                items={props.items}
                itemType={props.itemType}
                sources={props.sources || {}}
                panelName={panel.name}
              />
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Alert severity="info">
          <AlertTitle>Dashboard not specified</AlertTitle>
        </Alert>
      )}
    </div>
  );
}

interface WidgetItemTypeProps {
  items: maybeLoading.MaybeLoading<JsItems>;
  itemType: maybeLoading.MaybeLoading<string | null>;
  metrics: { [key: DashboardMetricId]: DashboardMetric };
  definitions: Widget<TypeRangeWidget>[];
  sources: MetricSources;
  panelName?: string;
}

function WidgetItemType(props: WidgetItemTypeProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center lg:justify-start relative w-full">
      {props.definitions.map((definition, index) => {
        const id = props.itemType + definition.name + index.toString();
        if (definition.widget_type === "lines") {
          return (
            <WidgetItemTypeRange
              key={index}
              id={id}
              metrics={props.metrics}
              definition={definition}
              sources={props.sources}
              items={props.items}
              itemType={props.itemType}
              panelName={props.panelName}
            />
          );
        } else if (definition.widget_type === "anomaly_traces") {
          return (
            <WidgetItemTypeAnomalyTraces
              key={index}
              id={id}
              definition={definition}
              items={props.items}
              itemType={props.itemType}
              panelName={props.panelName}
            />
          );
        }
      })}
    </div>
  );
}
