/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { memo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { type Bin } from "@continuousc/relation-graph";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import IconButton from "@mui/material/IconButton";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

import TimelineHistogram from "./TimelineHistogram";
import Loading from "./Loading";

import { toggleTimeline } from "../state/uiSettingsSlice";
import * as timelineUtils from "../utils/timeline";
import * as timeUtils from "../utils/time";
import * as maybeLoading from "../utils/maybeLoading";

import { type RootState } from "../state/store";
import {
  DateTimeInterval,
  TimeScale,
  ChangeEventSource,
} from "../types/frontend";
import { CHANGE_EVENT_SOURCES } from "../constants";

interface TimelineProps {
  bins: maybeLoading.MaybeLoading<Bin[]>;
  timeScale: maybeLoading.MaybeLoading<TimeScale>;
  dateTimeIntervalDefault: DateTimeInterval;
  containerWidth: maybeLoading.MaybeLoading<number>;
  changeEventSource: ChangeEventSource;
  showEvents: (
    show: boolean,
    dates?: { startDate: string; endDate: string }
  ) => void;
  onChangeEventSource: (changeEventSource: ChangeEventSource) => void;
}

const Timeline = memo(function Timeline(props: TimelineProps) {
  const dispatch = useDispatch();
  const uiSettings = useSelector((state: RootState) => state.uiSettings);
  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );

  const handleClickBin = useCallback((startDate: string, endDate: string) => {
    props.showEvents(true, { startDate, endDate });
  }, []);

  const xTicks = maybeLoading.useMemo(
    { timeScale: props.timeScale },
    ({ timeScale }) =>
      timelineUtils.getTimeTicks(
        datetimeFilter.datetimeStart.absolute,
        datetimeFilter.datetimeEnd.absolute,
        timeScale,
        datetimeFilter.timezone,
        datetimeFilter.locale
      ),
    [
      datetimeFilter.datetimeStart.absolute,
      datetimeFilter.datetimeEnd.absolute,
      datetimeFilter.timezone,
      datetimeFilter.locale,
    ]
  );
  const timelineBins = maybeLoading.useMemo(
    { bins: props.bins },
    ({ bins }) => {
      return timelineUtils.convertToTimelineBins({
        bins,
        timezone: datetimeFilter.timezone,
        locale: datetimeFilter.locale,
        startISO: datetimeFilter.datetimeStart.absolute,
        endISO: datetimeFilter.datetimeEnd.absolute,
      });
    },
    [
      datetimeFilter.timezone,
      datetimeFilter.locale,
      datetimeFilter.datetimeStart.absolute,
      datetimeFilter.datetimeEnd.absolute,
    ]
  );
  const error = maybeLoading.getError(timelineBins);
  const timelineBinsData = maybeLoading.getDataOr(timelineBins, {
    totalHits: 0,
    yTicks: [],
    binnedData: [],
  });
  return (
    <div className="h-full relative w-full">
      {maybeLoading.isLoading(timelineBins) && uiSettings.showTimeline && (
        <Loading />
      )}
      <div className="h-4 flex gap-2 absolute left-1/2 top-[-20px] z-50">
        <Tooltip
          title={uiSettings.showTimeline ? "Hide Timeline" : "Show Timeline"}
          leaveTouchDelay={1000}
        >
          <Button
            onClick={() => dispatch(toggleTimeline())}
            variant="contained"
            size="small"
          >
            {uiSettings.showTimeline ? (
              <KeyboardArrowDownIcon fontSize="small" />
            ) : (
              <KeyboardArrowUpIcon fontSize="small" />
            )}
          </Button>
        </Tooltip>
      </div>
      <Paper
        className={`h-full w-full relative flex flex-col justify-center gap-2 p-1 ${uiSettings.showTimeline ? "" : "hidden"
          }`}
      >
        <div className="flex items-center absolute top-0 w-full z-[100] gap-10 h-[52px]">
          <div className="flex justify-between w-1/2">
            <div>
              <ToggleButtonGroup
                value={props.changeEventSource}
                onChange={(_event, newValue) =>
                  newValue !== null && props.onChangeEventSource(newValue)
                }
                exclusive
                size="small"
                sx={{ fontSize: 11, height: 24 }}
              >
                {CHANGE_EVENT_SOURCES.map((changeEventSource) => (
                  <ToggleButton
                    value={changeEventSource}
                    key={changeEventSource}
                  >
                    {changeEventSource}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Tooltip title="Show All Changes">
                <IconButton onClick={() => props.showEvents(true)}>
                  <EventNoteIcon />
                </IconButton>
              </Tooltip>
            </div>
            <div className="flex flex-row gap-1 items-center">
              <span className="flex font-bold w-full items-center">
                {maybeLoading.isLoading(timelineBins) ? (
                  <CircularProgress size={12} />
                ) : (
                  timelineBinsData.totalHits.toLocaleString()
                )}{" "}
              </span>
              {timelineBinsData.totalHits === 1 ? "Change" : "Changes"}
            </div>
          </div>
          {error && <Alert severity="error">{error}</Alert>}
        </div>
        <div className="h-0 grow w-full">
          <TimelineHistogram
            timestampStart={datetimeFilter.datetimeStart.absolute}
            timestampEnd={datetimeFilter.datetimeEnd.absolute}
            timestampCurrent={datetimeFilter.datetimePointInTime.absolute}
            containerWidth={props.containerWidth}
            onClickBin={handleClickBin}
            xTicks={xTicks}
            yTicks={timelineBinsData.yTicks}
            binnedData={timelineBinsData.binnedData}
            timestampCurrentFormatted={timeUtils.formatCustom(
              datetimeFilter.datetimePointInTime.absolute,
              "ff",
              datetimeFilter.timezone,
              datetimeFilter.locale
            )}
            darkMode={uiSettings.darkMode}
          />
        </div>
      </Paper>
    </div>
  );
});

export default Timeline;
