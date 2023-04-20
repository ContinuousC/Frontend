/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { toast } from "react-toastify";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import * as timeUtils from "../utils/time";
import { NOW_DATE_RELATIVE_TIME, TimeZone } from "../constants";

import {
  DateTime,
  RelativeDateTime,
  SearchParamsValuesView,
} from "../types/frontend";

export const datetimeFilterSlice = createSlice({
  name: "datetimeFilter",
  initialState: () => {
    const timezone = "Europe/Brussels" as TimeZone; //timeUtils.getSystemTimeZone();
    const locale = "en-GB"; //timeUtils.getSystemLocale();
    const urlParams = new URLSearchParams(window.location.search);
    const globalClock = timeUtils.getNow(timezone);
    const relativeDateTimeNowDefault: DateTime = {
      type: "relative",
      absolute: globalClock,
      relative: NOW_DATE_RELATIVE_TIME,
    };
    const relativeDateTimeStartDefault: DateTime = {
      type: "relative",
      absolute: timeUtils.substractTimeUnit(
        globalClock,
        "minute",
        15,
        timezone
      ),
      relative: {
        value: 15,
        unit: "minute",
      },
    };

    let datetimePointInTime = timeUtils.parseDateTimeFromString(
      urlParams.get(SearchParamsValuesView.DatetimePointInTime),
      globalClock,
      timezone,
      relativeDateTimeNowDefault
    );
    let datetimeStart = timeUtils.parseDateTimeFromString(
      urlParams.get(SearchParamsValuesView.DatetimeStart),
      globalClock,
      timezone,
      relativeDateTimeStartDefault
    );
    let datetimeEnd = timeUtils.parseDateTimeFromString(
      urlParams.get(SearchParamsValuesView.DatetimeEnd),
      globalClock,
      timezone,
      relativeDateTimeNowDefault
    );
    if (
      !timeUtils.isValidInterval(datetimeStart.absolute, datetimeEnd.absolute)
    ) {
      datetimeStart = relativeDateTimeStartDefault;
      datetimeEnd = relativeDateTimeNowDefault;
    }

    if (
      !timeUtils.isInInterval(
        datetimeStart.absolute,
        datetimeEnd.absolute,
        datetimePointInTime.absolute
      )
    ) {
      const datetimePointInTimeISO = timeUtils.getClosestISOFromRange(
        datetimeStart.absolute,
        datetimeEnd.absolute,
        datetimePointInTime.absolute
      );
      datetimePointInTime = timeUtils.parseDateTimeFromString(
        datetimePointInTimeISO,
        globalClock,
        timezone,
        relativeDateTimeNowDefault
      );
    }
    if (
      datetimeStart.type === "relative" ||
      datetimeEnd.type === "relative" ||
      datetimePointInTime.type === "relative"
    ) {
      datetimeStart = {
        ...datetimeStart,
        type: "relative",
      };
      datetimeEnd = {
        ...datetimeEnd,
        type: "relative",
      };
      datetimePointInTime = {
        ...datetimePointInTime,
        type: "relative",
      };
    }

    return {
      [SearchParamsValuesView.DatetimeStart]: datetimeStart,
      [SearchParamsValuesView.DatetimeEnd]: datetimeEnd,
      [SearchParamsValuesView.DatetimePointInTime]: datetimePointInTime,
      globalClock,
      timezone,
      locale,
    };
  },
  reducers: {
    setDateTimeStart: (state, payload: PayloadAction<DateTime>) => {
      const datetimeStart = payload.payload;
      let datetimeEnd = state[SearchParamsValuesView.DatetimeEnd];
      let datetimePointInTime =
        state[SearchParamsValuesView.DatetimePointInTime];

      if (
        !timeUtils.isValidInterval(datetimeStart.absolute, datetimeEnd.absolute)
      ) {
        toast.error("Is not a valid time range", { toastId: "dateTimeRange" });
        return;
      }

      if (datetimeEnd.type !== datetimeStart.type) {
        if (datetimeStart.type === "relative") {
          datetimeEnd = {
            ...datetimeEnd,
            type: "relative",
          };
        } else {
          datetimeEnd = {
            ...datetimeEnd,
            type: "absolute",
          };
        }
      }

      if (
        !timeUtils.isInInterval(
          datetimeStart.absolute,
          datetimeEnd.absolute,
          datetimePointInTime.absolute
        )
      ) {
        const datetimePointInTimeISO = timeUtils.getClosestISOFromRange(
          datetimeStart.absolute,
          datetimeEnd.absolute,
          datetimePointInTime.absolute
        );
        const relativeDateTimeNowDefault: DateTime = {
          type: "relative",
          absolute: state.globalClock,
          relative: NOW_DATE_RELATIVE_TIME,
        };
        datetimePointInTime = timeUtils.parseDateTimeFromString(
          datetimePointInTimeISO,
          state.globalClock,
          state.timezone,
          relativeDateTimeNowDefault
        );
      }
      if (datetimePointInTime.type !== datetimeStart.type) {
        if (datetimeStart.type === "relative") {
          datetimePointInTime = {
            ...datetimePointInTime,
            type: "relative",
          };
        } else {
          datetimePointInTime = {
            ...datetimePointInTime,
            type: "absolute",
          };
        }
      }

      state[SearchParamsValuesView.DatetimeStart] = datetimeStart;
      state[SearchParamsValuesView.DatetimeEnd] = datetimeEnd;
      state[SearchParamsValuesView.DatetimePointInTime] = datetimePointInTime;
    },
    setDateTimeEnd: (state, payload: PayloadAction<DateTime>) => {
      let datetimeStart = state[SearchParamsValuesView.DatetimeStart];
      const datetimeEnd = payload.payload;
      let datetimePointInTime =
        state[SearchParamsValuesView.DatetimePointInTime];

      if (
        !timeUtils.isValidInterval(datetimeStart.absolute, datetimeEnd.absolute)
      ) {
        toast.error("Is not a valid time range", { toastId: "dateTimeRange" });
        return;
      }

      if (datetimeStart.type !== datetimeEnd.type) {
        if (datetimeEnd.type === "relative") {
          datetimeStart = {
            ...datetimeStart,
            type: "relative",
          };
        } else {
          datetimeStart = {
            ...datetimeStart,
            type: "absolute",
          };
        }
      }
      if (
        !timeUtils.isInInterval(
          datetimeStart.absolute,
          datetimeEnd.absolute,
          datetimePointInTime.absolute
        )
      ) {
        const datetimePointInTimeISO = timeUtils.getClosestISOFromRange(
          datetimeStart.absolute,
          datetimeEnd.absolute,
          datetimePointInTime.absolute
        );
        const relativeDateTimeNowDefault: DateTime = {
          type: "relative",
          absolute: state.globalClock,
          relative: NOW_DATE_RELATIVE_TIME,
        };
        datetimePointInTime = timeUtils.parseDateTimeFromString(
          datetimePointInTimeISO,
          state.globalClock,
          state.timezone,
          relativeDateTimeNowDefault
        );
      }
      if (datetimePointInTime.type !== datetimeEnd.type) {
        if (datetimeEnd.type === "relative") {
          datetimePointInTime = {
            ...datetimePointInTime,
            type: "relative",
          };
        } else {
          datetimePointInTime = {
            ...datetimePointInTime,
            type: "absolute",
          };
        }
      }

      state[SearchParamsValuesView.DatetimeStart] = datetimeStart;
      state[SearchParamsValuesView.DatetimeEnd] = datetimeEnd;
      state[SearchParamsValuesView.DatetimePointInTime] = datetimePointInTime;
    },
    setDateTimeIntervalRelative: (
      state,
      payload: PayloadAction<{
        relativeDateTimeStart: RelativeDateTime;
        relativeDateTimeEnd: RelativeDateTime;
      }>
    ) => {
      const datetimeStart: DateTime = {
        type: "relative",
        absolute: timeUtils.relativeToAbsoluteDateTime(
          payload.payload.relativeDateTimeStart,
          state.globalClock,
          state.timezone
        ),
        relative: payload.payload.relativeDateTimeStart,
      };
      const datetimeEnd: DateTime = {
        type: "relative",
        absolute: timeUtils.relativeToAbsoluteDateTime(
          payload.payload.relativeDateTimeEnd,
          state.globalClock,
          state.timezone
        ),
        relative: payload.payload.relativeDateTimeEnd,
      };
      let datetimePointInTime =
        state[SearchParamsValuesView.DatetimePointInTime];

      if (
        !timeUtils.isValidInterval(datetimeStart.absolute, datetimeEnd.absolute)
      ) {
        toast.error("Is not a valid time range", { toastId: "dateTimeRange" });
        return;
      }

      if (
        !timeUtils.isInInterval(
          datetimeStart.absolute,
          datetimeEnd.absolute,
          datetimePointInTime.absolute
        )
      ) {
        const datetimePointInTimeISO = timeUtils.getClosestISOFromRange(
          datetimeStart.absolute,
          datetimeEnd.absolute,
          datetimePointInTime.absolute
        );
        const relativeDateTimeNowDefault: DateTime = {
          type: "relative",
          absolute: state.globalClock,
          relative: NOW_DATE_RELATIVE_TIME,
        };
        datetimePointInTime = timeUtils.parseDateTimeFromString(
          datetimePointInTimeISO,
          state.globalClock,
          state.timezone,
          relativeDateTimeNowDefault
        );
      }
      if (datetimePointInTime.type !== "relative") {
        datetimePointInTime = {
          ...datetimePointInTime,
          type: "relative",
        };
      }

      state[SearchParamsValuesView.DatetimeStart] = datetimeStart;
      state[SearchParamsValuesView.DatetimeEnd] = datetimeEnd;
      state[SearchParamsValuesView.DatetimePointInTime] = datetimePointInTime;
    },
    setDateTimeIntervalAbsolute: (
      state,
      payload: PayloadAction<{
        ISOstringStart: string;
        ISOstringEnd: string;
      }>
    ) => {
      const datetimeStart: DateTime = {
        type: "absolute",
        absolute: payload.payload.ISOstringStart,
        relative: timeUtils.absoluteToAproximateRelativeDateTime(
          payload.payload.ISOstringStart,
          state.globalClock
        ),
      };
      const datetimeEnd: DateTime = {
        type: "absolute",
        absolute: payload.payload.ISOstringEnd,
        relative: timeUtils.absoluteToAproximateRelativeDateTime(
          payload.payload.ISOstringEnd,
          state.globalClock
        ),
      };
      let datetimePointInTime =
        state[SearchParamsValuesView.DatetimePointInTime];

      if (
        !timeUtils.isValidInterval(datetimeStart.absolute, datetimeEnd.absolute)
      ) {
        toast.error("Is not a valid time range", { toastId: "dateTimeRange" });
        return;
      }

      if (
        !timeUtils.isInInterval(
          datetimeStart.absolute,
          datetimeEnd.absolute,
          datetimePointInTime.absolute
        )
      ) {
        const datetimePointInTimeISO = timeUtils.getClosestISOFromRange(
          datetimeStart.absolute,
          datetimeEnd.absolute,
          datetimePointInTime.absolute
        );
        const relativeDateTimeNowDefault: DateTime = {
          type: "relative",
          absolute: state.globalClock,
          relative: NOW_DATE_RELATIVE_TIME,
        };
        datetimePointInTime = timeUtils.parseDateTimeFromString(
          datetimePointInTimeISO,
          state.globalClock,
          state.timezone,
          relativeDateTimeNowDefault
        );
      }
      if (datetimePointInTime.type !== "absolute") {
        datetimePointInTime = {
          ...datetimePointInTime,
          type: "absolute",
        };
      }

      state[SearchParamsValuesView.DatetimeStart] = datetimeStart;
      state[SearchParamsValuesView.DatetimeEnd] = datetimeEnd;
      state[SearchParamsValuesView.DatetimePointInTime] = datetimePointInTime;
    },
    setDateTimeStampPointInTime: (
      state,
      payload: PayloadAction<DateTime | null>
    ) => {
      const relativeDateTimeNowDefault: DateTime = {
        type: "relative",
        absolute: state.globalClock,
        relative: NOW_DATE_RELATIVE_TIME,
      };
      let datetimeStart = state[SearchParamsValuesView.DatetimeStart];
      let datetimeEnd = state[SearchParamsValuesView.DatetimeEnd];
      const datetimePointInTime = payload.payload || relativeDateTimeNowDefault;

      if (
        !timeUtils.isInInterval(
          datetimeStart.absolute,
          datetimeEnd.absolute,
          datetimePointInTime.absolute
        )
      ) {
        const relativeDateTimeStartDefault: DateTime = {
          type: "relative",
          absolute: timeUtils.substractTimeUnit(
            state.globalClock,
            "minute",
            15,
            state.timezone
          ),
          relative: {
            value: 15,
            unit: "minute",
          },
        };
        if (
          timeUtils.isSmaller(
            datetimePointInTime.absolute,
            datetimeStart.absolute
          )
        ) {
          const datetimeEndISO =
            timeUtils.substractDateTimeFromIntervalDuration(
              datetimePointInTime.absolute,
              datetimeStart.absolute,
              datetimeEnd.absolute
            );
          datetimeStart = datetimePointInTime;
          datetimeEnd = timeUtils.parseDateTimeFromString(
            datetimeEndISO,
            state.globalClock,
            state.timezone,
            relativeDateTimeNowDefault
          );
        } else if (
          timeUtils.isSmaller(
            datetimeEnd.absolute,
            datetimePointInTime.absolute
          )
        ) {
          const datetimeStartISO = timeUtils.addDateTimeFromIntervalDuration(
            datetimeEnd.absolute,
            datetimePointInTime.absolute,
            datetimeStart.absolute
          );
          datetimeEnd = datetimePointInTime;
          datetimeStart = timeUtils.parseDateTimeFromString(
            datetimeStartISO,
            state.globalClock,
            state.timezone,
            relativeDateTimeStartDefault
          );
        }
      }

      if (datetimeStart.type !== datetimePointInTime.type) {
        if (datetimePointInTime.type === "relative") {
          datetimeStart = {
            ...datetimeStart,
            type: "relative",
          };
        } else {
          datetimeStart = {
            ...datetimeStart,
            type: "absolute",
          };
        }
      }
      if (datetimeEnd.type !== datetimePointInTime.type) {
        if (datetimePointInTime.type === "relative") {
          datetimeEnd = {
            ...datetimeEnd,
            type: "relative",
          };
        } else {
          datetimeEnd = {
            ...datetimeEnd,
            type: "absolute",
          };
        }
      }

      state[SearchParamsValuesView.DatetimeStart] = datetimeStart;
      state[SearchParamsValuesView.DatetimeEnd] = datetimeEnd;
      state[SearchParamsValuesView.DatetimePointInTime] = datetimePointInTime;
    },
    refresh: (state) => {
      const globalClock = timeUtils.getNow(state.timezone);
      state.globalClock = globalClock;
      let datetimeStart = state[SearchParamsValuesView.DatetimeStart];
      let datetimeEnd = state[SearchParamsValuesView.DatetimeEnd];
      let datetimePointInTime =
        state[SearchParamsValuesView.DatetimePointInTime];

      if (
        datetimeStart.type === "relative" ||
        datetimeEnd.type === "relative" ||
        datetimePointInTime.type === "relative"
      ) {
        datetimeStart = {
          type: "relative",
          absolute: timeUtils.relativeToAbsoluteDateTime(
            datetimeStart.relative,
            globalClock,
            state.timezone
          ),
          relative: datetimeStart.relative,
        };
        datetimeEnd = {
          type: "relative",
          absolute: timeUtils.relativeToAbsoluteDateTime(
            datetimeEnd.relative,
            globalClock,
            state.timezone
          ),
          relative: datetimeEnd.relative,
        };
        datetimePointInTime = {
          type: "relative",
          absolute: timeUtils.relativeToAbsoluteDateTime(
            datetimePointInTime.relative,
            globalClock,
            state.timezone
          ),
          relative: datetimePointInTime.relative,
        };
      }

      state[SearchParamsValuesView.DatetimeStart] = datetimeStart;
      state[SearchParamsValuesView.DatetimeEnd] = datetimeEnd;
      state[SearchParamsValuesView.DatetimePointInTime] = datetimePointInTime;
    },
  },
});

export const {
  setDateTimeStart,
  setDateTimeEnd,
  setDateTimeIntervalRelative,
  setDateTimeIntervalAbsolute,
  setDateTimeStampPointInTime,
  refresh,
} = datetimeFilterSlice.actions;

export default datetimeFilterSlice.reducer;
