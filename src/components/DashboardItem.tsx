/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useState, SyntheticEvent } from "react";
import {
  type InstanceDashboard,
  type JsItems,
  type ItemId,
  type ItemTypeDefinition,
  type DashboardMetricId,
  type DashboardMetric,
  type Widget,
  type InstanceWidget,
} from "@continuousc/relation-graph";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import WidgetItemInstant from "./WidgetItemInstant";
import WidgetItemRange from "./WidgetItemRange";
import { WidgetItemAnomalyTraces } from "./WidgetAnomalyTraces";

import * as maybeLoading from "../utils/maybeLoading";

import { type MetricSources } from "../types/frontend";

interface DashboardProps {
  items: maybeLoading.MaybeLoading<JsItems>;
  itemType: maybeLoading.MaybeLoading<string | undefined>;
  dashboardMetrics: ItemTypeDefinition["metrics"];
  definitions: InstanceDashboard;
  itemId: ItemId;
  onClickRow?: (itemId: ItemId) => void;
  metricSource: MetricSources;
}
export default function DashboardItem(props: DashboardProps) {
  const [expanedPanel, setExpandedPanel] = useState<number | false>(0);
  const handleExpandPanel =
    (panel: number) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpandedPanel(isExpanded ? panel : false);
    };

  return (
    <div>
      {props.definitions !== undefined &&
        props.definitions.panels.length > 0 ? (
        props.definitions.panels.map((panel, index) => (
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
              <WidgetItem
                metrics={props.dashboardMetrics}
                definitions={panel.widgets}
                items={props.items}
                itemId={props.itemId}
                itemType={props.itemType}
                sources={props.metricSource || {}}
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

interface WidgetItemProps {
  items: maybeLoading.MaybeLoading<JsItems>;
  itemType: maybeLoading.MaybeLoading<string | undefined>;
  metrics: { [key: DashboardMetricId]: DashboardMetric };
  definitions: Widget<InstanceWidget>[];
  sources: MetricSources;
  itemId: ItemId;
  panelName?: string;
}

function WidgetItem(props: WidgetItemProps) {
  const { definitions } = props;
  return (
    <div className="flex flex-wrap gap-2 justify-center lg:justify-start relative w-full">
      {definitions.map((definition, index) => {
        const id =
          props.itemType + props.itemId + definition.name + index.toString();
        if (definition.graph === "instant") {
          return (
            <WidgetItemInstant
              key={id}
              metrics={props.metrics}
              definition={definition}
              sources={props.sources}
              items={props.items}
              itemId={props.itemId}
              itemType={props.itemType}
            />
          );
        } else if (definition.graph === "range") {
          if (definition.widget_type === "lines") {
            return (
              <WidgetItemRange
                key={id}
                id={id}
                metrics={props.metrics}
                definition={definition}
                sources={props.sources}
                items={props.items}
                itemType={props.itemType}
                itemId={props.itemId}
                panelName={props.panelName}
              />
            );
          } else {
            return (
              <WidgetItemAnomalyTraces
                key={id}
                id={id}
                definition={definition}
                items={props.items}
                itemId={props.itemId}
                panelName={props.panelName}
              />
            );
          }
        }
      })}
    </div>
  );
}
