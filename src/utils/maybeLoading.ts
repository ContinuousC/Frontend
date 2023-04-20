/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import * as react from "react";
import { AxiosError } from "axios";
import { deepEqual } from "fast-equals";
import { Span } from "@opentelemetry/api";
import { traceFun, traceAsync } from "./frontend-tracer";

type MaybeLoadingEnabled<T> =
  | "loading"
  | {
    ready: {
      data: T;
      loading: boolean;
      stale: string | null;
    };
  }
  | {
    failed: {
      error: string;
      loading: boolean;
    };
  };

export type MaybeLoading<T> = "disabled" | MaybeLoadingEnabled<T>;

export function ready<T>(data: T, loading?: boolean): MaybeLoadingEnabled<T> {
  return {
    ready: {
      data,
      loading: loading || false,
      stale: null,
    },
  };
}

export function failed<T>(error: string, loading?: boolean): MaybeLoadingEnabled<T> {
  return {
    failed: {
      error,
      loading: loading || false,
    },
  };
}

export function isLoading<T>(value: MaybeLoading<T>): boolean {
  return value === "disabled"
    ? false
    : value === "loading"
      ? true
      : "failed" in value
        ? value.failed.loading
        : value.ready.loading;
}

function setLoading<T>(value: MaybeLoading<T>): MaybeLoadingEnabled<T> {
  return value === "disabled" || value === "loading"
    ? "loading"
    : "failed" in value
      ? { failed: { ...value.failed, loading: true } }
      : { ready: { ...value.ready, loading: true } };
}

function unsetLoading<T>(value: MaybeLoading<T>): MaybeLoading<T> {
  return value === "disabled" || value === "loading"
    ? "disabled"
    : "failed" in value
      ? { failed: { ...value.failed, loading: false } }
      : { ready: { ...value.ready, loading: false } };
}

function share<T>(
  oldValue: MaybeLoading<T>,
  newValue: MaybeLoading<T>,
  dedup?: boolean | ((oldData: T, newData: T) => boolean),
): MaybeLoading<T> {
  const dataEqual =
    oldValue !== "disabled" &&
    oldValue !== "loading" &&
    "ready" in oldValue &&
    newValue !== "disabled" &&
    newValue !== "loading" &&
    "ready" in newValue &&
    (oldValue.ready.data === newValue.ready.data ||
      (dedup &&
        (dedup === true ? deepEqual : dedup)(
          oldValue.ready.data,
          newValue.ready.data,
        )));
  const equal =
    oldValue === "disabled" || oldValue === "loading"
      ? oldValue === newValue
      : "failed" in oldValue
        ? newValue !== "disabled" &&
        newValue !== "loading" &&
        "failed" in newValue &&
        oldValue.failed.error === newValue.failed.error &&
        oldValue.failed.loading === newValue.failed.loading
        : newValue !== "disabled" &&
        newValue !== "loading" &&
        "ready" in newValue &&
        oldValue.ready.loading === newValue.ready.loading &&
        oldValue.ready.stale === newValue.ready.stale &&
        dataEqual;
  return equal
    ? oldValue
    : dataEqual
      ? { ready: { ...newValue.ready, data: oldValue.ready.data } }
      : newValue;
}

export function getData<T>(value: MaybeLoading<T>): T | undefined {
  return value === "disabled" || value === "loading" || "failed" in value
    ? undefined
    : value.ready.data;
}

export function getDataOr<T>(value: MaybeLoading<T>, loading: T): T {
  return value === "disabled" || value === "loading" || "failed" in value
    ? loading
    : value.ready.data;
}

export function getError<T>(value: MaybeLoading<T>): string | undefined {
  return value === "disabled" || value === "loading" || "ready" in value
    ? undefined
    : value.failed.error;
}

export function flatten<T>(
  loading: MaybeLoading<MaybeLoadingEnabled<T>>,
): MaybeLoading<T> {
  return andThen(loading, (data) => data);
}

