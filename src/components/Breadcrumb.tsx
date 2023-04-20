/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";

import { type RootState } from "../state/store";

interface BreadcrumbProps {
  name: string;
  to: string;
  end: boolean;
}

export default function Breadcrumb(props: BreadcrumbProps) {
  const uiSettings = useSelector((state: RootState) => state.uiSettings);
  return (
    <div
      className={`capitalize ${
        !props.end
          ? "hover:underline cursor-pointer text-white"
          : uiSettings.darkMode
          ? "text-slate-500"
          : "text-slate-300"
      }`}
    >
      {props.end ? (
        <span>{props.name}</span>
      ) : (
        <NavLink to={props.to}>{props.name}</NavLink>
      )}
    </div>
  );
}
