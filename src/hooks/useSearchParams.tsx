/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { HandleQueryParams } from "../types/frontend";

export default function useSearchParams() {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const setSearchParams = useCallback(
    (params: HandleQueryParams | HandleQueryParams[]) => {
      const searchParamsCurrent = new URLSearchParams(document.location.search);
      if (!Array.isArray(params)) {
        params = [params];
      }
      params.forEach(({ filterName, values }) => {
        searchParamsCurrent.delete(filterName);
        if (values !== undefined) {
          values.forEach((value) => {
            if (!searchParamsCurrent.getAll(filterName).includes(value)) {
              searchParamsCurrent.append(filterName, value);
            }
          });
        }
      });
      navigate(
        { search: `?${searchParamsCurrent.toString()}` },
        { replace: true },
      );
    },
    [],
  );

  return [searchParams, setSearchParams] as const;
}
