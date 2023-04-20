/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, memo, useMemo } from "react";
import { useDispatch } from "react-redux";
import * as maybeLoading from "../utils/maybeLoading";
import { type MaybeLoading } from "../utils/maybeLoading";
import {
  VictoryChart,
  VictoryAxis,
  createContainer,
  VictoryBrushContainerProps,
  VictoryVoronoiContainerProps,
  VictoryHistogram,
  VictoryTooltip,
  Bar,
  BarProps,
  FlyoutProps,
  DomainTuple,
  VictoryLine,
  VictoryScatter,
} from "victory";
import { toast } from "react-toastify";

import { setDateTimeIntervalAbsolute } from "../state/datatimeFilterSlice";
import { PRIMARY_COLOR, VICTORY_THEME } from "../constants";
import * as timeUtils from "../utils/time";

import { BinData, TimeAxisInterval } from "../types/frontend";

const Container = createContainer("brush", "voronoi") as React.ComponentType<
  VictoryBrushContainerProps & VictoryVoronoiContainerProps
>;

interface TimelineProps {
  timestampStart: string;
  timestampEnd: string;
  timestampCurrent: string;
  containerWidth: MaybeLoading<number>;
  onClickBin?: (startDate: string, endDate: string) => void;
  xTicks: MaybeLoading<TimeAxisInterval>;
  yTicks: number[];
  binnedData: BinData[];
  timestampCurrentFormatted: string;
  darkMode?: boolean;
}

const TimelineHistogram = memo(function TimelineHistogram(
  props: TimelineProps
) {
  const dispatch = useDispatch();
  const {
    xTicks,
    yTicks,
    binnedData,
    timestampStart,
    timestampEnd,
    timestampCurrent,
  } = props;

  const [domain, setDomain] = useState<{
    x: DomainTuple;
    y: DomainTuple;
  }>({
    x: [new Date(timestampStart), new Date(timestampStart)],
    y: [0, 0],
  });
  const xDomain = useMemo<{
    x: DomainTuple;
  }>(
    () => ({ x: [new Date(timestampStart), new Date(timestampEnd)] }),
    [timestampStart, timestampEnd]
  );

  useEffect(
    () =>
      setDomain({
        x: [new Date(), new Date()],
        y: [0, 0],
      }),
    [timestampStart, timestampEnd]
  );

  const minorTickValues = maybeLoading.useMemo({ xTicks }, ({ xTicks }) => {
    const values = xTicks.minors.values.map(
      (tick) => new Date(tick.timestamp)
    ) as any[];
    return values.length > 0 ? values : undefined;
  });
  const minorTickLabels = maybeLoading.useMemo({ xTicks }, ({ xTicks }) => {
    const values = xTicks.minors.values.map((tick) => tick.label) as any[];
    return values.length > 0 ? values : undefined;
  });
  const majorTickValues = maybeLoading.useMemo({ xTicks }, ({ xTicks }) => {
    const values = xTicks.majors?.values || [];
    return values.length > 0
      ? (values.map((tick) => new Date(tick.timestamp)) as any[])
      : undefined;
  });
  const majorTickLabels = maybeLoading.useMemo({ xTicks }, ({ xTicks }) => {
    const values = xTicks.majors?.values || [];
    return values.length > 0
      ? (values.map((tick) => tick.label) as any[])
      : undefined;
  });

  return (
    <div className="h-full cursor-crosshair z-10 relative">
      <VictoryChart
        theme={VICTORY_THEME}
        width={maybeLoading.mapOr(
          props.containerWidth,
          undefined,
          (width) => width * 1.5
        )}
        padding={90}
        domain={xDomain}
        scale={{ x: "time", y: "linear" }}
        containerComponent={
          <Container
            preserveAspectRatio="none"
            allowDrag={false}
            brushDimension="x"
            defaultBrushArea="disable"
            voronoiDimension="x"
            mouseFollowTooltips
            radius={180}
            labels={() => {
              return " ";
            }}
            labelComponent={
              <VictoryTooltip
                centerOffset={{ x: 20 }}
                flyoutComponent={<TimelineTooltip />}
              />
            }
            brushStyle={{
              stroke: "transparent",
              fill: "grey",
              fillOpacity: 0.1,
            }}
            brushDomain={domain}
            onBrushDomainChange={(newDomain) => setDomain(newDomain)}
            onBrushDomainChangeEnd={(newDomain) => {
              const timestampStart = newDomain.x[0] as Date;
              const timestampEnd = newDomain.x[1] as Date;
              if (timestampStart.toISOString() === timestampEnd.toISOString()) {
                return;
              }
              if (
                timeUtils.getIntervalInSeconds(
                  timestampStart.toISOString(),
                  timestampEnd.toISOString()
                ) < 60
              ) {
                setDomain({
                  x: [new Date(), new Date()],
                  y: [0, 0],
                });
                toast.error("Timerange must be greater than 1 minute", {
                  toastId: "timerange",
                });
                return;
              }
              dispatch(
                setDateTimeIntervalAbsolute({
                  ISOstringStart: timestampStart.toISOString(),
                  ISOstringEnd: timestampEnd.toISOString(),
                })
              );
            }}
          />
        }
      >
        <VictoryAxis
          dependentAxis
          tickValues={yTicks}
          style={{
            tickLabels: {
              fill: props.darkMode ? "white" : "black",
            },
            grid: {
              opacity: props.darkMode ? 0.1 : 1,
            },
          }}
        />
        <VictoryAxis
          domain={xDomain}
          tickValues={maybeLoading.getData(minorTickValues)}
          tickFormat={maybeLoading.getData(minorTickLabels)}
          style={{
            tickLabels: {
              padding: 10,
              fill: props.darkMode ? "white" : "black",
            },
            grid: {
              stroke: props.darkMode ? "grey" : "black",
              opacity: props.darkMode ? 0.3 : 1,
            },
          }}
        />
        <VictoryAxis
          domain={xDomain}
          tickValues={maybeLoading.getData(majorTickValues)}
          tickFormat={maybeLoading.getData(majorTickLabels)}
          style={{
            tickLabels: {
              padding: 32,
              fill: props.darkMode ? "white" : "black",
            },
            grid: {
              stroke: props.darkMode ? "grey" : "black",
              strokeDasharray: 0,
            },
          }}
        />
        <VictoryLine
          data={[
            { x: new Date(timestampStart), y: 0 },
            {
              x: new Date(timestampStart),
              y: yTicks[yTicks.length - 1] || 1,
            },
          ]}
          style={{
            data: {
              stroke: "grey",
              fill: "grey",
            },
          }}
        />
        <VictoryLine
          data={[
            { x: new Date(timestampEnd), y: 0 },
            { x: new Date(timestampEnd), y: yTicks[yTicks.length - 1] || 1 },
          ]}
          style={{
            data: {
              stroke: "grey",
              fill: "grey",
            },
          }}
        />
        <VictoryHistogram
          animate={false}
          scale={{ x: "time", y: "linear" }}
          data={binnedData}
          binSpacing={2}
          dataComponent={<WrapperBar />}
          events={[
            {
              target: "data",
              eventHandlers: {
                onClick: (_evt, data) => {
                  if (props.onClickBin !== undefined) {
                    props.onClickBin(
                      data.datum.startDateISO,
                      data.datum.endDateISO
                    );
                  }
                },
              },
            },
          ]}
        />
        <VictoryLine
          data={[
            { x: new Date(timestampCurrent), y: 0 },
            {
              x: new Date(timestampCurrent),
              y: yTicks[yTicks.length - 1] || 1,
            },
          ]}
          style={{
            data: {
              stroke: props.darkMode ? "white" : "black",
              strokeWidth: 2,
            },
            labels: {
              fill: props.darkMode ? "white" : "black",
              fontSize: 18,
            },
          }}
          labels={({ datum: { y } }: { datum: { y: number } }) =>
            y === 0 ? "" : props.timestampCurrentFormatted
          }
        />
        <VictoryScatter
          style={{ data: { fill: props.darkMode ? "white" : "black" } }}
          size={4}
          data={[
            {
              x: new Date(timestampCurrent),
              y: yTicks[yTicks.length - 1] || 1,
            },
          ]}
        />
      </VictoryChart>
    </div>
  );
});