export function andThen<T, U>(
  a: MaybeLoading<T>,
  f: ((a: T) => MaybeLoadingEnabled<U>) | "disabled",
): MaybeLoading<U> {
  if (a === "disabled" || f === "disabled") {
    return "disabled";
  } else {
    return andThenLoading(a, f);
  }
}

function andThenLoading<T, U>(
  a: MaybeLoadingEnabled<T>,
  f: (a: T) => MaybeLoadingEnabled<U>
): MaybeLoadingEnabled<U> {
  if (a === "loading" || "failed" in a) {
    return a;
  } else {
    const b = f(a.ready.data);
    if (b === "loading") {
      return b;
    } else if ("failed" in b) {
      if (b.failed.loading || !a.ready.loading) {
        return b;
      } else {
        return {
          failed: {
            error: b.failed.error,
            loading: a.ready.loading || b.failed.loading,
          },
        };
      }
    } else {
      return {
        ready: {
          data: b.ready.data,
          loading: a.ready.loading || b.ready.loading,
          stale: a.ready.stale || b.ready.stale,
        },
      };
    }
  }
}


export function andThenArgs<T extends Args, U>(
  args: T,
  f: ((args: Resolved<T>) => MaybeLoadingEnabled<U>) | "disabled",
): MaybeLoading<U> {
  return andThen(combine(args), f);
}

export function map<T, U>(a: MaybeLoading<T>, f: (a: T) => U): MaybeLoading<U> {
  return a === "disabled" ? "disabled" : mapLoading(a, f);

}

function mapLoading<T, U>(a: MaybeLoadingEnabled<T>, f: (a: T) => U): MaybeLoadingEnabled<U> {
  return andThenLoading(a, (a) => {
    try {
      return ready(f(a));
    } catch (err) {
      return failed(getErrorMessage(err));
    }
  });
}


export function mapArgs<A extends Args, U>(
  args: A,
  f: (args: Resolved<A>) => U,
): MaybeLoading<U> {
  return map(combine(args), f);
}

export function mapOr<T, U>(a: MaybeLoading<T>, loading: U, f: (a: T) => U): U {
  return getDataOr(map(a, f), loading);
}

type Args = { [key: string]: MaybeLoading<any> };
type Combined<T extends Args> = MaybeLoading<Resolved<T>>;
type Resolved<T extends Args> = {
  [K in keyof T]: T[K] extends MaybeLoading<infer R> ? R : never;
};

export function combine<T extends Args>(args: T): Combined<T> {
  return Object.entries(args).reduce(
    (a, [key, b]) => andThen(a, b === "disabled" ? "disabled"
      : ((a) => mapLoading(b, (b) => ({ ...a, [key]: b })))),
    ready({}) as MaybeLoading<{ [key: string]: any }>,
  ) as Combined<T>;
}

export function extract<K extends keyof T, T extends { [key: string]: any }>(
  key: K,
  value: MaybeLoading<T>,
): MaybeLoading<T[K]> {
  return react.useMemo(() => map(value, (val) => val[key]), [key, value]);
}

export function extractError<T>(value: MaybeLoading<T>): [string | undefined, MaybeLoading<T>] {
  return react.useMemo<[undefined | string, MaybeLoading<T>]>(() => {
    if (value === "disabled" || value === "loading" || "ready" in value) {
      return [undefined, value];
    } else {
      return [value.failed.error, value.failed.loading ? "loading" : "disabled"];
    }
  }, [value]);
}

function getErrorMessage(err: any): string {
  return err instanceof AxiosError ? err.response?.data.toString() || err.message
    : err instanceof Error ? err.toString()
      : typeof err === "string" ? err : "unknown error";
}

