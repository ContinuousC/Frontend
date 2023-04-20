/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

/* eslint-disable react-refresh/only-export-components */
import { useState, SyntheticEvent } from "react";
import { QueryClient, QueryKey } from "@tanstack/react-query";
import { type ColumnOutputTypes, JsUnit } from "@continuousc/relation-graph";
/* import { deepEqual } from "fast-equals"; */
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

import { formatISOToAbsoluteWithRelativeTime } from "./time";
import { TimeZone } from "../constants";

export function debounce<T>(
  callback: ((args: T) => void) | ((args: T) => Promise<void>),
  wait: number
) {
  let timerId: number;
  return (args: T) => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => {
      callback(args);
    }, wait);
  };
}

export function convertOutputType(
  type: ColumnOutputTypes,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  timezone: TimeZone,
  locale: string
) {
  if (value === null || value === undefined) {
    return "-";
  }
  if ("props" in type) {
    if (
      type.props === "binarystring" ||
      type.props === "unicodestring" ||
      type.props === "string" ||
      type.props === "integer" ||
      type.props === "age" ||
      type.props === "macaddr" ||
      type.props === "ipv6addr"
    ) {
      return value;
    } else if (type.props === "boolean") {
      return value ? "true" : "false";
    } else if (type.props === "float") {
      return value.toFixed(2);
    } else if (type.props === "time") {
      return formatISOToAbsoluteWithRelativeTime(value, timezone, locale);
    } else if (typeof type.props === "object") {
      if ("quantity" in type.props) {
        const [n, unit] = value;
        return n.toFixed(2) + " " + unit;
      } else if ("map" in type.props) {
        const [key, val] = type.props.map;
        if (typeof key === "string" && typeof val === "string") {
          return <ButtonCollapse value={value} />;
        } else {
          return "unsupported type/object/map";
        }
      } else {
        return "unsupported type/object";
      }
    } else {
      return "unsupported type";
    }
  } else {
    return new JsUnit(type.metric[0]).format_value(
      value as number,
      type.metric[1]
    );
  }
}

function ButtonCollapse(props: { value: { [key: string]: string } }) {
  const [open, setOpen] = useState(false);
  const handleClick = (event: SyntheticEvent) => {
    event.stopPropagation();
    setOpen(!open);
  };

  return (
    <>
      <Button
        variant="text"
        onClick={handleClick}
        endIcon={open ? <ExpandLess /> : <ExpandMore />}
        size="small"
      >
        {open ? "Hide" : "Show"}
      </Button>
      <Collapse in={open}>
        <List dense>
          {Object.entries(props.value).map(([k, v]) => (
            <ListItem key={k}>
              <ListItemText primary={k} secondary={v} />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  );
}

export async function servicesCached<T>(
  _queryClient: QueryClient,
  service: () => Promise<T>,
  _oldQueryKey: QueryKey | undefined,
  _queryKey: QueryKey,
  _checkEquality?: boolean
) {
  return await service();
  /* let previousData: T | undefined = undefined;
   * if (oldQueryKey !== undefined) {
   *   //queryClient.getQueryData(oldQueryKey) takes to long
   *   const hashOldQueryKey = hashKey(oldQueryKey);
   *   const hashNewQueryKey = hashKey(queryKey);
   *   previousData = queryClient.getQueryCache().get(hashOldQueryKey)?.state
   *     .data as T;
   *   if (previousData !== undefined && hashOldQueryKey === hashNewQueryKey) {
   *     return previousData;
   *   }
   * }
   * const newData = await service();
   * let isEqual = false;
   * if (checkEquality) {
   *   isEqual = deepEqual(previousData, newData);
   * }
   * if (isEqual) {
   *   return previousData;
   * } else {
   *   if (oldQueryKey !== undefined) {
   *     queryClient.removeQueries({ queryKey: oldQueryKey });
   *   }
   *   return newData;
   * } */
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNestedFieldFromString(obj: any, path: string) {
  const properties = path.split(".");
  return properties.reduce((acc, property) => {
    if (acc === null || acc === undefined) {
      return undefined;
    }
    if (Array.isArray(acc) && !isNaN(Number(property))) {
      return acc[Number(property)];
    } else if (typeof acc !== "object") {
      return undefined;
    } else if (property in acc) {
      return acc[property];
    } else {
      return undefined;
    }
  }, obj);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertPathToObject(
  path: string,
  input: any,
  index: number
): any {
  const keys = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dataTemp: any = data;
  keys.forEach((key, index) => {
    let actualKey: string | number = key;
    if (!isNaN(Number(actualKey))) {
      actualKey = Number(actualKey);
    }
    if (keys[index + 1]) {
      if (!isNaN(Number(keys[index + 1]))) {
        dataTemp[actualKey] = [];
      } else {
        dataTemp[actualKey] = {};
      }
    } else {
      dataTemp[actualKey] = [];
    }
    dataTemp = dataTemp[actualKey];
  });
  dataTemp[index] = input;
  return data;
}
