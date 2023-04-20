/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type PutAlertRuleForm } from "@continuousc/relation-graph";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import LoadingButton from "@mui/lab/LoadingButton";

import TabPanel from "./TabPanel";
import Form from "./Form";

import * as services from "../services";
import * as alertConfigUtils from "../utils/alertConfig";
import { ALERT_ADD_FORM_DEFAULT } from "../constants";

import {
  newAlertRuleConfigInternal,
  newAlertRuleTemplateInternal,
  newAlertRuleFormResolver,
  NewAlertRuleConfigInternal,
  NewAlertRuleFormInternal,
  NewAlertRuleTemplateInternal,
} from "../types/form";
import { QueryKey } from "../types/frontend";

const steps = [
  "Choose rule form name and type",
  "Configure template",
  "Configure default rule",
];

interface ConfigurationAlertRuleAddProps {
  ruleFormNames: string[];
  promItems: string[];
  onSave: (ruleFornmName: null | string) => void;
}

export default function ConfigurationAlertRuleAdd(
  props: ConfigurationAlertRuleAddProps
) {
  const { ruleFormNames, promItems } = props;
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);

  const mutationAddNewRuleForm = useMutation({
    mutationKey: [QueryKey.AlertRuleFormAddNewTemplate],
    mutationFn: async (data: { name: string; ruleForm: PutAlertRuleForm }) => {
      await services.putAlertRule(data.name, data.ruleForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKey.AlertRules],
      });
    },
  });

  const alertAddForm = useMemo(
    () => new alertConfigUtils.NewAlertForm(promItems),
    [promItems]
  );

  const addResolver = useMemo(
    () => zodResolver(newAlertRuleFormResolver(ruleFormNames)),
    [ruleFormNames]
  );
  const step1Specification = useMemo(
    () => alertAddForm.getStep1FormSpecification(),
    []
  );
  const templateTypeFormOutput = useForm<NewAlertRuleFormInternal>({
    values: ALERT_ADD_FORM_DEFAULT,
    resolver: addResolver,
  });
  const templateType = templateTypeFormOutput.watch("type");

  const { templateInternal, templateFormSpecification } = useMemo(() => {
    alertAddForm.updateTemplateType(templateType);
    return {
      templateInternal: alertAddForm.getTemplateDefault(),
      templateFormSpecification: alertAddForm.getTemplateFormSpecification(),
    };
  }, [templateType]);
  const templateFormOutput = useForm<NewAlertRuleTemplateInternal>({
    values: templateInternal,
    resolver: zodResolver(newAlertRuleTemplateInternal),
  });
  const templateUpdate = templateFormOutput.watch(["specific.custom.params"]);

  const { configsInternal, configsFormSpecification } = useMemo(() => {
    return {
      configsInternal: alertAddForm.getConfigDefaultValueInternal(
        templateFormOutput.getValues()
      ),
      configsFormSpecification: alertAddForm.getConfigsFormSpecification(
        templateFormOutput.getValues()
      ),
    };
  }, [templateUpdate]);
  const configFormOutput = useForm<NewAlertRuleConfigInternal>({
    values: configsInternal,
    resolver: zodResolver(newAlertRuleConfigInternal),
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      <Stepper activeStep={activeStep}>
        {steps.map((label) => {
          return (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
      <div className="flex flex-col content-between overflow-hidden h-full">
        <div className="flex-grow overflow-auto">
          <FormProvider {...templateTypeFormOutput}>
            <TabPanel index={0} value={activeStep}>
              <Form form={step1Specification} />
            </TabPanel>
          </FormProvider>
          <FormProvider {...templateFormOutput}>
            <TabPanel index={1} value={activeStep}>
              <Form form={templateFormSpecification} />
            </TabPanel>
          </FormProvider>
          <FormProvider {...configFormOutput}>
            <TabPanel index={2} value={activeStep}>
              <Form form={configsFormSpecification} />
            </TabPanel>
          </FormProvider>
        </div>
        <div className="flex flex-row justify-between p-2">
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || mutationAddNewRuleForm.isPending}
          >
            Back
          </Button>
          <LoadingButton
            onClick={handleNext}
            loading={mutationAddNewRuleForm.isPending}
          >
            {activeStep === steps.length - 1 ? "Save" : "Next"}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
  function handleNext() {
    if (activeStep === 0) {
      templateTypeFormOutput.handleSubmit(() => {
        setActiveStep(1);
      })();
      return;
    } else if (activeStep === 1) {
      templateFormOutput.handleSubmit(() => {
        setActiveStep(2);
      })();
      return;
    } else if (activeStep === 2) {
      templateTypeFormOutput.handleSubmit(({ name }) => {
        templateFormOutput.handleSubmit((template) => {
          configFormOutput.handleSubmit(async (config) => {
            const ruleForm = alertAddForm.convertAlertRuleFormExternal(
              name,
              template,
              config
            );
            await mutationAddNewRuleForm.mutateAsync({
              name,
              ruleForm: {
                version: undefined,
                rule_form: ruleForm,
              },
            });
            props.onSave(name);
          })();
        })();
      })();
    }
  }
  function handleBack() {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }
}
