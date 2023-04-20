/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

// @vitest-environment jsdom

import { expect, test, describe } from "vitest";
import { renderHook } from "@testing-library/react";

import * as maybeLoading from "../utils/maybeLoading";

describe("maybeLoading.useQuery", () => {
  test("Query resolves", async () => {
    const { result, rerender } = renderHook(() =>
      maybeLoading.useQuery({
        queryKey: "test",
        queryArgs: {},
        queryFn: async ({}) => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return 42;
        },
      }),
    );

    expect(result.current).toBe("loading");

    await new Promise((resolve) => setTimeout(resolve, 100));
    rerender();

    expect(result.current).toEqual(maybeLoading.ready(42));
  });

  test("Reload dependency", async () => {
    let av = maybeLoading.ready(19);

    const { result, rerender } = renderHook(() => {
      const a = maybeLoading.useQuery({
        queryKey: "a",
        queryArgs: { av },
        queryFn: async ({ av }) => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return av;
        },
      });

      const b = maybeLoading.useQuery({
        queryKey: "b",
        queryArgs: {},
        queryFn: async ({}) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return 23;
        },
      });

      return maybeLoading.useQuery({
        queryKey: "c",
        queryArgs: { a, b },
        queryFn: async ({ a, b }) => {
          return a + b;
        },
      });
    });

    expect(result.current).toBe("loading");

    await new Promise((resolve) => setTimeout(resolve, 75));
    rerender();

    expect(result.current).toBe("loading");

    await new Promise((resolve) => setTimeout(resolve, 50));
    rerender();

    expect(result.current).toEqual(maybeLoading.ready(42));

    av = "loading";
    rerender();

    expect(result.current).toEqual(maybeLoading.ready(42, true));

    av = maybeLoading.ready(20);
    rerender();

    expect(result.current).toEqual(maybeLoading.ready(42, true));

    await new Promise((resolve) => setTimeout(resolve, 75));
    rerender();

    expect(result.current).toEqual(maybeLoading.ready(43));
  });
});
