/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface IframeProps {
  src: string;
  clientBasePath: string;
  disableUrlState?: boolean;
}

export default function Iframe(props: IframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const onLoadIframe = () => {
    if (!props.disableUrlState) {
      const iframeWindowHistory = iframeRef?.current?.contentWindow?.history;
      if (iframeWindowHistory) {
        iframeWindowHistory.pushState = (
          _state: object,
          _unused: string,
          url: string
        ) => {
          url = url.replace(props.src, props.clientBasePath);
          navigate(url);
        };
        iframeWindowHistory.replaceState = (
          _state: object,
          _unused: string,
          url: string
        ) => {
          url = url.replace(props.src, props.clientBasePath);
          navigate(url, { replace: true });
        };
      }
    }
  };

  const initUrl = useMemo(
    () =>
      location.pathname.replace(props.clientBasePath, props.src) +
      location.search +
      location.hash,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.clientBasePath, props.src]
  );

  return (
    <iframe
      ref={iframeRef}
      id="iframe"
      src={initUrl}
      className="h-full w-full"
      loading="lazy"
      onLoad={onLoadIframe}
    />
  );
}
