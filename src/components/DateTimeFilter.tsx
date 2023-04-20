/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { memo, useState, useContext } from "react";
import { DateTime as DateTimeLuxon } from "luxon";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Tooltip from "@mui/material/Tooltip";
import { StaticDateTimePicker } from "@mui/x-date-pickers/StaticDateTimePicker";
import {
  PickersLayoutProps,
  usePickerLayout,
  PickersLayoutRoot,
  PickersLayoutContentWrapper,
} from "@mui/x-date-pickers/PickersLayout";
import { PickersActionBarProps } from "@mui/x-date-pickers/PickersActionBar";
import { DateOrTimeView } from "@mui/x-date-pickers/models";
import CloseIcon from "@mui/icons-material/Close";
import { type SvgIconComponent } from "@mui/icons-material";

import TabPanel from "./TabPanel";
import { DateTimeRelativeFilter } from "./DateTimeRelativeFilter";
import PortalButton from "./PortalButton";

import { DateTimeFilterContext } from "../context";
import { TimeZone } from "../constants";
import * as timeUtils from "../utils/time";

import { DateTime, RelativeDateTime } from "../types/frontend";

interface DateTimeFilterButtonProps {
  title: string;
  Icon: SvgIconComponent;
  value: DateTime;
  onAccept: (dateTime: DateTime) => void;
  minDateTime?: DateTime;
  maxDateTime?: DateTime;
  disableNow?: boolean;
  isValidRelativeDateTime?: (value: RelativeDateTime) => boolean;
  timezone: TimeZone;
  locale: string;
  globalClock: string;
}

const DateTimeFilterButton = memo(function DateTimeFilterButton(props: DateTimeFilterButtonProps) {
  const timeOutputFormatAccept = timeUtils.formatDateTime(
    props.value,
    props.timezone,
    props.locale
  );
  const { Icon } = props;
  return (
    <PortalButton
      popperChild={DateTimeFilter}
      popperProps={{
        onClose: () => { },
        onAccept: props.onAccept,
        minDateTime: props.minDateTime,
        maxDateTime: props.maxDateTime,
        initialValue: props.value,
        disableNow: props.disableNow,
        isValidRelativeDateTime: props.isValidRelativeDateTime,
        timezone: props.timezone,
        locale: props.locale,
        globalClock: props.globalClock,
      }}
      popperChildOverride
      overridePopperClassname="w-[500px] h-[450px] z-50"
      title={props.title}
      buttonClassname="w-40"
      buttonVariant="text"
      buttonChild={
        <div className="w-32 flex justify-end gap-1 items-end">
          <span className="truncate text-xs text-center">
            {timeOutputFormatAccept}
          </span>
          <Icon fontSize="small" />
        </div>
      }
    />
  );
});

export default DateTimeFilterButton;

interface DateTimeFilterProps {
  onClose: () => void;
  onAccept: (value: DateTime) => void;
  minDateTime?: DateTime;
  maxDateTime?: DateTime;
  initialValue: DateTime;
  disableNow?: boolean;
  isValidRelativeDateTime?: (value: RelativeDateTime) => boolean;
  timezone: TimeZone;
  locale: string;
  globalClock: string;
}

