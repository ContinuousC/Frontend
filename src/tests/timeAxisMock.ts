/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { TimeZone } from "../constants";

import { DateTimeInterval, DateTimeUnit } from "../types/frontend";

export const TIME_ZONE_BRUSSELS = "Europe/Brussels";

export const TEST1: {
  startDate: string;
  endDate: string;
  dateTimeInterval: DateTimeInterval;
}[] = [
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-20T14:17:00.000Z",
    dateTimeInterval: "auto",
  },
  {
    startDate: "2023-01-20T14:14:52.000Z",
    endDate: "2023-01-20T14:18:00.000Z",
    dateTimeInterval: "auto",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-20T14:25:00.000Z",
    dateTimeInterval: "auto",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-20T15:00:00.000Z",
    dateTimeInterval: "auto",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-20T17:00:00.000Z",
    dateTimeInterval: "auto",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-21T00:15:00.000Z",
    dateTimeInterval: "auto",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-21T12:00:00.000Z",
    dateTimeInterval: "auto",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-24T02:00:00.000Z",
    dateTimeInterval: "auto",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-02-18T02:00:00.000Z",
    dateTimeInterval: "auto",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-05-18T02:00:00.000Z",
    dateTimeInterval: "auto",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2025-05-18T02:00:00.000Z",
    dateTimeInterval: "auto",
  },
  // {
  //   startDate: "2023-01-20T14:15:00.000Z",
  //   endDate: "2023-01-20T14:17:10.000Z",
  //   dateTimeInterval: "millisecond",
  // },
  // {
  //   startDate: "2023-01-20T14:15:00.000Z",
  //   endDate: "2023-01-20T14:17:10.000Z",
  //   dateTimeInterval: "minute",
  // },
  // {
  //   startDate: "2023-01-20T14:15:00.000Z",
  //   endDate: "2023-01-20T14:17:10.000Z",
  //   dateTimeInterval: "year",
  // },
  // {
  //   startDate: "2023-01-20T14:15:00.000Z",
  //   endDate: "2023-01-24T02:00:00.000Z",
  //   dateTimeInterval: "minute",
  // },
  // {
  //   startDate: "2023-01-20T14:15:00.000Z",
  //   endDate: "2023-01-24T02:00:00.000Z",
  //   dateTimeInterval: "day",
  // },
  // {
  //   startDate: "2023-01-20T14:15:00.000Z",
  //   endDate: "2023-01-24T02:00:00.000Z",
  //   dateTimeInterval: "week",
  // },
  // {
  //   startDate: "2023-01-20T14:15:00.000Z",
  //   endDate: "2023-02-18T02:00:00.000Z",
  //   dateTimeInterval: "week",
  // },
  // {
  //   startDate: "2023-01-20T14:15:00.000Z",
  //   endDate: "2023-02-18T02:00:00.000Z",
  //   dateTimeInterval: "quarter",
  // },
  // {
  //   startDate: "2023-01-20T14:15:00.000Z",
  //   endDate: "2023-05-18T02:00:00.000Z",
  //   dateTimeInterval: "month",
  // },
];

export const TEST2: {
  timestamp: string;
  dateTimeUnit: DateTimeUnit;
  step: number;
  timezone: TimeZone;
  expectedPreviousInterval: string;
}[] = [
  {
    timestamp: "2023-01-20T14:15:04.090Z",
    dateTimeUnit: "second",
    step: 5,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T14:15:00.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:14.120Z",
    dateTimeUnit: "second",
    step: 5,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T14:15:10.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:15.120Z",
    dateTimeUnit: "second",
    step: 5,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T14:15:15.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:15.100Z",
    dateTimeUnit: "second",
    step: 15,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T14:15:15.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:04.000Z",
    dateTimeUnit: "second",
    step: 15,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T14:15:00.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:04.000Z",
    dateTimeUnit: "minute",
    step: 1,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T14:15:00.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:04.000Z",
    dateTimeUnit: "minute",
    step: 5,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T14:15:00.000Z",
  },
  {
    timestamp: "2023-01-20T14:14:04.000Z",
    dateTimeUnit: "minute",
    step: 5,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T14:10:00.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:04.000Z",
    dateTimeUnit: "minute",
    step: 15,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T14:15:00.000Z",
  },
  {
    timestamp: "2023-01-20T14:14:04.000Z",
    dateTimeUnit: "minute",
    step: 15,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T14:00:00.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:00.000Z",
    dateTimeUnit: "hour",
    step: 1,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T14:00:00.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:00.000Z",
    dateTimeUnit: "hour",
    step: 6,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T11:00:00.000Z",
  },
  {
    timestamp: "2023-01-20T06:15:00.000Z",
    dateTimeUnit: "hour",
    step: 6,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T05:00:00.000Z",
  },
  {
    timestamp: "2023-01-20T20:15:00.000Z",
    dateTimeUnit: "hour",
    step: 6,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-20T17:00:00.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:00.000Z",
    dateTimeUnit: "day",
    step: 1,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-19T23:00:00.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:00.000Z",
    dateTimeUnit: "week",
    step: 1,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-01-15T23:00:00.000Z",
  },
  {
    timestamp: "2023-01-20T14:15:00.000Z",
    dateTimeUnit: "month",
    step: 1,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2022-12-31T23:00:00.000Z",
  },
];

