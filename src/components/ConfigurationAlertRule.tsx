/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { memo, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Button from "@mui/material/Button";
import LoadingButton from "@mui/lab/LoadingButton";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import CloseIcon from "@mui/icons-material/Close";
import Toolbar from "@mui/material/Toolbar";
import {
  type PutAlertRuleForm as PutAlertRuleFormExternal,
  JsTypes,
  JsPromSchema,
} from "@continuousc/relation-graph";

import TabPanel from "./TabPanel";
import Form from "./Form";
import ConfigurationAlertRuleAdd from "./ConfigurationAlertRuleAdd";

import * as services from "../services";
import * as alertConfigUtils from "../utils/alertConfig";
import {
  ALERT_CONFIG_FORM_DEFAULT,
  ALERT_TEMPLATE_FORM_DEFAULT,
} from "../constants";

import {
  alertRuleTemplateInternal,
  alertRuleConfigInternal,
  AlertRuleTemplateInternal,
  AlertRuleConfigInternal,
} from "../types/form";
import { QueryKey } from "../types/frontend";

const ConfigurationAlertRule = memo(function ConfigurationAlertRule() {
  const queryClient = useQueryClient();
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [ruleFormName, setRuleForm] = useState<string | undefined>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRuleName, setDeleteRuleName] = useState<string>("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const menuOpen = Boolean(anchorEl);

  const packages = useQuery({
    queryKey: [QueryKey.Packages],
    queryFn: services.getPackages,
    staleTime: Infinity,
  });
  const ruleForms = useQuery({
    queryKey: [QueryKey.AlertRules],
    queryFn: services.getAlertRules,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
  if (
    ruleFormName === undefined &&
    ruleForms.data !== undefined &&
    ruleForms.data.length > 0
  ) {
    setRuleForm(ruleForms.data[0]);
  }
  const selectorLabels = useQuery({
    queryKey: [QueryKey.AlertRuleSelectors, ruleFormName],
    queryFn: async () => {
      if (ruleFormName) {
        const data = await services.getAlertRuleSelectorLabels(ruleFormName);
        return data;
      }
    },
    enabled: ruleFormName !== undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const ruleFormData = useQuery({
    queryKey: [QueryKey.AlertRuleSpec, ruleFormName],
    queryFn: async () => {
      if (ruleFormName) {
        return await services.getAlertRule(ruleFormName);
      }
    },
    enabled: ruleFormName !== undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const promItems = useMemo(() => {
    if (packages.data !== undefined) {
      const schema =
        packages.data.prom_schema !== undefined
          ? new JsPromSchema(
              packages.data.prom_schema.root,
              packages.data.prom_schema.modules
            )
          : undefined;
      const newTypes = new JsTypes(
        packages.data.packages,
        packages.data.connections,
        schema
      );
      const promItems = newTypes.getPromItems();
      return promItems.filter(
        (value, index, self) => self.indexOf(value) === index
      );
    }
    return [];
  }, [packages.data]);

  const alertRuleForm = useMemo(() => {
    if (
      ruleFormName !== undefined &&
      ruleFormData.data !== undefined &&
      selectorLabels.data
    ) {
      return alertConfigUtils.AlertRuleFormFactory.getAlertRuleForm(
        ruleFormName,
        ruleFormData.data.rule_form,
        promItems,
        selectorLabels.data,
        queryClient
      );
    }
    return null;
  }, [
    ruleFormName,
    ruleFormData.data,
    promItems,
    selectorLabels.data,
    queryClient,
  ]);

  const mutationSave = useMutation({
    mutationKey: [QueryKey.AlertRuleFormSave, ruleFormName],
    mutationFn: async (data: PutAlertRuleFormExternal) => {
      if (ruleFormName !== undefined) {
        await services.putAlertRule(ruleFormName, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKey.AlertRuleSpec, ruleFormName],
      });
    },
    onError: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKey.AlertRuleSpec, ruleFormName],
      });
    },
  });
  const mutationDelete = useMutation({
    mutationKey: [QueryKey.AlertRuleFormDelete, ruleFormName],
    mutationFn: async () => {
      if (ruleFormName !== undefined) {
        await services.deleteAlertRule(ruleFormName);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKey.AlertRules],
      });
    },
  });

  const { templateInternal, templateFormSpecification } = useMemo(() => {
    try {
      if (alertRuleForm !== null) {
        return {
          templateInternal: alertRuleForm.convertTemplateInternal(),
          templateFormSpecification:
            alertRuleForm.getTemplateFormSpecification(),
        };
      }
    } catch {
      /* empty */
    }
    return {
      templateInternal: ALERT_TEMPLATE_FORM_DEFAULT,
      templateFormSpecification: [],
    };
  }, [alertRuleForm]);

  const templateFormOutput = useForm<AlertRuleTemplateInternal>({
    defaultValues: templateInternal,
    values: templateInternal,
    resolver: zodResolver(alertRuleTemplateInternal),
  });
  const templateInternalUpdate = templateFormOutput.watch([
    "specific.custom.params",
  ]);

  const { configsInternal, configsFormSpecification } = useMemo(() => {
    try {
      if (alertRuleForm !== null) {
        return {
          configsInternal: alertRuleForm.convertConfigsInternal(
            templateFormOutput.getValues()
          ),
          configsFormSpecification: alertRuleForm.getConfigsFormSpecification(
            templateFormOutput.getValues()
          ),
        };
      }
    } catch {
      /* empty */
    }
    return {
      configsInternal: ALERT_CONFIG_FORM_DEFAULT,
      configsFormSpecification: [],
    };
  }, [alertRuleForm, templateInternalUpdate]);
  const configFormOutput = useForm<AlertRuleConfigInternal>({
    defaultValues: configsInternal,
    values: configsInternal,
    resolver: zodResolver(alertRuleConfigInternal),
  });

  const isLoading =
    ruleFormData.data === undefined ||
    templateFormOutput.formState.isSubmitting ||
    configFormOutput.formState.isSubmitting ||
    mutationSave.isPending ||
    mutationDelete.isPending;
  return (
    <div className="h-full relative flex flex-col gap-2">
      <div className="flex gap-2 justify-between items-center">
        <Autocomplete
          value={ruleFormName || ""}
          onChange={(_event, newValue) => {
            if (newValue !== null && ruleForms.data?.includes(newValue)) {
              setRuleForm(newValue);
            }
          }}
          autoComplete
          options={ruleForms.data || []}
          renderInput={(params) => (
            <TextField {...params} label="Select Ruleform" size="small" />
          )}
          disableClearable
          size="small"
          disabled={
            ruleForms.data === undefined || ruleForms.data?.length === 0
          }
          className="grow"
        />
        <ToggleButtonGroup
          value={tabIndex}
          onChange={(_event, newValue) => {
            if (newValue !== null) {
              setTabIndex(newValue);
            }
          }}
          exclusive
          size="small"
        >
          <ToggleButton
            value={0}
            color={
              Object.keys(configFormOutput.formState.errors).length
                ? "error"
                : undefined
            }
          >
            Rules
          </ToggleButton>
          <ToggleButton
            value={1}
            color={
              Object.keys(templateFormOutput.formState.errors).length
                ? "error"
                : undefined
            }
          >
            Template
          </ToggleButton>
        </ToggleButtonGroup>
        <LoadingButton
          onClick={handleSave}
          disabled={isLoading}
          startIcon={<SaveIcon />}
          loading={
            templateFormOutput.formState.isSubmitting ||
            configFormOutput.formState.isSubmitting ||
            mutationSave.isPending
          }
          loadingPosition="start"
        >
          Save
        </LoadingButton>
        <IconButton onClick={handleMenuClick}>
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
          <MenuItem onClick={handleAddDialogOpen}>
            <Button startIcon={<AddIcon />} size="small" disabled={isLoading}>
              New
            </Button>
          </MenuItem>
          <MenuItem
            onClick={handleDeleteDialogOpen}
            disabled={ruleFormData.data?.rule_form.provisioned}
          >
            <Button
              startIcon={<DeleteIcon />}
              color={
                ruleFormData.data?.rule_form.provisioned ? "inherit" : "error"
              }
              size="small"
              disabled={isLoading}
            >
              Delete
            </Button>
          </MenuItem>
        </Menu>
      </div>
      <div className="grow h-0">
        <TabPanel
          index={0}
          value={tabIndex}
          className="h-full overflow-auto p-2"
        >
          <FormProvider {...configFormOutput}>
            <Form
              form={configsFormSpecification}
              disabled={
                ruleFormName === undefined ||
                ruleFormData.data === undefined ||
                ruleFormData.data === null
              }
            />
          </FormProvider>
        </TabPanel>
        <TabPanel
          index={1}
          value={tabIndex}
          className="h-full overflow-auto p-2"
        >
          <FormProvider {...templateFormOutput}>
            <Form
              form={templateFormSpecification}
              disabled={!!ruleFormData.data?.rule_form.provisioned}
            />
          </FormProvider>
        </TabPanel>
      </div>
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>
          Are you sure you want to delete the ruleform {ruleFormName} ?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <TextField
              fullWidth
              variant="standard"
              label="Give the name of the ruleform"
              value={deleteRuleName}
              onChange={(event) => {
                const newValue = event.target.value;
                if (newValue !== null) {
                  setDeleteRuleName(newValue);
                }
              }}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <LoadingButton
            onClick={handleDelete}
            disabled={deleteRuleName !== ruleFormName}
            color="error"
            startIcon={<DeleteIcon />}
            loading={
              templateFormOutput.formState.isSubmitting ||
              configFormOutput.formState.isSubmitting ||
              mutationDelete.isPending
            }
            loadingPosition="start"
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <Dialog
        open={addDialogOpen}
        onClose={() => handleAddDialogClose(null)}
        fullWidth
        maxWidth="lg"
        scroll="paper"
        PaperProps={{
          className: "h-screen",
        }}
      >
        <Toolbar className="flex justify-between">
          <DialogTitle>Create new ruleform</DialogTitle>
          <CloseIcon
            className="cursor-pointer"
            onClick={() => handleAddDialogClose(null)}
          />
        </Toolbar>
        <DialogContent>
          <ConfigurationAlertRuleAdd
            onSave={handleAddDialogClose}
            ruleFormNames={ruleForms.data || []}
            promItems={promItems}
          />
        </DialogContent>
      </Dialog>
    </div>
  );

  function handleSave() {
    templateFormOutput.handleSubmit(async (newTemplateInternal) => {
      configFormOutput.handleSubmit(async (newConfigInternal) => {
        if (ruleFormData.data === undefined || alertRuleForm === null) {
          return;
        }
        const ruleForm = alertRuleForm.convertAlertRuleFormExternal(
          newTemplateInternal,
          newConfigInternal
        );
        await mutationSave.mutateAsync({
          version: ruleFormData.data.version,
          rule_form: ruleForm,
        });
      })();
    })();
  }
  async function handleDelete() {
    await mutationDelete.mutateAsync();
    handleDeleteDialogClose();
  }
  function handleMenuClick(event: React.MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
  }
  function handleMenuClose() {
    setAnchorEl(null);
  }
  function handleDeleteDialogOpen() {
    handleMenuClose();
    setDeleteDialogOpen(true);
  }
  function handleDeleteDialogClose() {
    setDeleteDialogOpen(false);
    setDeleteRuleName("");
  }
  function handleAddDialogOpen() {
    handleMenuClose();
    setAddDialogOpen(true);
  }
  function handleAddDialogClose(name: null | string) {
    setAddDialogOpen(false);
    if (name !== null) {
      setRuleForm(name);
    }
  }
});

export default ConfigurationAlertRule;
