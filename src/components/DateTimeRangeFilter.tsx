/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import Divider from "@mui/material/Divider";
import TodayIcon from "@mui/icons-material/Today";
import EventIcon from "@mui/icons-material/Event";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import DateTimeFilterButton from "./DateTimeFilter";
import DateTimeRelativeFilterButton from "./DateTimeRelativeFilter";

import {
  setDateTimeIntervalRelative,
  setDateTimeStart,
  setDateTimeEnd,
} from "../state/datatimeFilterSlice";
import * as timeUtils from "../utils/time";
import { NOW_DATE_RELATIVE_TIME } from "../constants";

import { DateTime, RelativeDateTime } from "../types/frontend";
import { type RootState } from "../state/store";

interface DateTimeRangeFilterProps {
  highlighted?: boolean;
}

export default function DateTimeRangeFilter(props: DateTimeRangeFilterProps) {
  const dispatch = useDispatch();
  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );
  const handleRelativeNodeDatetime = useCallback((relative: RelativeDateTime) =>
    dispatch(
      setDateTimeIntervalRelative({
        relativeDateTimeStart: relative,
        relativeDateTimeEnd: NOW_DATE_RELATIVE_TIME,
      })
    ), []);
  const handleStartDateTimeChange = useCallback((datetimeStart: DateTime) =>
    dispatch(setDateTimeStart(datetimeStart)), []);
  const handleEndDateTimeChange = useCallback((datetimeEnd: DateTime) =>
    dispatch(setDateTimeEnd(datetimeEnd)), []);
  const handleIsValidRelativeDateTimeStart = useCallback((relative: RelativeDateTime) => {
    try {
      return timeUtils.isValidInterval(
        timeUtils.relativeToAbsoluteDateTime(
          relative,
          datetimeFilter.globalClock,
          datetimeFilter.timezone
        ),
        datetimeFilter.datetimeEnd.absolute
      );
    } catch {
      return false;
    }
  }, [datetimeFilter]);
  const handleIsValidRelativeDateTimeEnd = useCallback((relative: RelativeDateTime) =>
    timeUtils.isValidInterval(
      datetimeFilter.datetimeStart.absolute,
      timeUtils.relativeToAbsoluteDateTime(
        relative,
        datetimeFilter.globalClock,
        datetimeFilter.timezone
      )
    ), [datetimeFilter]);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs">Range</span>
      <div
        className={`flex w-[409px] items-center rounded-sm ring-2 ${props.highlighted ? "ring-[#006eff]" : "ring-current"}`}
      >
        <DateTimeRelativeFilterButton
          onAccept={handleRelativeNodeDatetime}
          value={datetimeFilter.datetimeStart}
          disableNow
          locale={datetimeFilter.locale}
        />
        <Divider orientation="vertical" flexItem variant="middle" />
        <DateTimeFilterButton
          title="Start Time"
          Icon={TodayIcon}
          value={datetimeFilter.datetimeStart}
          onAccept={handleStartDateTimeChange}
          disableNow
          maxDateTime={datetimeFilter.datetimeEnd}
          isValidRelativeDateTime={handleIsValidRelativeDateTimeStart}
          timezone={datetimeFilter.timezone}
          locale={datetimeFilter.locale}
          globalClock={datetimeFilter.globalClock}
        />
        <ArrowForwardIcon fontSize="small" />
        <DateTimeFilterButton
          title="End Time"
          Icon={EventIcon}
          value={datetimeFilter.datetimeEnd}
          onAccept={handleEndDateTimeChange}
          minDateTime={datetimeFilter.datetimeStart}
          isValidRelativeDateTime={handleIsValidRelativeDateTimeEnd}
          timezone={datetimeFilter.timezone}
          locale={datetimeFilter.locale}
          globalClock={datetimeFilter.globalClock}
        />
      </div>
    </div>
  );
}