type UseQueryOpts<A extends Args, T> = {
  loadSpan?: Span;
  queryKey: string;
  // MaybeLoadingEnabled-wrapped dependencies of the query. These will be
  // passed unwrapped as arguments to the query function.
  queryArgs: A;
  // An asynchronous function that executes the query.
  queryFn: (args: Resolved<A>) => Promise<T>;
  // Non-MaybeLoadingEnabled dependencies of the query.
  extraDeps?: any[];
  // Whether the query is currently updating (default true).
  update?: boolean;
  // Whether to avoid waiting for all dependencies to be ready before
  // running the query function (default false). Enabling this will
  // cause individual updates to the query result for every argument
  // that gets reloaded.
  noDeferUpdate?: boolean;
  // Whether to preserve the query result when a dependency fails
  // (default false). If this is set to true and a dependency fails
  // while this query is currently ready, the "ready" result will be
  // preserved, saving the error message in the "stale" field.
  keepData?: boolean;
  dedupData?: boolean | ((oldData: T, newData: T) => boolean);
};

export function useQuery<A extends Args, T>(
  options: UseQueryOpts<A, T>,
): MaybeLoading<T> {
  type DataState<T> = {
    version: number;
    done: { failed: string } | { ready: T };
  };

  const [data, actualSetData] = react.useState<DataState<T> | undefined>(
    undefined,
  );

  const result = react.useRef<{
    update:
    | undefined
    | {
      version: number;
      args: Resolved<A>;
    };
    dataDeps?: any[];
    value: MaybeLoading<T>;
  }>({
    update: undefined,
    value: "loading",
  });

  const setData = (newData: DataState<T>) => {
    actualSetData((data) => {
      if (data === undefined || newData.version > data.version) {
        const dataEqual =
          data !== undefined &&
          "ready" in data.done &&
          "ready" in newData.done &&
          (data.done.ready === newData.done.ready ||
            (options.dedupData &&
              (options.dedupData === true ? deepEqual : options.dedupData)(
                data.done.ready,
                newData.done.ready,
              )));
        return dataEqual
          ? { version: newData.version, done: data.done }
          : newData;
      } else {
        return data;
      }
    });
  };

  const { update, value } = react.useMemo(() => {
    const args = combine(options.queryArgs);

    if (
      options.update !== false &&
      args !== "disabled" &&
      args !== "loading" &&
      "ready" in args &&
      (options.noDeferUpdate || !args.ready.loading)
    ) {
      const newDataDeps: any[] = [
        ...Object.values(args.ready.data),
        ...(options.extraDeps || []),
      ];
      if (
        result.current.dataDeps === undefined ||
        result.current.dataDeps.some((v, i) => v !== newDataDeps[i])
      ) {
        const version = result.current.update
          ? result.current.update.version + 1
          : 1;
        result.current.update = {
          version,
          args: args.ready.data,
        };
        result.current.dataDeps = newDataDeps;
      }
    }

    const loading =
      isLoading(args) ||
      (result.current.update !== undefined &&
        (data === undefined
          || result.current.update.version > data.version));
    const argsError = getError(args) || null;
    const newData =
      data !== undefined && (!loading || options.noDeferUpdate)
        ? data.done
        : result.current.value === "disabled" ||
          result.current.value == "loading"
          ? "loading"
          : "ready" in result.current.value
            ? { ready: result.current.value.ready.data }
            : { failed: result.current.value.failed.error };
    const newValue =
      args === "disabled"
        ? "disabled"
        : argsError
          ? options.keepData && newData !== "loading" && "ready" in newData
            ? { ready: { data: newData.ready, stale: argsError, loading } }
            : { failed: { error: argsError, loading } }
          : newData === "loading"
            ? "loading"
            : "ready" in newData
              ? { ready: { data: newData.ready, loading, stale: null } }
              : { failed: { error: newData.failed, loading } };

    result.current.value = share(result.current.value, newValue);
    return result.current;
  }, [
    data,
    options.update,
    ...Object.values(options.queryArgs),
    ...(options.extraDeps || []),
  ]);

  /* Trigger update if version has increased. */
  react.useEffect(() => {
    if (update) {
      const { version, args } = update;
      (options.loadSpan
        ? traceAsync(options.loadSpan, options.queryKey, options.queryFn)
        : options.queryFn)(args)
        .then((newData) => setData({ version, done: { ready: newData } }))
        .catch((e) => setData({ version, done: { failed: getErrorMessage(e) } }));
    }
  }, [update]);

  // return value;

  return value;
}