export const TEST3: {
  timestamp: string;
  dateTimeUnit: DateTimeUnit;
  step: number;
  timezone: TimeZone;
  expectedPreviousInterval: string;
  expectedDST: string;
}[] = [
  //winter --> summer: before 2h
  {
    timestamp: "2023-03-26T00:00:59.010Z",
    dateTimeUnit: "hour",
    step: 1,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-03-26T00:00:00.000Z",
    expectedDST: "+1",
  },
  {
    timestamp: "2023-03-26T00:01:20.010Z",
    dateTimeUnit: "hour",
    step: 6,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-03-25T23:00:00.000Z",
    expectedDST: "+1",
  },
  //winter --> summer: after 2h
  {
    timestamp: "2023-03-26T01:01:20.010Z",
    dateTimeUnit: "minute",
    step: 1,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-03-26T01:01:00.000Z",
    expectedDST: "+2",
  },
  {
    timestamp: "2023-03-26T01:01:20.010Z",
    dateTimeUnit: "hour",
    step: 1,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-03-26T01:00:00.000Z",
    expectedDST: "+2",
  },
  {
    timestamp: "2023-03-26T01:01:20.010Z",
    dateTimeUnit: "hour",
    step: 6,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-03-25T23:00:00.000Z",
    expectedDST: "+1",
  },
  //summer --> winter: before 2h
  {
    timestamp: "2023-10-29T00:59:20.010Z",
    dateTimeUnit: "hour",
    step: 1,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-10-29T00:00:00.000Z",
    expectedDST: "+2",
  },
  {
    timestamp: "2023-10-29T00:59:20.010Z",
    dateTimeUnit: "hour",
    step: 6,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-10-28T22:00:00.000Z",
    expectedDST: "+2",
  },
  //summer --> winter: after 2h
  {
    timestamp: "2023-10-29T01:02:20.010Z",
    dateTimeUnit: "hour",
    step: 1,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-10-29T01:00:00.000Z",
    expectedDST: "+1",
  },
  {
    timestamp: "2023-10-29T01:02:20.010Z",
    dateTimeUnit: "hour",
    step: 6,
    timezone: TIME_ZONE_BRUSSELS,
    expectedPreviousInterval: "2023-10-28T22:00:00.000Z",
    expectedDST: "+2",
  },
];

export const TEST4: {
  startDate: string;
  endDate: string;
  dateTimeInterval: DateTimeInterval;
  timezone: TimeZone;
  local: string;
}[] = [
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-20T14:18:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:15:18.000Z",
    endDate: "2023-01-20T14:17:53.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:14:46.000Z",
    endDate: "2023-01-20T14:18:12.001Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:14:46.000Z",
    endDate: "2023-01-20T14:26:22.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-20T15:00:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:14:52.000Z",
    endDate: "2023-01-20T15:00:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:14:52.000Z",
    endDate: "2023-01-20T17:00:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-21T00:15:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-21T12:00:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-01-24T02:00:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-02-18T02:00:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2023-05-18T02:00:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-01-20T14:15:00.000Z",
    endDate: "2025-05-18T02:00:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  //winter --> summer (one houre less, 2h should not be shown)
  {
    startDate: "2023-03-25T23:00:00.000Z",
    endDate: "2023-03-26T02:30:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-03-25T23:00:00.000Z",
    endDate: "2023-03-26T17:30:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  //summer --> winter (one houre more, 2h should be shown twice)
  {
    startDate: "2023-10-28T23:00:00.000Z",
    endDate: "2023-10-29T03:30:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
  {
    startDate: "2023-10-28T23:00:00.000Z",
    endDate: "2023-10-29T17:30:00.000Z",
    dateTimeInterval: "auto",
    timezone: TIME_ZONE_BRUSSELS,
    local: "nl-be",
  },
];
