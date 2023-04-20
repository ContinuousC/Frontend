/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { expect, test, describe } from "vitest";

import * as timeUtils from "../utils/time";
import * as timelineUtils from "../utils/timeline";

import { TEST1, TEST2, TEST3, TEST4 } from "./timeAxisMock";

const WINDOW_WIDTH = 1000;

describe("Step and time scale for different start date, end dates and different intervals", () => {
  test.each(TEST1)(
    "timestamps: $startDate - $endDate where given time interval $dateTimeInterval",
    (testCase) => {
      const durationInSeconds = timeUtils.getIntervalInSeconds(
        testCase.startDate,
        testCase.endDate
      );
      const timeScale = timelineUtils.getTimeScale(
        durationInSeconds,
        testCase.dateTimeInterval,
        WINDOW_WIDTH
      );
      expect(timeScale).toMatchSnapshot();
    }
  );
});

describe("Get start bin for different timestamps", () => {
  test.each(TEST2)(
    "timestamps $timestamp with time interval $dateTimeUnit and step $step",
    (testCase) => {
      const roundedIntervalMajor = timelineUtils.getDateStartBin(
        testCase.timestamp,
        testCase.dateTimeUnit,
        testCase.step,
        testCase.timezone
      );
      expect(roundedIntervalMajor).toBe(testCase.expectedPreviousInterval);
    }
  );
  test.each(TEST3)(
    "timestamps $timestamp with time interval $dateTimeUnit and step $step for edge case DTS",
    (testCase) => {
      const roundedIntervalMajor = timelineUtils.getDateStartBin(
        testCase.timestamp,
        testCase.dateTimeUnit,
        testCase.step,
        testCase.timezone
      );
      expect(roundedIntervalMajor).toBe(testCase.expectedPreviousInterval);
      expect(
        timeUtils.formatCustom(
          roundedIntervalMajor,
          "Z",
          testCase.timezone,
          "en"
        )
      ).toBe(testCase.expectedDST);
    }
  );
});

describe("Test axis outputs with time interval $dateTimeUnit and step $step", () => {
  test.each(TEST4)("timestamps: $startDate - $endDate", (testCase) => {
    const timeScale = timelineUtils.getTimeScale(
      timeUtils.getIntervalInSeconds(testCase.startDate, testCase.endDate),
      testCase.dateTimeInterval,
      WINDOW_WIDTH
    );
    const timeAxis = timelineUtils.getTimeTicks(
      testCase.startDate,
      testCase.endDate,
      timeScale,
      testCase.timezone,
      testCase.local
    );
    expect(timeAxis.majors?.values).toMatchSnapshot();
    expect(timeAxis.minors.values).toMatchSnapshot();
  });
});