export function useRef<T, U>(
  f: (value: T) => U,
): [react.MutableRefObject<T | null>, MaybeLoadingEnabled<U>] {
  const ref = react.useRef<T | null>(null);
  const res = react.useMemo(
    () => (ref.current === null ? "loading" : ready(f(ref.current))),
    [ref.current],
  );
  return [ref, res];
}

export function useElemSize<T extends Element, U>(
  f: (value: T) => U,
): [react.MutableRefObject<T | null>, MaybeLoadingEnabled<U>] {
  const ref = react.useRef<T | null>(null);
  const [res, setRes] = react.useState<MaybeLoadingEnabled<U>>("loading");
  react.useEffect(
    () => {
      const elem = ref.current;
      if (elem !== null) {
        const observer = new ResizeObserver(() => {
          try {
            setRes(ready(f(elem)));
          } catch (e) {
            setRes(failed(getErrorMessage(e)));
          }
        });
        observer.observe(elem);
        return () => observer.unobserve(elem);
      } else {
        setRes(setLoading(res));
      }
    },
    [ref.current],
  );
  return [ref, res];
}

export function useMemo<T extends Args, U>(
  args: T,
  f: (args: Resolved<T>) => U,
  extraDeps?: any[],
): MaybeLoading<U> {
  const value = react.useRef<MaybeLoading<U>>("loading");
  const dataDeps = react.useRef<any[] | undefined>(undefined);
  return react.useMemo(() => {
    const combinedArgs = combine(args);
    if (combinedArgs === "disabled") {
      value.current = "disabled";
    } else if (isLoading(combinedArgs)) {
      const newValue = setLoading(value.current);
      value.current = share(value.current, newValue);
    } else {
      const newDataDeps = [
        ...Object.values(args).map(getData),
        ...(extraDeps || []),
      ];
      if (
        value.current === "disabled" ||
        value.current === "loading" ||
        dataDeps.current === undefined ||
        dataDeps.current.some((v, i) => v !== newDataDeps[i])
      ) {
        dataDeps.current = newDataDeps;
        const newValue = map(combinedArgs, f);
        value.current = share(value.current, newValue);
      } else {
        const newValue = unsetLoading(value.current);
        value.current = share(value.current, newValue);
      }
    }
    return value.current;
  }, [...Object.values(args), ...(extraDeps || [])]);
}

export function useMemoTraced<T extends Args, U>(
  renderSpan: Span,
  spanName: string,
  args: T,
  f: (args: Resolved<T>) => U,
  extraDeps?: any[],
): MaybeLoading<U> {
  return useMemo(args, traceFun(renderSpan, spanName, f), extraDeps);
}

export function useEffect<T extends Args>(
  args: T,
  f: (args: Resolved<T>) => void,
  extraDeps?: any[],
) {
  const dataDeps = react.useRef<any[] | undefined>(undefined);
  react.useEffect(() => {
    const combinedArgs = combine(args);
    if (!isLoading(combinedArgs)) {
      const resolvedArgs = getData(combinedArgs);
      if (resolvedArgs !== undefined) {
        const newDataDeps = [
          ...Object.values(resolvedArgs),
          ...(extraDeps || []),
        ];
        if (
          dataDeps.current === undefined ||
          dataDeps.current.some((v, i) => v !== newDataDeps[i])
        ) {
          dataDeps.current = newDataDeps;
          f(resolvedArgs);
        }
      }
    }
  }, [...Object.values(args), ...(extraDeps || [])]);
}