export default TimelineHistogram;

function TimelineTooltip(props: FlyoutProps) {
  if (props.datum === undefined) {
    return <g></g>;
  }
  const { count, dateFormated, timeFormated } = props.datum as BinData;
  if (count === undefined) {
    return <g></g>;
  }
  const x = props.center?.x || props.x || 0;
  const y = props.center?.y || props.y || 0;
  const yBase = y < 190 ? y + 190 : y;
  return (
    <g fontSize="18">
      <rect
        x={x - 70}
        y={yBase - 130}
        width="130"
        height="100"
        rx="4.5"
        fill="white"
        stroke="#868C97"
        fillOpacity={50}
      />
      <text x={x - 65} y={yBase - 105} fontWeight="bold">
        {`${dateFormated}`}
      </text>
      <text x={x - 65} y={yBase - 80} fontWeight="bold">
        {`${timeFormated}`}
      </text>
      <rect x={x - 70} y={yBase - 70} width="130" height="1" />
      <rect
        x={x - 70}
        y={yBase - 70}
        width="3"
        height="40"
        fill={PRIMARY_COLOR}
      />
      <text x={x - 65} y={yBase - 40} fontWeight="bold" fill="#868C97">
        {`${count} Change${count === 1 ? "" : "s"}`}
      </text>
    </g>
  );
}

function WrapperBar(props: BarProps) {
  if (props.datum.y === 0) {
    return null;
  }
  return <Bar {...props} className="cursor-pointer" />;
}
