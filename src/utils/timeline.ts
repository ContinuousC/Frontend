/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { type Bin } from "@continuousc/relation-graph";

import {
  TIME_LINE_INTERVALS,
  TIME_AXIS_FORMAT_MINOR,
  TIME_AXIS_FORMAT_MAJOR,
  BINS_TO_MINOR,
  MINOR_TO_MAJOR,
  type TimeZone,
} from "../constants";
import * as timeUtils from "./time";
import { NotImplemented } from "../errors";

import {
  DateTimeInterval,
  TimeAxisIntervalValue,
  TimeAxisInterval,
  TimeScale,
  BinData,
  DateTimeUnit,
  DateTimeUnitFixed,
} from "../types/frontend";

export function convertToTimelineBins({
  bins,
  timezone,
  locale,
  startISO,
  endISO,
}: {
  bins: Bin[];
  timezone: TimeZone;
  locale: string;
  startISO: string;
  endISO: string;
}) {
  if (bins.length === 0) {
    return { totalHits: 0, yTicks: [0, 1], binnedData: [] };
  }
  const maxCount = getMaxCountBin(bins);
  return {
    totalHits: getTotalHits(bins),
    yTicks: getCountTicks(maxCount),
    binnedData: getDataBins({
      bins,
      timezone: timezone,
      locale: locale,
      startISO,
      endISO,
      maxCount,
    }),
  };
}

function getTotalHits(bins: Bin[]) {
  return bins.reduce(
    (accumulator, currentValue) => accumulator + currentValue.count,
    0
  );
}

function getMaxCountBin(bins: Bin[]): number {
  let maxCount = 0;
  bins.forEach(({ count }) => {
    if (count > maxCount) {
      maxCount = count;
    }
  });
  return maxCount;
}

const STEPS = [1, 2, 5, 10];
function getCountTicks(maxCount: number): number[] {
  let magnitudeFactor: number = 10 ** Math.floor(Math.log10(maxCount));
  if (magnitudeFactor > 1) {
    magnitudeFactor /= 10;
  }
  let bestTickArray: number[] = [];
  let minArrayLength: number = Number.MAX_SAFE_INTEGER;
  STEPS.forEach((step: number) => {
    const stepSize: number = step * magnitudeFactor;
    const maxCountCorrected: number = Math.ceil(maxCount / stepSize) * stepSize;
    const tickArray: number[] = [];
    for (let i: number = 0; i <= maxCountCorrected; i += stepSize) {
      tickArray.push(Math.round(i * 100) / 100);
    }
    if (step === 1) {
      bestTickArray = tickArray;
    }
    if (tickArray.length >= 5 && tickArray.length < minArrayLength) {
      minArrayLength = tickArray.length;
      bestTickArray = tickArray;
    }
  });
  return bestTickArray;
}

function getDataBins({
  bins,
  timezone,
  locale,
  startISO,
  endISO,
  maxCount,
}: {
  bins: Bin[];
  timezone: TimeZone;
  locale: string;
  startISO: string;
  endISO: string;
  maxCount: number;
}): BinData[] {
  return bins
    .filter(({ count }) => count !== 0)
    .map(({ count, from, to }) => {
      let fromTimeline = from;
      let toTimeline = to;
      if (timeUtils.isSmaller(from, startISO)) {
        fromTimeline = startISO;
      }
      if (timeUtils.isSmaller(endISO, to)) {
        toTimeline = endISO;
      }
      const x0 = new Date(fromTimeline);
      const x1 = new Date(toTimeline);
      const x = new Date((x0.valueOf() + x1.valueOf()) / 2);
      const y =
        count < maxCount / 10 && count !== 0 ? Math.ceil(maxCount / 10) : count;
      return {
        x0,
        x1,
        x,
        _x: x,
        y,
        _y: y,
        count,
        dateFormated: timeUtils.formatISOToDateShort(from, timezone, locale),
        timeFormated: timeUtils.formatISOToTimeWithSeconds(
          from,
          timezone,
          locale
        ),
        startDateISO: from,
        endDateISO: to,
      };
    });
}

