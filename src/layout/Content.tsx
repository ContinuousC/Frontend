/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import wasm from "@continuousc/relation-graph";

import { refresh } from "../state/datatimeFilterSlice";

import Loading from "../components/Loading";

const GLOBAL_INTERVAL_TIME = 1000 * 60 * 1;
export default function Content() {
  const dispatch = useDispatch();
  const [wasmInit, setWasmInit] = useState<boolean>(false);
  useEffect(() => {
    const initWasm = async () => {
      await wasm();
      setWasmInit(true);
    };
    initWasm();
    let intervalId: NodeJS.Timeout;
    intervalId = setTimeout(
      () => {
        intervalId = setInterval(() => {
          dispatch(refresh());
        }, GLOBAL_INTERVAL_TIME);
        dispatch(refresh());
      },
      (60 - new Date().getSeconds()) * 1000,
    );
    return () => intervalId && clearInterval(intervalId);
  }, []);
  return (
    <div className="h-full col-start-2 col-end-3 row-start-1 row-end-2 p-1 relative overflow-hidden">
      <Suspense fallback={<Loading />}>
        {wasmInit ? <Outlet /> : <Loading />}
      </Suspense>
    </div>
  );
}
