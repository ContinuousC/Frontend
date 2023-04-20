/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import HelpIcon from "@mui/icons-material/Help";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Avatar from "@mui/material/Avatar";
import LogoutIcon from "@mui/icons-material/Logout";
import InfoIcon from "@mui/icons-material/Info";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import ListItem from "@mui/material/ListItem";

import * as services from "../services";
import { type RootState } from "../state/store";
import { toggleDarkMode } from "../state/uiSettingsSlice";

import { QueryKey } from "../types/frontend";

export default function Header() {
  const uiSettings = useSelector((state: RootState) => state.uiSettings);
  const dispatch = useDispatch();
  const [anchorUser, setAnchorUser] = React.useState<null | HTMLElement>(null);
  const [anchorHelp, setAnchorHelp] = React.useState<null | HTMLElement>(null);
  const handleUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorUser(null);
  };
  const handleHelpMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorHelp(event.currentTarget);
  };
  const handleCloseHelpMenu = () => {
    setAnchorHelp(null);
  };
  const version = useQuery({
    queryKey: [QueryKey.AppVersion],
    queryFn: services.getAppVersion,
    staleTime: Infinity,
  });

  return (
    <AppBar
      position="sticky"
      className="col-start-1 col-end-3 row-start-1 row-end-2 h-full"
      elevation={1}
    >
      <div className="flex justify-between items-center h-full px-3">
        <div className="flex justify-end w-96">
          <IconButton
            size="small"
            onClick={() => dispatch(toggleDarkMode())}
            color="inherit"
            title={
              uiSettings.darkMode ? "Toggle light mode" : "Toggle dark mode"
            }
          >
            {uiSettings.darkMode ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
          <IconButton size="small" onClick={handleHelpMenu} color="inherit">
            <HelpIcon />
          </IconButton>
          <IconButton size="small" onClick={handleUserMenu} color="inherit">
            <Avatar
              sx={{
                width: 24,
                height: 24,
              }}
            >
              A
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorHelp}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorHelp)}
            onClose={handleCloseHelpMenu}
          >
            <ListItem>
              <div className="flex flex-col">
                <span>HELP</span>
                <span className="opacity-50">{version.data}</span>
              </div>
            </ListItem>
            <Divider />
            <MenuItem onClick={handleCloseHelpMenu}>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              Documentation
            </MenuItem>
            <MenuItem onClick={handleCloseHelpMenu}>
              <ListItemIcon>
                <ConfirmationNumberIcon />
              </ListItemIcon>
              Open A Ticket
            </MenuItem>
          </Menu>
          <Menu
            anchorEl={anchorUser}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorUser)}
            onClose={handleCloseUserMenu}
          >
            <ListItem>
              <div className="flex flex-col">
                <span>admin@organization.com</span>
                <span className="opacity-50">Organization</span>
              </div>
            </ListItem>
            <Divider />
            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <AccountCircle />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </div>
      </div>
    </AppBar>
  );
}
