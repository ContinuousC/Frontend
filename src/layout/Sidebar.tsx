/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { ReactNode, useMemo, useState, useRef } from "react";
import { NavLink, To, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { trace, Span } from "@opentelemetry/api";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import { Avatar } from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
//import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "@mui/material/IconButton";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import ArrowCircleLeftIcon from "@mui/icons-material/ArrowCircleLeft";
import Tooltip from "@mui/material/Tooltip";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import HelpIcon from "@mui/icons-material/Help";
import Menu from "@mui/material/Menu";
import InfoIcon from "@mui/icons-material/Info";
//import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { toggleSidebarSize, toggleDarkMode } from "../state/uiSettingsSlice";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ListItemButton from "@mui/material/ListItemButton";
import LaunchIcon from "@mui/icons-material/Launch";
import Link from "@mui/material/Link";
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";
// import ArticleIcon from "@mui/icons-material/Article"; //Logs
// import MultilineChartIcon from "@mui/icons-material/MultilineChart"; //Metrics
// import SegmentIcon from "@mui/icons-material/Segment"; //Traces
import DashboardIcon from "@mui/icons-material/Dashboard"; //Dashboard
import SchemaIcon from "@mui/icons-material/Schema"; //Schema

import * as services from "../services";
import * as topologyFilter from "../utils/topologyFilter";
import * as maybeLoading from "../utils/maybeLoading";

import { QueryKey, SidebarMode } from "../types/frontend";
import { type RootState } from "../state/store";

export default function Sidebar() {
  const spans = useRef<{
    [key: string]: {
      span: Span;
      endTime?: Date;
      timeout?: ReturnType<typeof setTimeout>;
    };
  }>({});
  const key = "sidebar";
  const tracer = trace.getTracer("default");
  if (spans.current[key] === undefined) {
    spans.current[key] = { span: tracer.startSpan("loadSidebar") };
  }
  const { span: loadSpan } = spans.current[key];

  const uiSettings = useSelector((state: RootState) => state.uiSettings);
  const dispatch = useDispatch();

  const dashboards = maybeLoading.useQuery({
    loadSpan,
    queryArgs: {},
    queryKey: QueryKey.Dashboard,
    queryFn: services.getDashboards,
  });
  const views = maybeLoading.useQuery({
    loadSpan,
    queryArgs: {},
    queryKey: QueryKey.Views,
    queryFn: services.getViews,
  });
  const version = maybeLoading.useQuery({
    loadSpan,
    queryArgs: {},
    queryKey: QueryKey.AppVersion,
    queryFn: services.getAppVersion,
  });
  const userInfo = maybeLoading.useQuery({
    loadSpan,
    queryArgs: {},
    queryKey: QueryKey.UserInfo,
    queryFn: services.getUserInfo,
  });

  const topItems: SidebarItem[] = useMemo<SidebarItem[]>(
    () => [
      {
        text: "ContinuousC",
        image: uiSettings.darkMode
          ? "/logos/white_logo_transparent_background.png"
          : "/logos/black_logo_transparent_background.png",
      },
      "divider",
    ],
    [uiSettings.darkMode]
  );

  const dashboardItems = maybeLoading.useMemo(
    { dashboards },
    ({ dashboards }) => {
      const dashboardItems: SidebarItem[] = [];
      Object.entries(dashboards)
        .sort(
          ([dashboardIdA, dashboardDataA], [dashboardIdB, dashboardDataB]) =>
            dashboardIdA === "overview"
              ? -1
              : dashboardIdB === "overview"
                ? 1
                : dashboardDataA.name.localeCompare(dashboardDataB.name)
        )
        .forEach(([dashboardId, dashboard]) => {
          const item: SidebarItem = {
            text: dashboardId === "overview" ? "Dashboards" : dashboard.name,
            icon: { Component: DashboardIcon },
            link: {
              to: {
                pathname: `/dashboards/${dashboardId}`,
              },
            },
          };
          dashboardItems.push(item);
        });
      dashboardItems.push({
        text: "Alerts",
        icon: { Component: NotificationsIcon },
        link: {
          to: { pathname: "/alerts" },
        },
      });
      dashboardItems.push("divider");
      return dashboardItems;
    }
  );

  const viewItems = maybeLoading.useMemo(
    { views },
    ({ views }) => {
      const viewItems: SidebarItem[] = [];
      Object.entries(views)
        .sort(([_viewIdA, viewA], [_viewIdB, viewB]) =>
          viewA.name.localeCompare(viewB.name)
        )
        .forEach(([viewId, view]) => {
          const searchParamsString =
            topologyFilter.getFilterDefaultSearchParamsAsString(view);
          const item: SidebarItem = {
            text: view.name,
            icon: {
              svg: uiSettings.darkMode
                ? view.svgSourceDark || view.svgSource
                : view.svgSource,
            },
            link: {
              to: {
                pathname: `/view/${viewId}`,
                search:
                  searchParamsString !== "" ? searchParamsString : undefined,
              },
            },
          };
          viewItems.push(item);
        });
      return viewItems;
    },
    [uiSettings.darkMode]
  );
  const bottomItems = useMemo(() => {
    const bottomItems: SidebarItem[] = [
      "divider",
      {
        text: "Grafana",
        icon: { svg: "/images/vendors/grafana.svg" },
        link: {
          to: { pathname: "/grafana-iframe" },
        },
      },
      {
        text: "Prometheus",
        icon: { svg: "/images/vendors/prometheus.svg" },
        link: {
          to: { pathname: "/prometheus-iframe" },
        },
      },
      {
        text: "Jaeger",
        icon: { svg: "/images/vendors/jaeger.svg" },
        link: {
          to: { pathname: "/jaeger-iframe" },
        },
      },
      {
        text: "Opensearch",
        icon: { svg: "/images/vendors/opensearch.svg" },
        link: {
          to: { pathname: "/opensearch-iframe" },
        },
      },
      "divider",
      {
        text: "Configuration",
        icon: { Component: SettingsIcon },
        link: { to: { pathname: "/configurations" } },
      },
      {
        text: "Edit Packages",
        icon: { Component: SchemaIcon },
        link: { to: { pathname: "/schema" } },
      },
      {
        text: "Help",
        icon: { Component: HelpIcon },
        menu: {
          header: { text: "help", subTitle: maybeLoading.getData(version) },
          items: [
            {
              text: "Documentation",
              icon: { Component: InfoIcon },
              externalLink: { to: "/documentation" },
            },
            // {
            //   text: "Open A Ticket",
            //   icon: { Component: ConfirmationNumberIcon },
            //   externalLink: { to: "/ticket" },
            // },
          ],
        },
      },
      {
        text: "Account",
        icon: { Component: AccountCircleIcon },
        menu: {
          header: {
            text:
              maybeLoading.getData(userInfo)?.active_organization.name || "",
            subTitle: maybeLoading.getData(userInfo)?.email || "",
          },
          items: [
            {
              text: "Profile",
              icon: { Component: ManageAccountsIcon },
              externalLink: { to: "/profile" },
            },
            {
              text: uiSettings.darkMode ? "Dark mode" : "Light mode",
              subTitle: `Switch between dark and light mode (currently ${uiSettings.darkMode ? "dark mode" : "light mode"})`,
              icon: {
                Component: uiSettings.darkMode ? DarkModeIcon : LightModeIcon,
              },
              button: { onClick: () => dispatch(toggleDarkMode()) },
            },
            {
              text: "Logout",
              icon: { Component: LogoutIcon },
              externalLink: { to: "/auth/logout", target: "_self" },
            },
          ],
        },
      },
    ];
    return bottomItems;
  }, [
    uiSettings.darkMode,
    maybeLoading.getData(userInfo),
    maybeLoading.getData(version),
  ]);

  return (
    <Paper
      className="col-start-1 col-end-2 row-start-1 row-end-2 relative flex flex-col h-full gap-1 group/sidebar"
      elevation={5}
    >
      <List className="grow h-full overflow-y-auto overflow-x-hidden">
        <SidebarListItems
          items={topItems}
          sidebarMode={uiSettings.sidebarMode}
        />
        <SidebarListItems
          items={maybeLoading.getDataOr(dashboardItems, [])}
          sidebarMode={uiSettings.sidebarMode}
          isLoading={dashboardItems === "loading"}
        />
        <SidebarListItems
          items={maybeLoading.getDataOr(viewItems, [])}
          sidebarMode={uiSettings.sidebarMode}
          isLoading={viewItems === "loading"}
        />
      </List>
      <List>
        <SidebarListItems
          items={bottomItems}
          sidebarMode={uiSettings.sidebarMode}
        />
      </List>
      {uiSettings.showSidebar && (
        <div
          className={
            "absolute bottom-1/2 right-[-7px] z-40 md:group-hover/sidebar:block hidden w-6"
          }
        >
          <IconButton
            size="small"
            onClick={() => {
              dispatch(toggleSidebarSize());
            }}
          >
            {uiSettings.sidebarMode === "mini" ? (
              <ArrowCircleRightIcon />
            ) : (
              <ArrowCircleLeftIcon />
            )}
          </IconButton>
        </div>
      )}
    </Paper>
  );
}

type SidebarItem =
  | SidebarDivider
  | SidebarItemImage
  | (SidebarItemBase &
      (
        | { button: SidebarItemButton }
        | { link: SidebarItemLink }
        | { externalLink: SidebarItemExternalLink }
        | { menu: SidebarItemMenu }
      ));
type SidebarIcon = { Component: SvgIconComponent } | { svg?: string };
interface SidebarItemBase {
  text: string;
  subTitle?: string;
  icon?: SidebarIcon;
  badgeCount?: number;
}
type SidebarDivider = "divider";
interface SidebarItemButton {
  onClick: () => void;
}
interface SidebarItemLink {
  to: To;
}
interface SidebarItemExternalLink {
  to: string;
  target?: React.HTMLAttributeAnchorTarget;
}
interface SidebarItemMenu {
  header: {
    text: string;
    subTitle?: string;
  };
  items: (SidebarItemBase &
    (
      | { link: SidebarItemLink }
      | { externalLink: SidebarItemExternalLink }
      | { button: SidebarItemButton }
    ))[];
}
interface SidebarItemImage {
  image: string;
}

function SidebarListItems({
  items,
  sidebarMode,
  isLoading,
}: {
  items: SidebarItem[];
  sidebarMode: SidebarMode;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <ListItem sx={{ paddingY: 0, paddingX: "1px" }}>
        <Stack spacing={1} className="w-11/12">
          <Skeleton variant="rectangular" />
          <Skeleton variant="rectangular" />
          <Skeleton variant="rectangular" />
        </Stack>
      </ListItem>
    );
  }
  return (
    <>
      {items.map((item, index) => {
        if (item === "divider") {
          return (
            <ListItem key={index} sx={{ paddingY: 0.5, paddingX: 1 }}>
              <Divider className="w-full" />
            </ListItem>
          );
        } else if ("image" in item) {
          return (
            <ListItem key={index} sx={{ paddingX: "1px" }}>
              <img
                src={item.image}
                className={`mx-auto ${sidebarMode === "expanded" ? "h-20 w-3/4" : "h-10 w-full"} `}
              />
            </ListItem>
          );
        } else if ("link" in item) {
          return (
            <ListItem key={item.text} sx={{ paddingY: 0, paddingX: "1px" }}>
              <Tooltip
                title={sidebarMode === "mini" ? item.text : item.subTitle}
                placement="right"
              >
                <NavLink to={item.link.to} className="w-full group/listbutton">
                  {({ isActive }) => (
                    <ListItemButton>
                      <SidebarListItemIsActive isActive={isActive}>
                        <SidebarItemIcon
                          text={item.text}
                          icon={item.icon}
                          badgeCount={item.badgeCount}
                        />
                        {sidebarMode === "expanded" && (
                          <>
                            <SidebarItemTitle text={item.text} />
                          </>
                        )}
                      </SidebarListItemIsActive>
                    </ListItemButton>
                  )}
                </NavLink>
              </Tooltip>
            </ListItem>
          );
        } else if ("externalLink" in item) {
          return (
            <ListItem key={item.text} sx={{ paddingY: 0, paddingX: "1px" }}>
              <Tooltip
                title={sidebarMode === "mini" ? item.text : item.subTitle}
                placement="right"
              >
                <Link
                  href={item.externalLink.to}
                  color="inherit"
                  underline="none"
                  className="flex w-full group/listbutton"
                  target={item.externalLink.target || "_blank"}
                >
                  <ListItemButton>
                    <SidebarItemIcon
                      text={item.text}
                      icon={item.icon}
                      badgeCount={item.badgeCount}
                    />
                    {sidebarMode === "expanded" && (
                      <div className="flex gap-1">
                        <SidebarItemTitle text={item.text} />
                        {item.externalLink.target !== "_self" && (
                          <LaunchIcon fontSize="small" />
                        )}
                      </div>
                    )}
                  </ListItemButton>
                </Link>
              </Tooltip>
            </ListItem>
          );
        } else if ("button" in item) {
          return (
            <ListItem key={item.text} sx={{ paddingY: 0, paddingX: "1px" }}>
              <Tooltip
                title={sidebarMode === "mini" ? item.text : item.subTitle}
                placement="right"
              >
                <ListItemButton
                  onClick={item.button.onClick}
                  className="group/listbutton"
                >
                  <SidebarItemIcon
                    text={item.text}
                    icon={item.icon}
                    badgeCount={item.badgeCount}
                  />
                  {sidebarMode === "expanded" && (
                    <SidebarItemTitle text={item.text} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        } else if ("menu" in item) {
          return (
            <ListItem key={item.text} sx={{ paddingY: 0, paddingX: "1px" }}>
              <SidebarMenu
                text={item.text}
                icon={item.icon}
                badgeCount={item.badgeCount}
                menu={item.menu}
                sidebarMode={sidebarMode}
              />
            </ListItem>
          );
        }
      })}
    </>
  );
}

function SidebarMenu(props: {
  text: string;
  icon?: SidebarIcon;
  badgeCount?: number;
  menu: SidebarItemMenu;
  sidebarMode: SidebarMode;
}) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const location = useLocation();
  const isActive = props.menu.items.find((item) => {
    if ("link" in item) {
      if (typeof item.link.to === "string") {
        return item.link.to === location.pathname;
      } else {
        return item.link.to.pathname === location.pathname;
      }
    }
  });
  return (
    <>
      <Tooltip
        title={props.sidebarMode === "mini" ? props.text : undefined}
        placement="right"
      >
        <ListItemButton
          className="group/listbutton"
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          <SidebarListItemIsActive isActive={Boolean(isActive)}>
            <div className="flex items-center justify-between w-full">
              <SidebarItemIcon
                text={props.text}
                icon={props.icon}
                badgeCount={props.badgeCount}
              />
              {props.sidebarMode === "expanded" && (
                <SidebarItemTitle text={props.text} />
              )}
              <span
                className={`absolute right-0 group-hover/listbutton:block ${Boolean(anchor) ? "" : "hidden"}`}
              >
                <KeyboardArrowRightIcon />
              </span>
            </div>
          </SidebarListItemIsActive>
        </ListItemButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClick={() => {
          setAnchor(null);
        }}
        onClose={() => {
          setAnchor(null);
        }}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "left",
        }}
      >
        {props.menu.header && (
          <ListItem>
            <div className="flex flex-col">
              <span className="uppercase">{props.menu.header.text}</span>
              {props.menu.header.subTitle && (
                <span className="opacity-50">{props.menu.header.subTitle}</span>
              )}
            </div>
            <Divider />
          </ListItem>
        )}
        <List>
          {props.menu.items.map((item) => (
            <SidebarListItems
              items={[item]}
              sidebarMode={"expanded"}
              key={item.text}
            />
          ))}
        </List>
      </Menu>
    </>
  );
}