export function getTimeTicks(
  startISO: string,
  endISO: string,
  timeScale: TimeScale,
  timezone: TimeZone,
  locale: string
): TimeAxisInterval {
  const dateStartBin = getDateStartBin(
    startISO,
    timeScale.dateTimeUnit,
    timeScale.step,
    timezone
  );
  return {
    minors: {
      step: timeScale.step,
      dateTimeUnit: timeScale.dateTimeUnit,
      values: getMinorTimeTicks({
        startISO,
        endISO,
        startBinISO: dateStartBin,
        dateTimeUnit: timeScale.dateTimeUnit,
        format: timeScale.minorFormat,
        step: timeScale.step,
        timezone,
        locale,
      }),
    },
    majors:
      timeScale.majorDateTimeUnit === null || timeScale.majorFormat === null
        ? null
        : {
            dateTimeUnit: timeScale.majorDateTimeUnit,
            values: getMajorTimeTicks({
              startISO,
              endISO,
              startBinISO: dateStartBin,
              dateTimeUnit: timeScale.dateTimeUnit,
              format: timeScale.majorFormat,
              timezone,
              locale,
            }),
          },
  };
}

const MIN_PIXELS_PER_BIN = 15;
const MIN_PIXELS_PER_MINOR = 50;
export function getTimeScale(
  durationInSecond: number,
  dateTimeInterval: DateTimeInterval,
  timelineWidth: number
): TimeScale {
  const durationNormalized = timelineWidth / durationInSecond;
  if (dateTimeInterval === "auto") {
    const [binUnit, binStep] = Object.entries(TIME_LINE_INTERVALS)
      .flatMap(([unit, steps]) =>
        steps.map((step) => [unit, step] as [DateTimeUnit, number])
      )
      .find(
        ([unit, step]) =>
          timeUtils.getDurationInSeconds(unit, step) * durationNormalized >=
          MIN_PIXELS_PER_BIN
      ) || ["year", 10];
    const [minorUnit, minorStep] = BINS_TO_MINOR[binUnit]
      .flatMap((unit) =>
        TIME_LINE_INTERVALS[unit].map(
          (step) => [unit, step] as [DateTimeUnit, number]
        )
      )
      .find(
        ([unit, step]) =>
          timeUtils.getDurationInSeconds(unit, step) * durationNormalized >=
          MIN_PIXELS_PER_MINOR
      ) || ["year", 10];
    const majorUnit = MINOR_TO_MAJOR[minorUnit];
    return {
      dateTimeUnit: minorUnit,
      dateTimeUnitData: binUnit,
      majorDateTimeUnit: majorUnit,
      step: minorStep,
      stepData: binStep,
      minorFormat: TIME_AXIS_FORMAT_MINOR[minorUnit],
      majorFormat: TIME_AXIS_FORMAT_MAJOR[majorUnit],
    };
  }
  throw new NotImplemented("dateTimeInterval for not auto");
}

export function getMajorTimeTicks({
  startISO,
  endISO,
  startBinISO,
  dateTimeUnit,
  format,
  timezone,
  locale,
}: {
  startISO: string;
  endISO: string;
  startBinISO: string;
  dateTimeUnit: DateTimeUnit;
  format: string;
  timezone: TimeZone;
  locale: string;
}) {
  const addedMajors = new Set();
  const major: TimeAxisIntervalValue[] = [];
  let dateISO = startBinISO;
  while (timeUtils.isSmaller(dateISO, endISO)) {
    const dateMajorISO = getMajorTimeAxisValue(dateISO, dateTimeUnit, timezone);
    const inRange = timeUtils.isInInterval(startISO, endISO, dateMajorISO);
    const isMajor = timeUtils.isUnitFirstQuantity(
      dateMajorISO,
      dateTimeUnit,
      timezone
    );
    if (isMajor && !addedMajors.has(dateMajorISO)) {
      addedMajors.add(dateMajorISO);
      major.push({
        label: timeUtils.formatCustom(dateMajorISO, format, timezone, locale),
        inRange,
        timestamp: !inRange ? startISO : dateISO,
      });
    }
    dateISO = timeUtils.addTimeUnit(dateISO, dateTimeUnit, 1, timezone);
  }
  return major;
}

export function getMinorTimeTicks({
  startISO,
  endISO,
  startBinISO,
  dateTimeUnit,
  format,
  step,
  timezone,
  locale,
}: {
  startISO: string;
  endISO: string;
  startBinISO: string;
  dateTimeUnit: DateTimeUnit;
  format: string;
  step: number;
  timezone: TimeZone;
  locale: string;
}) {
  const tickValues: TimeAxisIntervalValue[] = [];
  let dateISO = startBinISO;
  while (timeUtils.isSmaller(dateISO, endISO)) {
    const inRange = timeUtils.isInInterval(startISO, endISO, dateISO);
    tickValues.push({
      label: timeUtils.formatCustom(dateISO, format, timezone, locale),
      inRange,
      timestamp: !inRange ? startISO : dateISO,
    });
    dateISO = timeUtils.addTimeUnit(dateISO, dateTimeUnit, step, timezone);
  }
  return tickValues;
}

