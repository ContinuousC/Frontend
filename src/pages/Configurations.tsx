/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useState, SyntheticEvent } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import EditNotificationsIcon from "@mui/icons-material/EditNotifications";

import TabPanel from "../components/TabPanel";
import ConfigurationAlertRule from "../components/ConfigurationAlertRule";

// import FormTest from "../components/FormTest";

export default function Configurations() {
  const [tabIndex, setTab] = useState<number>(0);
  const handleTabChange = (_event: SyntheticEvent, newTabIndex: number) => {
    setTab(newTabIndex);
  };
  return (
    <div className="h-full w-full flex flex-col relative gap-1">
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="View Tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          icon={<EditNotificationsIcon />}
          iconPosition="start"
          label="Alerts"
        />
        {/* <Tab label="Test" /> */}
      </Tabs>
      <div className="flex h-0 grow relative pt-2">
        <TabPanel index={0} value={tabIndex} className="h-full w-full">
          <ConfigurationAlertRule />
        </TabPanel>
        {/* <TabPanel index={1} value={tabIndex} className="h-full w-full">
          <FormTest />
        </TabPanel> */}
      </div>
    </div>
  );
}