function SidebarListItemIsActive({
  children,
  isActive,
}: {
  children: ReactNode;
  isActive?: boolean;
}) {
  return (
    <div className="flex w-full items-center">
      <div
        className={`absolute left-0 h-10 rounded-r ${isActive ? "bg-primary" : ""} w-1`}
      />
      {children}
    </div>
  );
}

function SidebarItemTitle({ text }: { text: string }) {
  return (
    <span className="font-medium truncate pl-1 text-sm w-full group-hover/listbutton:underline">
      {text}
    </span>
  );
}

function SidebarItemIcon({
  text,
  icon,
  badgeCount,
}: {
  text: string;
  icon?: SidebarIcon;
  badgeCount?: number;
}) {
  let Icon, svg;
  if (icon !== undefined) {
    if ("Component" in icon) {
      Icon = icon.Component;
    } else {
      svg = icon.svg;
    }
  }
  return (
    <Badge
      invisible={!Boolean(badgeCount)}
      badgeContent={badgeCount}
      color="primary"
    >
      {Icon ? (
        <Icon color="inherit" fontSize="small" className="mt-1" />
      ) : (
        <Avatar
          src={svg}
          sx={{ width: 20, height: 20 }}
          alt={text}
          className="mt-1"
        />
      )}
    </Badge>
  );
}
