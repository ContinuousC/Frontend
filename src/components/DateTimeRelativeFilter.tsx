/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { memo, useState, ChangeEvent } from "react";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import DateRangeIcon from "@mui/icons-material/DateRange";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import PortalButton from "./PortalButton";

import { SHORT_CUT_ITEMS, RELATIVE_OPTIONS } from "../constants";
import * as timeUtils from "../utils/time";

import { RelativeDateTime, DateTime, DateTimeUnit } from "../types/frontend";

interface DateTimeRelativeFilterButtonProps {
  onAccept: (value: RelativeDateTime) => void;
  value: DateTime;
  disableNow?: boolean;
  locale: string;
}

const DateTimeRelativeFilterButton = memo(function DateTimeRelativeFilterButton(
  props: DateTimeRelativeFilterButtonProps
) {
  return (
    <PortalButton
      popperChild={DateTimeRelativeFilter}
      popperProps={{
        onAccept: props.onAccept,
        initialValue: props.value,
        disableNow: props.disableNow,
        locale: props.locale,
      }}
      title="Relative Time Till Now"
      buttonVariant="text"
      buttonChild={
        <>
          <DateRangeIcon fontSize="small" />
          <KeyboardArrowDownIcon fontSize="small" />
        </>
      }
    />
  );
});

export default DateTimeRelativeFilterButton;

interface DateTimeRelativeFilterProps {
  isValid?: (value: RelativeDateTime) => boolean;
  onAccept: (value: RelativeDateTime) => void;
  initialValue: DateTime;
  disableNow?: boolean;
  locale: string;
  onClose?: () => void;
}

export const DateTimeRelativeFilter = (props: DateTimeRelativeFilterProps) => {
  const [value, setValue] = useState<number>(() => {
    if (props.initialValue.relative.value === "startOf") {
      return 1;
    }
    return props.initialValue.relative.value;
  });
  const [unit, setUnit] = useState<DateTimeUnit>(() => {
    if (props.initialValue.relative.unit === "now") {
      return "second";
    }
    return props.initialValue.relative.unit;
  });

  const relativeDateTime = { value: isNaN(value) ? 0 : value, unit };
  const isValid = props.isValid ? props.isValid(relativeDateTime) : true;
  return (
    <div className="flex flex-col pt-3 gap-2">
      <div className="flex flex-col gap-2">
        <div className="flex justify-end gap-4 w-full">
          <TextField
            error={!isValid}
            label="Time Ago"
            helperText={!isValid && "Not Valid"}
            value={value}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setValue(parseInt(event.target.value as string))
            }
            type="number"
            className="w-44"
            size="small"
          />
          <Autocomplete
            value={unit}
            onChange={(_event, newValue) => {
              if (newValue !== null) {
                setUnit(newValue);
              }
            }}
            options={RELATIVE_OPTIONS}
            renderInput={(params) => (
              <TextField {...params} label="Time Unit" size="small" />
            )}
            className="w-44"
          />
        </div>
        <Button
          disabled={!isValid}
          className="self-end"
          onClick={() => {
            props.onAccept(relativeDateTime);
            if (props.onClose) {
              props.onClose();
            }
          }}
        >
          APPLY
        </Button>
      </div>
      <Divider className="w-full" />
      <span>Commonly Used</span>
      <div className="flex flex-wrap gap-2">
        {SHORT_CUT_ITEMS.filter((item) =>
          props.disableNow ? item.unit !== "now" : true
        ).map((item) => {
          return (
            <Chip
              key={item.value + item.unit}
              label={timeUtils.formatRelativeDateTimeToHumanFormat(
                item,
                props.locale
              )}
              onClick={() => {
                props.onAccept(item);
                if (props.onClose) {
                  props.onClose();
                }
              }}
              disabled={props.isValid ? !props.isValid(item) : false}
            />
          );
        })}
      </div>
    </div>
  );
};
