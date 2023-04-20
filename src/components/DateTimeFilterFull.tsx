/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { memo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Tooltip from "@mui/material/Tooltip";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import IconButton from "@mui/material/IconButton";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";

import DateTimeRangeFilter from "./DateTimeRangeFilter";
import DateTimeFilterButton from "./DateTimeFilter";

import { setDateTimeStampPointInTime } from "../state/datatimeFilterSlice";
import * as timeUtils from "../utils/time";

import {
  SearchParamsValuesView,
  type DateTime,
  type HandleQueryParams,
} from "../types/frontend";
import { type RootState } from "../state/store";

interface DateTimeFilterFullProps {
  rangeHighlighted?: boolean;
  pointInTimeHiglighted?: boolean;
  setSearchParams: (params: HandleQueryParams | HandleQueryParams[]) => void;
}

const DateTimeFilterFull = memo(function DateTimeFilterFull(
  props: DateTimeFilterFullProps
) {
  const dispatch = useDispatch();
  const handlePointInTimeDateTimeChange = useCallback(
    (dateTime: DateTime | null) => {
      dispatch(setDateTimeStampPointInTime(dateTime));
    },
    []
  );
  const datetimeFilter = useSelector(
    (state: RootState) => state.datetimeFilter
  );
  useEffect(
    () =>
      props.setSearchParams([
        {
          filterName: SearchParamsValuesView.DatetimePointInTime,
          values: [
            timeUtils.convertDateTimeToSearchParamsString(
              datetimeFilter.datetimePointInTime
            ),
          ],
        },
        {
          filterName: SearchParamsValuesView.DatetimeStart,
          values: [
            timeUtils.convertDateTimeToSearchParamsString(
              datetimeFilter.datetimeStart
            ),
          ],
        },
        {
          filterName: SearchParamsValuesView.DatetimeEnd,
          values: [
            timeUtils.convertDateTimeToSearchParamsString(
              datetimeFilter.datetimeEnd
            ),
          ],
        },
      ]),
    [
      datetimeFilter.datetimePointInTime,
      datetimeFilter.datetimeStart,
      datetimeFilter.datetimeEnd,
    ]
  );
  const isLive =
    datetimeFilter.datetimePointInTime.relative.unit === "now" &&
    datetimeFilter.datetimeEnd.relative.unit === "now";
  return (
    <div className="flex gap-2 flex-col sm:flex-row sm:items-end items-start">
      <DateTimeRangeFilter highlighted={props.rangeHighlighted} />
      <div className="flex flex-col gap-1">
        <span className="text-xs">Point In Time </span>
        <div
          className={`rounded-sm ring-2 ${props.pointInTimeHiglighted ? "ring-[#006eff]" : "ring-current"}`}
        >
          <DateTimeFilterButton
            title="Point In Time"
            Icon={CalendarTodayIcon}
            value={datetimeFilter.datetimePointInTime}
            onAccept={handlePointInTimeDateTimeChange}
            timezone={datetimeFilter.timezone}
            locale={datetimeFilter.locale}
            globalClock={datetimeFilter.globalClock}
          />
        </div>
      </div>
      <Tooltip title={isLive ? "Live" : "Go Live"}>
        <span>
          <IconButton
            disabled={isLive}
            size="small"
            onClick={() => handlePointInTimeDateTimeChange(null)}
            color={isLive ? "primary" : "inherit"}
          >
            {isLive ? (
              <PlayCircleOutlineIcon color="primary" fontSize="small" />
            ) : (
              <PlayCircleFilledWhiteIcon color="warning" fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
});

export default DateTimeFilterFull;