export function getDateNextBin(
  ISO: string,
  dateTimeUnit: DateTimeUnit,
  step: number,
  timezone: TimeZone
) {
  return getDateBin({ ISO, dateTimeUnit, step, timezone, next: true });
}

export function getDateStartBin(
  ISO: string,
  dateTimeUnit: DateTimeUnit,
  step: number,
  timezone: TimeZone
) {
  return getDateBin({ ISO, dateTimeUnit, step, timezone });
}

export function getDateBin({
  ISO,
  dateTimeUnit,
  step,
  timezone,
  next,
}: {
  ISO: string;
  dateTimeUnit: DateTimeUnit;
  step: number;
  timezone: TimeZone;
  next?: boolean;
}) {
  switch (dateTimeUnit) {
    case "year":
      return calculateDateBin({
        ISO,
        ofUnit: "year",
        dateTimeUnit: "year",
        step,
        timezone,
        unitStartFromOne: true,
        next,
      });
    case "quarter":
      return calculateDateBin({
        ISO,
        ofUnit: "quarter",
        dateTimeUnit: "quarter",
        step,
        timezone,
        unitStartFromOne: true,
        next,
      });
    case "month":
      return calculateDateBin({
        ISO,
        ofUnit: "month",
        dateTimeUnit: "month",
        step,
        timezone,
        unitStartFromOne: true,
        next,
      });
    case "week":
      return calculateDateBin({
        ISO,
        ofUnit: "week",
        dateTimeUnit: "weekNumber",
        step,
        timezone,
        unitStartFromOne: true,
        next,
      });
    case "day":
      return calculateDateBin({
        ISO,
        ofUnit: "day",
        dateTimeUnit: "day",
        step,
        timezone,
        unitStartFromOne: true,
        next,
      });
    case "hour":
      return calculateDateBin({
        ISO,
        ofUnit: "hour",
        dateTimeUnit: "hour",
        step,
        timezone,
        next,
      });
    case "minute":
      return calculateDateBin({
        ISO,
        ofUnit: "minute",
        dateTimeUnit: "minute",
        step,
        timezone,
        next,
      });
    case "second":
      return calculateDateBin({
        ISO,
        ofUnit: "second",
        dateTimeUnit: "second",
        step,
        timezone,
        next,
      });
    default:
      throw Error("Time unit not handled yet");
  }
}

function getMajorTimeAxisValue(
  ISO: string,
  dateTimeUnit: DateTimeUnit,
  timezone: TimeZone
) {
  return timeUtils.getStartOfUnit(ISO, MINOR_TO_MAJOR[dateTimeUnit], timezone);
}

function calculateDateBin({
  ISO,
  ofUnit,
  dateTimeUnit,
  step,
  timezone,
  unitStartFromOne,
  next,
}: {
  ISO: string;
  ofUnit: DateTimeUnit;
  dateTimeUnit: DateTimeUnitFixed;
  step: number;
  timezone: TimeZone;
  unitStartFromOne?: boolean;
  next?: boolean;
}) {
  let dateTimeISO = timeUtils.getStartOfUnit(ISO, ofUnit, timezone);
  if (step !== 1) {
    const valueDateTimeUnit = timeUtils.getUnit(
      dateTimeISO,
      dateTimeUnit,
      timezone
    );
    let interval = valueDateTimeUnit % step;
    if (unitStartFromOne) {
      interval = (valueDateTimeUnit - 1) % step;
    }
    dateTimeISO = timeUtils.setUnit(
      dateTimeISO,
      dateTimeUnit,
      valueDateTimeUnit - interval,
      timezone
    );
  }
  if (next) {
    const valueDateTimeUnit = timeUtils.getUnit(
      dateTimeISO,
      dateTimeUnit,
      timezone
    );
    dateTimeISO = timeUtils.setUnit(
      dateTimeISO,
      dateTimeUnit,
      valueDateTimeUnit + step,
      timezone
    );
  }
  return dateTimeISO;
}