const DateTimeFilter = (props: DateTimeFilterProps) => {
  const onAccept = (value: DateTime) => {
    props.onAccept(value);
    props.onClose();
  };
  return (
    <DateTimeFilterContext.Provider
      value={{
        onClose: props.onClose,
        onAccept,
        initialValue: props.initialValue,
        disableNow: props.disableNow,
        isValidRelativeDateTime: props.isValidRelativeDateTime,
        timezone: props.timezone,
        locale: props.locale,
        globalClock: props.globalClock,
      }}
    >
      <StaticDateTimePicker
        slots={{
          shortcuts: Shortcuts,
          layout: Layout,
          actionBar: ActionBar,
        }}
        ampm={false}
        disableFuture
        orientation="landscape"
        minDateTime={
          props.minDateTime
            ? DateTimeLuxon.fromISO(
              timeUtils.addTimeUnit(
                props.minDateTime.absolute,
                "minute",
                1,
                props.timezone
              )
            )
            : undefined
        }
        maxDateTime={
          props.maxDateTime
            ? DateTimeLuxon.fromISO(
              timeUtils.substractTimeUnit(
                props.maxDateTime.absolute,
                "minute",
                1,
                props.timezone
              )
            )
            : undefined
        }
        onAccept={(value: DateTimeLuxon | null) => {
          if (value !== null) {
            const absolute = value.toISO();
            if (absolute !== null) {
              props.onAccept({
                type: "absolute",
                absolute,
                relative: timeUtils.absoluteToAproximateRelativeDateTime(
                  absolute,
                  props.globalClock
                ),
              });
            }
          }
        }}
        defaultValue={DateTimeLuxon.fromISO(
          props.initialValue.absolute
        ).setZone(props.timezone)}
      />
    </DateTimeFilterContext.Provider>
  );
};

export const Layout = (
  props: PickersLayoutProps<DateTimeLuxon | null, DateTimeLuxon, DateOrTimeView>
) => {
  const { onClose, initialValue, timezone, locale } = useContext(
    DateTimeFilterContext
  );
  const { toolbar, tabs, content, actionBar, shortcuts } =
    usePickerLayout(props);
  const [tabIndex, setTabIndex] = useState<number>(
    initialValue?.type === "relative" ? 0 : 1
  );

  return (
    <Paper className="h-full p-1 border">
      <PickersLayoutRoot ownerState={props} className="h-full">
        <PickersLayoutContentWrapper className="h-full">
          <div className="flex justify-between items-center">
            <Tabs
              value={tabIndex}
              onChange={(_event, newTabIndex: number) =>
                setTabIndex(newTabIndex)
              }
            >
              <Tab label="RELATIVE" />
              <Tab label="ABSOLUTE" />
            </Tabs>
            <div className="flex justify-end gap-2 items-center">
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </div>
          </div>
          <TabPanel index={tabIndex} value={0}>
            {shortcuts}
          </TabPanel>
          <TabPanel index={tabIndex} value={1} className="h-full">
            <div className="flex">
              <div>{toolbar}</div>
              <div>
                {tabs}
                {content}
              </div>
              <div className="bottom-0 absolute right-0">{actionBar}</div>
            </div>
          </TabPanel>
          <Tooltip title="Timestamp On Last Apply">
            <div className="bottom-2 absolute left-2 italic">
              {initialValue !== undefined
                ? DateTimeLuxon.fromISO(initialValue.absolute)
                  .setZone(timezone)
                  .setLocale(locale)
                  .toLocaleString(DateTimeLuxon.DATETIME_MED_WITH_SECONDS)
                : null}
            </div>
          </Tooltip>
        </PickersLayoutContentWrapper>
      </PickersLayoutRoot>
    </Paper>
  );
};

export const Shortcuts = () => {
  const {
    onAccept,
    initialValue,
    disableNow,
    isValidRelativeDateTime,
    locale,
    timezone,
    globalClock,
  } = useContext(DateTimeFilterContext);

  return (
    <>
      {initialValue && (
        <DateTimeRelativeFilter
          isValid={isValidRelativeDateTime}
          onAccept={(relative) =>
            onAccept({
              type: "relative",
              absolute: timeUtils.relativeToAbsoluteDateTime(
                relative,
                globalClock,
                timezone
              ),
              relative,
            })
          }
          initialValue={initialValue}
          disableNow={disableNow}
          locale={locale}
        />
      )}
    </>
  );
};

function ActionBar(props: PickersActionBarProps) {
  const { onAccept } = props;
  return <Button onClick={onAccept}>APPLY</Button>;
}
