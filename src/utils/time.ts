/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import {
  DateTime as DateTimeVendor,
  Interval,
  Duration,
  ToRelativeUnit,
  DateTimeFormatOptions,
} from "luxon";

import {
  RELATIVE_OPTIONS_REVERSE,
  NOW_DATE_RELATIVE_TIME,
  type TimeZone,
} from "../constants";
import {
  InvalidDuration,
  InvalidISODate,
  InvalidInterval,
  LogicError,
  TimeError,
} from "../errors";

import {
  RelativeDateTime,
  DateTime,
  DateTimeUnit,
  DateTimeUnitFixed,
} from "../types/frontend";

export function getNow(timezone: TimeZone) {
  const dateTime = DateTimeVendor.now()
    .setZone(timezone)
    .set({ second: 0, millisecond: 0 })
    .toUTC();
  if (!dateTime.isValid) {
    throw new InvalidISODate();
  }
  return dateTime.toISO();
}

export const isSmaller = (dateISOA: string, dateISOB: string) => {
  const dateTimeVendorA = DateTimeVendor.fromISO(dateISOA).toUTC();
  const dateTimeVendorB = DateTimeVendor.fromISO(dateISOB).toUTC();
  if (!dateTimeVendorA.isValid || !dateTimeVendorB.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendorA < dateTimeVendorB;
};

export const relativeToAbsoluteDateTime = (
  relativeDateTime: RelativeDateTime,
  globalClockISOString: string,
  timezone: TimeZone
) => {
  const globalClockDateTimeVendor = DateTimeVendor.fromISO(globalClockISOString)
    .toUTC()
    .setZone(timezone);
  if (!globalClockDateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  if (relativeDateTime.unit === "now") {
    return globalClockDateTimeVendor.toISO();
  } else if (relativeDateTime.value === "startOf") {
    return globalClockDateTimeVendor.startOf(relativeDateTime.unit).toISO();
  }
  return globalClockDateTimeVendor
    .minus({ [relativeDateTime.unit]: relativeDateTime.value })
    .toUTC()
    .toISO();
};

export const absoluteToAproximateRelativeDateTime = (
  ISO: string,
  globalClockISOString: string
): RelativeDateTime => {
  const dateTimeVendor = DateTimeVendor.fromISO(ISO);
  const globalClockDateTimeVendor =
    DateTimeVendor.fromISO(globalClockISOString);
  if (!dateTimeVendor.isValid || !globalClockDateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  const durationVendor = globalClockDateTimeVendor.diff(dateTimeVendor);
  for (const dateTimeUnit of RELATIVE_OPTIONS_REVERSE) {
    if (Math.abs(durationVendor.as(dateTimeUnit)) >= 1) {
      return {
        value: Math.floor(durationVendor.as(dateTimeUnit)),
        unit: dateTimeUnit,
      };
    }
  }
  throw new TimeError("Converting absolute timetamp to relative datetime");
};

export const formatDateTime = (
  dateTime: DateTime,
  timezone: TimeZone,
  locale: string
) => {
  if (dateTime.type === "relative") {
    return formatRelativeDateTimeToHumanFormat(dateTime.relative, locale);
  } else {
    return formatISOToDatetimeWithSeconds(dateTime.absolute, timezone, locale);
  }
};

export const formatRelativeDateTimeToHumanFormat = (
  relativeDateTime: RelativeDateTime,
  locale: string
) => {
  //TODO: based on the local this will be translated
  if (relativeDateTime.unit === "now") {
    return "Now";
  }
  if (relativeDateTime.value === "startOf") {
    return "Start of " + relativeDateTime.unit;
  }
  const durationVendor = Duration.fromObject(
    {
      [relativeDateTime.unit]: relativeDateTime.value,
    },
    { locale }
  );
  if (!durationVendor.isValid) {
    throw new InvalidDuration();
  }
  return (
    durationVendor.toHuman({ unit: relativeDateTime.unit as ToRelativeUnit }) +
    " ago"
  );
};

export type DateFormats = DateTimeFormatOptions;

export function formatISOToDatetimeWithSeconds(
  ISO: string,
  timezone?: TimeZone,
  locale?: string
) {
  let dateTimeVendor = DateTimeVendor.fromISO(ISO).toUTC();
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  if (timezone) {
    dateTimeVendor = dateTimeVendor.setZone(timezone);
  }
  if (locale) {
    dateTimeVendor = dateTimeVendor.setLocale(locale);
  }
  return dateTimeVendor.toLocaleString(
    DateTimeVendor.DATETIME_MED_WITH_SECONDS
  );
}

export function formatISOToDateShort(
  ISO: string,
  timezone: TimeZone,
  locale: string
) {
  const dateTimeVendor = DateTimeVendor.fromISO(ISO).toUTC();
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor
    .setZone(timezone)
    .setLocale(locale)
    .toLocaleString(DateTimeVendor.DATE_SHORT);
}

export function formatISOToDatetimeShortWithSeconds(
  ISO: string,
  timezone: TimeZone,
  locale: string
) {
  const dateTimeVendor = DateTimeVendor.fromISO(ISO).toUTC();
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor
    .setZone(timezone)
    .setLocale(locale)
    .toLocaleString(DateTimeVendor.DATETIME_SHORT_WITH_SECONDS);
}

export function formatISOToDateMedWithSeconds(
  ISO: string,
  timezone: TimeZone,
  locale: string
) {
  const dateTimeVendor = DateTimeVendor.fromISO(ISO).toUTC();
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor
    .setZone(timezone)
    .setLocale(locale)
    .toLocaleString(DateTimeVendor.DATETIME_MED_WITH_SECONDS);
}

export function formatISOToTimeWithSeconds(
  ISO: string,
  timezone: TimeZone,
  locale: string
) {
  const dateTimeVendor = DateTimeVendor.fromISO(ISO).toUTC();
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor
    .setZone(timezone)
    .setLocale(locale)
    .toLocaleString(DateTimeVendor.TIME_WITH_SECONDS);
}

export function formatISOToRelativeTime(
  ISO: string,
  timezone: TimeZone,
  locale: string
) {
  const dateTimeVendor = DateTimeVendor.fromISO(ISO).toUTC();
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor.setZone(timezone).setLocale(locale).toRelative() || "";
}

export function formatISOToAbsoluteWithRelativeTime(
  ISO: string,
  timezone: TimeZone,
  locale: string
) {
  return `${formatISOToDatetimeWithSeconds(ISO, timezone, locale)} (${formatISOToRelativeTime(ISO, timezone, locale)})`;
}

export function formatPointInTime(
  ISO: string,
  timezone: TimeZone,
  locale: string
) {
  return formatCustom(ISO, "ff", timezone, locale);
}

export function formatCustom(
  ISO: string,
  format: string,
  timezone: TimeZone,
  locale: string
) {
  const dateTimeVendor = DateTimeVendor.fromISO(ISO).toUTC();
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor.setZone(timezone).setLocale(locale).toFormat(format);
}

export function addTimeUnit(
  ISO: string,
  dateTimeUnit: DateTimeUnit,
  step: number,
  timezone: TimeZone
) {
  let dateTimeVendor = DateTimeVendor.fromISO(ISO).toUTC();
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  dateTimeVendor = dateTimeVendor
    .setZone(timezone)
    .plus({ [dateTimeUnit]: step });
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor.toUTC().toISO();
}

export function getSystemTimeZone() {
  return DateTimeVendor.local().zoneName as TimeZone;
}

export function getSystemLocale() {
  return DateTimeVendor.local().locale;
}

export function substractTimeUnit(
  ISO: string,
  dateTimeUnit: DateTimeUnit,
  step: number,
  timezone: TimeZone
) {
  let dateTimeVendor = DateTimeVendor.fromISO(ISO).toUTC();
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  dateTimeVendor = dateTimeVendor
    .setZone(timezone)
    .minus({ [dateTimeUnit]: step });
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor.toUTC().toISO();
}

export const parseDateTimeFromString = (
  dateTimeString: string | null,
  globalClock: string,
  timezone: TimeZone,
  defaultDateTime: DateTime
): DateTime => {
  if (dateTimeString === null) {
    return defaultDateTime;
  }
  if (dateTimeString === "now") {
    return {
      type: "relative",
      absolute: globalClock,
      relative: NOW_DATE_RELATIVE_TIME,
    };
  }
  const regexCurrent =
    /\bS(year|quarter|month|week|day|hour|minute|second|millisecond)\b/;
  const matchCurrent = dateTimeString.match(regexCurrent);
  if (matchCurrent) {
    const [, dateTimeUnit] = matchCurrent;
    const relative: RelativeDateTime = {
      unit: dateTimeUnit as DateTimeUnit,
      value: "startOf",
    };
    return {
      type: "relative",
      absolute: relativeToAbsoluteDateTime(relative, globalClock, timezone),
      relative,
    };
  }

  const durationVendor = Duration.fromISO(dateTimeString);
  if (durationVendor.isValid) {
    const relative: RelativeDateTime = {
      unit: Object.keys(durationVendor.toObject())[0].replace(
        "s",
        ""
      ) as DateTimeUnit,
      value: Object.values(durationVendor.toObject())[0],
    };
    return {
      type: "relative",
      absolute: relativeToAbsoluteDateTime(relative, globalClock, timezone),
      relative,
    };
  }
  const dateTimeVendor = DateTimeVendor.fromISO(dateTimeString).toUTC();
  if (dateTimeVendor.isValid) {
    return {
      type: "absolute",
      absolute: dateTimeVendor.toISO(),
      relative: absoluteToAproximateRelativeDateTime(
        dateTimeString,
        globalClock
      ),
    };
  }
  return defaultDateTime;
};

export const convertDateTimeToSearchParamsString = (dateTime: DateTime) => {
  if (dateTime.type === "relative") {
    if (dateTime.relative.unit === "now") {
      return "now";
    }
    if (dateTime.relative.value === "startOf") {
      return "S" + dateTime.relative.unit;
    }
    const durationVendor = Duration.fromObject({
      [dateTime.relative.unit]: dateTime.relative.value,
    });
    if (!durationVendor.isValid) {
      throw new InvalidDuration();
    }
    return durationVendor.toISO();
  }
  const dateTimeVendor = DateTimeVendor.fromISO(dateTime.absolute);
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor.toUTC().toISO();
};

const getInterval = (startISO: string, endISO: string) => {
  const intervalVendor = Interval.fromISO(startISO + "/" + endISO);
  if (!intervalVendor.isValid) {
    throw new InvalidInterval();
  }
  return intervalVendor;
};

export const isValidInterval = (startISO: string, endISO: string) => {
  try {
    const intervalVendor = getInterval(startISO, endISO);
    if (intervalVendor.isEmpty()) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
};

export const getIntervalInSeconds = (startISO: string, endISO: string) => {
  return getInterval(startISO, endISO).length("second");
};

export const getDurationInSeconds = (unit: DateTimeUnit, step: number) => {
  return Duration.fromObject({ [unit]: step }).as("second");
};

export const isInInterval = (startISO: string, endISO: string, ISO: string) => {
  const intervalVendor = getInterval(startISO, endISO);
  const currentDateTime = DateTimeVendor.fromISO(ISO);
  return (
    intervalVendor.contains(currentDateTime) ||
    currentDateTime.equals(DateTimeVendor.fromISO(startISO)) ||
    currentDateTime.equals(DateTimeVendor.fromISO(endISO))
  );
};

export function getClosestISOFromRange(
  startISO: string,
  endISO: string,
  ISO: string
) {
  const startDateTimeVendor = DateTimeVendor.fromISO(startISO);
  const endDateTimeVendor = DateTimeVendor.fromISO(endISO);
  const dateTimeVendor = DateTimeVendor.fromISO(ISO);
  if (
    !startDateTimeVendor.isValid ||
    !endDateTimeVendor.isValid ||
    !dateTimeVendor.isValid
  ) {
    throw new InvalidISODate();
  }
  const startDateTimeInSeconds = startDateTimeVendor.toSeconds();
  const endDateTimeInSeconds = endDateTimeVendor.toSeconds();
  const dateTimeInSeconds = dateTimeVendor.toSeconds();
  if (startDateTimeInSeconds >= dateTimeInSeconds) {
    return startDateTimeVendor.toUTC().toISO();
  } else if (dateTimeInSeconds >= endDateTimeInSeconds) {
    return endDateTimeVendor.toUTC().toISO();
  } else if (
    dateTimeInSeconds - startDateTimeInSeconds >
    endDateTimeInSeconds - dateTimeInSeconds
  ) {
    return endDateTimeVendor.toUTC().toISO();
  } else {
    return startDateTimeVendor.toUTC().toISO();
  }
}

export function addDateTimeFromIntervalDuration(
  startISO: string,
  endISO: string,
  ISO: string
) {
  const intervalVendor = getInterval(startISO, endISO);
  const currentDateTime = DateTimeVendor.fromISO(ISO);
  const newDateTime = currentDateTime.plus(intervalVendor.toDuration());
  if (!newDateTime.isValid) {
    throw new InvalidISODate();
  }
  return newDateTime.toUTC().toISO();
}

export function substractDateTimeFromIntervalDuration(
  startISO: string,
  endISO: string,
  ISO: string
) {
  const intervalVendor = getInterval(startISO, endISO);
  const currentDateTime = DateTimeVendor.fromISO(ISO);
  const newDateTime = currentDateTime.minus(intervalVendor.toDuration());
  if (!newDateTime.isValid) {
    throw new InvalidISODate();
  }
  return newDateTime.toUTC().toISO();
}

export function isUnitFirstQuantity(
  ISO: string,
  dateTimeUnit: DateTimeUnit,
  timezone: TimeZone
) {
  const dateTimeVendor = DateTimeVendor.fromISO(ISO).setZone(timezone);
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  switch (dateTimeUnit) {
    case "millisecond":
      return dateTimeVendor.millisecond === 0;
    case "second":
      return dateTimeVendor.second === 0;
    case "minute":
      return dateTimeVendor.minute === 0;
    case "hour":
      return dateTimeVendor.hour === 0;
    case "day":
      return dateTimeVendor.day === 1;
    case "week":
      return dateTimeVendor.weekday === 1;
    case "month":
      return dateTimeVendor.month === 1;
    case "quarter":
      return dateTimeVendor.quarter === 1;
    default:
      throw new LogicError("Date time unit cannot be year");
  }
}

export function getStartOfUnit(
  ISO: string,
  dateTimeUnit: DateTimeUnit,
  timezone: TimeZone
) {
  const dateTimeVendor = DateTimeVendor.fromISO(ISO).setZone(timezone);
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor.startOf(dateTimeUnit).toUTC().toISO();
}

export function getUnit(
  ISO: string,
  dateTimeUnit: DateTimeUnitFixed,
  timezone: TimeZone
) {
  const dateTimeVendor = DateTimeVendor.fromISO(ISO).setZone(timezone);
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor.get(dateTimeUnit);
}

export function setUnit(
  ISO: string,
  dateTimeUnit: DateTimeUnitFixed,
  quantity: number,
  timezone: TimeZone
) {
  const dateTimeVendor = DateTimeVendor.fromISO(ISO).setZone(timezone);
  if (!dateTimeVendor.isValid) {
    throw new InvalidISODate();
  }
  return dateTimeVendor
    .set({ [dateTimeUnit]: quantity })
    .toUTC()
    .toISO();
}

const DURATION_REGEX =
  /(?:(\d+)y)?(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?(?:(\d+)ms)?/;
export function parseHumanReadableTime(durationString: string): {
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  weeks: number;
  years: number;
} {
  const match = durationString.match(DURATION_REGEX);
  if (match) {
    const [, years, weeks, days, hours, minutes, seconds, milliseconds] =
      match.map(Number);
    return {
      years: years || 0,
      weeks: weeks || 0,
      days: days || 0,
      hours: hours || 0,
      minutes: minutes || 0,
      seconds: seconds || 0,
      milliseconds: milliseconds || 0,
    };
  }
  return {
    years: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  };
}

export function parseToHumanReadableTime(time: {
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  weeks: number;
  years: number;
}): string {
  let duration = "";
  if (time.years) {
    duration += time.years + "y";
  }
  if (time.weeks) {
    duration += time.weeks + "w";
  }
  if (time.days) {
    duration += time.days + "d";
  }
  if (time.hours) {
    duration += time.hours + "h";
  }
  if (time.minutes) {
    duration += time.minutes + "m";
  }
  if (time.seconds) {
    duration += time.seconds + "s";
  }
  if (time.milliseconds) {
    duration += time.milliseconds + "ms";
  }
  return duration;
}
