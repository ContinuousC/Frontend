/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { UseFormGetValues, WatchObserver } from "react-hook-form";
import { type QueryClient } from "@tanstack/react-query";
import {
  type AlertRuleForms as AlertRuleFormsExternal,
  type AlertRuleForm as AlertRuleFormExternal,
  type CustomAlertRuleForm as CustomAlertRuleFormExternal,
  type FixedTracesAlertRuleForm as FixedTracesAlertRuleFormExternal,
  type DynamicTracesAlertRuleForm as DynamicTracesAlertRuleFormExternal,
  type ParamTypeSpec,
  type Severity,
  type Provisionable,
  JsUnit,
  type Dimension as DimensionExternal,
  ParamValue,
  JsDimension,
  Dimension,
} from "@continuousc/relation-graph";
import { z } from "zod";

import { parseHumanReadableTime, parseToHumanReadableTime } from "./time";
import { getAlertRuleSelectorLabelValues } from "../services";
import { getNestedFieldFromString } from "./general";

import {
  type FormSpecification,
  type AlertRuleConfigInternal,
  type AlertRuleCommonConfigInternal,
  type AlertRuleCustomConfigInternal,
  type AlertRuleFixedTracesConfigInternal,
  type AlertRuleDynamicTracesConfigInternal,
  type AlertRuleTemplateInternal,
  type AlertRuleTemplateTypesInternal,
  type NewAlertRuleFormInternal,
  type NewAlertRuleConfigInternal,
  type NewAlertRuleTemplateInternal,
  type AlertRuleConfigElementInternal,
  type CustomParamTypeInternal,
  //ZOD objects
  alertRuleCustomTemplateInternal,
  alertRuleConfigInternal,
  alertRuleCommonConfigInternal,
  AlertRuleCustomTemplateInternal,
} from "../types/form";
import { QueryKey } from "../types/frontend";
import { REV_SEVERITIES } from "../constants";

const DURATIONS = [
  "years",
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
  "milliseconds",
] as const;
const SEVERITIES_DEFAULT: { [key in Severity]: null } = {
  major: null,
  critical: null,
  warning: null,
  minor: null,
};

export class AlertRuleFormFactory {
  public static getAlertRuleForm(
    ruleFormName: string,
    ruleForm: Provisionable<AlertRuleFormsExternal>,
    promItems: string[],
    selectorLabels: string[],
    queryClient: QueryClient
  ) {
    if ("custom" in ruleForm) {
      return new AlertForm(
        ruleFormName,
        ruleForm.custom,
        ruleForm.provisioned,
        new CustomAlertForm(ruleForm.custom, promItems),
        selectorLabels,
        queryClient
      );
    } else if ("fixed_traces" in ruleForm) {
      return new AlertForm(
        ruleFormName,
        ruleForm.fixed_traces,
        ruleForm.provisioned,
        new FixedTracesAlertForm(ruleForm.fixed_traces),
        selectorLabels,
        queryClient
      );
    } else {
      return new AlertForm(
        ruleFormName,
        ruleForm.dynamic_traces,
        ruleForm.provisioned,
        new DynamicTracesAlertForm(ruleForm.dynamic_traces),
        selectorLabels,
        queryClient
      );
    }
  }
}

interface AlertFormSpecific<T> {
  ruleForm: AlertRuleFormExternal<T>;
  convertTemplateInternal(): AlertRuleTemplateInternal["specific"];
  convertConfigsInternal(
    convertCommonConfigInternal: (
      config: AlertRuleFormExternal<T>["configs"][""]
    ) => AlertRuleCommonConfigInternal,
    templateInternal: AlertRuleTemplateInternal
  ): AlertRuleConfigInternal;
  convertAlertRuleFormExternal(
    template: AlertRuleTemplateInternal,
    configsForm: AlertRuleConfigInternal,
    convertCommonConfigExternal: (
      config: AlertRuleCommonConfigInternal
    ) => Omit<AlertRuleFormExternal<T>["configs"][""], "params">
  ): AlertRuleFormsExternal;
  getTemplateFormSpecification(
    isNew?: boolean
  ): FormSpecification<AlertRuleTemplateInternal>[];
  getConfigsFormSpecification(
    index: number,
    template: AlertRuleTemplateInternal
  ): FormSpecification<AlertRuleConfigInternal>[];
  getType(): AlertRuleTemplateTypesInternal;
  getConfigZodElement(): z.AnyZodObject;
  getConfigDefaultValueInternal(
    templateForm: AlertRuleTemplateInternal
  ): AlertRuleConfigElementInternal;
}

class AlertForm<T> {
  private ruleFormName: string;
  private ruleForm: AlertRuleFormExternal<T>;
  private alertRuleFormSpecific: AlertFormSpecific<T>;
  private selectorLabels: string[];
  private queryClient: QueryClient;
  private provisioned: boolean;

  constructor(
    ruleFormName: string,
    ruleForm: AlertRuleFormExternal<T>,
    provisioned: boolean,
    alertRuleFormSpecific: AlertFormSpecific<T>,
    selectorLabels: string[],
    queryClient: QueryClient
  ) {
    this.ruleFormName = ruleFormName;
    this.ruleForm = ruleForm;
    this.provisioned = provisioned;
    this.alertRuleFormSpecific = alertRuleFormSpecific;
    this.selectorLabels = selectorLabels;
    this.queryClient = queryClient;
  }

  convertTemplateInternal(): AlertRuleTemplateInternal {
    return {
      common: {
        alert: this.ruleFormName,
        annotations: {
          summary:
            this.ruleForm.template.annotations.summary === undefined
              ? null
              : this.ruleForm.template.annotations.summary,
          description:
            this.ruleForm.template.annotations.description === undefined
              ? null
              : this.ruleForm.template.annotations.description,
          runbook_url:
            this.ruleForm.template.annotations.runbook_url === undefined
              ? null
              : this.ruleForm.template.annotations.runbook_url,
        },
      },
      specific: this.alertRuleFormSpecific.convertTemplateInternal(),
    };
  }

  convertConfigsInternal(
    templateInternal: AlertRuleTemplateInternal
  ): AlertRuleConfigInternal {
    return this.alertRuleFormSpecific.convertConfigsInternal(
      convertCommonConfigInternal,
      templateInternal
    );

    function convertCommonConfigInternal<T>(
      config: AlertRuleFormExternal<T>["configs"][""]
    ): AlertRuleCommonConfigInternal {
      return {
        for: parseHumanReadableTime(config.for),
        labels: Object.entries(config.labels).map(([name, value]) => ({
          name,
          value,
        })),
        selectors: convertSelectorForm(config.selectors),
      };
      function convertSelectorForm<T>(
        configuration: AlertRuleFormExternal<T>["configs"][""]["selectors"]
      ): AlertRuleCommonConfigInternal["selectors"] {
        return Object.entries(configuration).map(
          ([selectorName, selectorValue]) => {
            return { name: selectorName, selector: selectorValue };
          }
        );
      }
    }
  }

  convertAlertRuleFormExternal(
    templateForm: AlertRuleTemplateInternal,
    configsForm: AlertRuleConfigInternal
  ): AlertRuleFormsExternal {
    return this.alertRuleFormSpecific.convertAlertRuleFormExternal(
      templateForm,
      configsForm,
      convertCommonConfigExternal
    );

    function convertCommonConfigExternal<T>(
      config: AlertRuleCommonConfigInternal
    ): Omit<AlertRuleFormExternal<T>["configs"][""], "params"> {
      return {
        for: parseToHumanReadableTime(config.for),
        labels: Object.fromEntries(
          config.labels.map((label) => [label.name, label.value])
        ),
        selectors: convertSelectorAlertRuleForm(config.selectors),
      };
      function convertSelectorAlertRuleForm(
        configuration: AlertRuleCommonConfigInternal["selectors"]
      ): AlertRuleFormExternal<T>["configs"][""]["selectors"] {
        return Object.fromEntries(
          configuration.map((selectorValue) => {
            return [selectorValue.name, selectorValue.selector];
          })
        );
      }
    }
  }

  getTemplateFormSpecification(
    isNew?: boolean
  ): FormSpecification<AlertRuleTemplateInternal>[] {
    const form: FormSpecification<AlertRuleTemplateInternal>[] = [
      {
        formType: "subForm",
        name: "common.annotations",
        label: "Annotations",
        form: [
          {
            formType: "textField",
            name: "common.annotations.summary",
            label: "Summary",
            notRequired: {
              defaultValue: "",
            },
          },
          {
            formType: "textField",
            name: "common.annotations.description",
            label: "Description",
            notRequired: {
              defaultValue: "",
            },
          },
          {
            formType: "textField",
            name: "common.annotations.runbook_url",
            label: "Runbook Url",
            notRequired: {
              defaultValue: "",
            },
          },
        ],
      },
      ...this.alertRuleFormSpecific.getTemplateFormSpecification(isNew),
    ];
    return form;
  }

  getConfigsFormSpecification(
    templateForm: AlertRuleTemplateInternal
  ): FormSpecification<AlertRuleConfigInternal>[] {
    return [
      {
        formType: "list",
        name: this.alertRuleFormSpecific.getType(),
        label: "rule",
        formGenerator: this.configFormListGenerator(templateForm),
        schemaResolver: this.alertRuleFormSpecific.getConfigZodElement(),
        newValueDefault:
          this.alertRuleFormSpecific.getConfigDefaultValueInternal(
            templateForm
          ),
        sortingDisabled: true,
        updateDynamiclyDisabled: {
          default: { formExcluded: !this.provisioned },
        },
      },
    ];
  }

  private configFormListGenerator(
    templateForm: AlertRuleTemplateInternal
  ): (
    index: number,
    _getParentValues: UseFormGetValues<AlertRuleConfigInternal>,
    isNew?: boolean
  ) => FormSpecification<AlertRuleConfigInternal>[] {
    const type = this.alertRuleFormSpecific.getType();
    return (
      index: number,
      _getParentValues: UseFormGetValues<AlertRuleConfigInternal>,
      isNew?: boolean
    ): FormSpecification<AlertRuleConfigInternal>[] => [
        {
          formType: "textField",
          name: `${type}.${index}.name`,
          label: "Name",
          disabled: isNew === undefined ? true : false,
        },
        {
          formType: "subForm",
          name: `${type}.${index}.common.for`,
          label: "Duration",
          horizontal: true,
          form: DURATIONS.map((duration) => ({
            formType: "textField",
            name: `${type}.${index}.common.for.${duration}`,
            label: duration,
            number: "integer",
          })),
        },
        {
          formType: "group",
          name: `${type}.${index}`,
          label: "",
          forms: [
            {
              label: "Selectors",
              form: [
                {
                  formType: "list",
                  name: `${type}.${index}.common.selectors`,
                  label: "selector",
                  emptyLabel: "selector name",
                  formGenerator: this.selectorListFormGenerator(index),
                  schemaResolver:
                    alertRuleCommonConfigInternal.shape.selectors.element,
                  newValueDefault: {
                    name: "",
                    selector: "opt",
                  },
                  sortingDisabled: true,
                },
              ],
            },
            {
              label: "Alert Labels",
              form: [
                {
                  formType: "list",
                  name: `${type}.${index}.common.labels`,
                  label: "label",
                  formGenerator: (
                    indexChild: number,
                    _getParentValues: UseFormGetValues<AlertRuleConfigInternal>,
                    isNew
                  ) => [
                      {
                        formType: "textField",
                        name: `${type}.${index}.common.labels.${indexChild}.name`,
                        label: "Name",
                        fixed: isNew === undefined ? true : false,
                      },
                      {
                        formType: "textField",
                        name: `${type}.${index}.common.labels.${indexChild}.value`,
                        label: "Value",
                      },
                    ],
                  schemaResolver:
                    alertRuleCommonConfigInternal.shape.labels.element,
                  newValueDefault: {
                    name: "",
                    value: "",
                  },
                  sortingDisabled: true,
                },
              ],
            },
            {
              label: `Template specifics (${this.alertRuleFormSpecific.getType().replace("_", "")})`,
              form: this.alertRuleFormSpecific.getConfigsFormSpecification(
                index,
                templateForm
              ),
            },
          ],
        },
      ];
  }
  private selectorListFormGenerator(
    rootIndex: number
  ): (
    selectorIndex: number,
    getParentValues: UseFormGetValues<AlertRuleConfigInternal>,
    isNew?: boolean
  ) => FormSpecification<AlertRuleConfigInternal>[] {
    const type = this.alertRuleFormSpecific.getType();
    return (
      selectorIndex: number,
      _getParentValues: UseFormGetValues<AlertRuleConfigInternal>,
      isNew?: boolean
    ) => {
      const form: FormSpecification<AlertRuleConfigInternal>[] = [
        {
          formType: "select",
          name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`,
          label: "Label",
          disabled: isNew === undefined ? true : false,
          options: this.selectorLabels.map((selectorLabel) => ({
            name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`,
            label: selectorLabel,
            value: selectorLabel,
          })),
        },
        {
          formType: "select",
          name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector`,
          label: "Selector",
          options: [
            {
              name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector`,
              label: "Optional",
              value: "opt",
            },
            {
              name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector`,
              label: "Set",
              value: "set",
            },
            {
              name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector`,
              label: "Unset",
              value: "unset",
            },
            {
              defaultValueOnOpen: "",
              form: {
                formType: "select",
                name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.eq`,
                label: "Equals",
                onWatch: (setValue, getValues) => {
                  let currentLabel = getValues(
                    `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                  );
                  const callback: WatchObserver<AlertRuleConfigInternal> = (
                    value
                  ) => {
                    const newLabel = getNestedFieldFromString(
                      value,
                      `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                    );
                    if (newLabel !== currentLabel) {
                      currentLabel = newLabel;
                      setValue(
                        `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.eq`,
                        ""
                      );
                    }
                  };
                  return callback;
                },
                options: [],
                getDynamicOptions: async (getValues) => {
                  const label = getValues(
                    `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                  );
                  const labelValues = await this.getLabelValues(label);
                  return labelValues !== undefined
                    ? labelValues.map((labelValue) => ({
                      name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.eq`,
                      label: labelValue,
                      value: labelValue,
                    }))
                    : [];
                },
              },
            },
            {
              defaultValueOnOpen: "",
              form: {
                formType: "select",
                name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.ne`,
                label: "Not equal",
                onWatch: (setValue, getValues) => {
                  let currentLabel = getValues(
                    `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                  );
                  const callback: WatchObserver<AlertRuleConfigInternal> = (
                    value
                  ) => {
                    const newLabel = getNestedFieldFromString(
                      value,
                      `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                    );
                    if (newLabel !== currentLabel) {
                      currentLabel = newLabel;
                      setValue(
                        `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.ne`,
                        ""
                      );
                    }
                  };
                  return callback;
                },
                options: [],
                getDynamicOptions: async (getValues) => {
                  const label = getValues(
                    `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                  );
                  const labelValues = await this.getLabelValues(label);
                  return labelValues !== undefined
                    ? labelValues.map((labelValue) => ({
                      name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.ne`,
                      label: labelValue,
                      value: labelValue,
                    }))
                    : [];
                },
              },
            },
            {
              defaultValueOnOpen: [],
              form: {
                formType: "select",
                name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.in`,
                label: "In",
                onWatch: (setValue, getValues) => {
                  let currentLabel = getValues(
                    `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                  );
                  const callback: WatchObserver<AlertRuleConfigInternal> = (
                    value
                  ) => {
                    const newLabel = getNestedFieldFromString(
                      value,
                      `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                    );
                    if (newLabel !== currentLabel) {
                      currentLabel = newLabel;
                      setValue(
                        `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.in`,
                        []
                      );
                    }
                  };
                  return callback;
                },
                multiple: true,
                options: [],
                getDynamicOptions: async (getValues) => {
                  const label = getValues(
                    `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                  );
                  const labelValues = await this.getLabelValues(label);
                  return labelValues !== undefined
                    ? labelValues.map((labelValue) => ({
                      name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.in`,
                      label: labelValue,
                      value: labelValue,
                    }))
                    : [];
                },
              },
            },
            {
              defaultValueOnOpen: [],
              form: {
                formType: "select",
                name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.not_in`,
                label: "Not in",
                onWatch: (setValue, getValues) => {
                  let currentLabel = getValues(
                    `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                  );
                  const callback: WatchObserver<AlertRuleConfigInternal> = (
                    value
                  ) => {
                    const newLabel = getNestedFieldFromString(
                      value,
                      `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                    );
                    if (newLabel !== currentLabel) {
                      currentLabel = newLabel;
                      setValue(
                        `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.not_in`,
                        []
                      );
                    }
                  };
                  return callback;
                },
                multiple: true,
                options: [],
                getDynamicOptions: async (getValues) => {
                  const label = getValues(
                    `${type}.${rootIndex}.common.selectors.${selectorIndex}.name`
                  );
                  const labelValues = await this.getLabelValues(label);
                  return labelValues !== undefined
                    ? labelValues.map((labelValue) => ({
                      name: `${type}.${rootIndex}.common.selectors.${selectorIndex}.selector.not_in`,
                      label: labelValue,
                      value: labelValue,
                    }))
                    : [];
                },
              },
            },
          ],
        },
      ];
      return form;
    };
  }
  private async getLabelValues(label: string): Promise<string[]> {
    const queryKey = [QueryKey.AlertRuleSelectorsLabelValues, label];
    if (this.ruleFormName === "" || label === "") {
      return [];
    }
    try {
      const oldData = this.queryClient.getQueryData<string[]>(queryKey);
      if (oldData) {
        return oldData;
      }
      const data = await getAlertRuleSelectorLabelValues(
        this.ruleFormName,
        label
      );
      this.queryClient.setQueryData(queryKey, data);
      return data;
    } catch {
      return [];
    }
  }
}

interface NewAlertFormSpecific {
  getType(): AlertRuleTemplateTypesInternal;
  getTemplateFormSpecification(): FormSpecification<NewAlertRuleTemplateInternal>[];
  getConfigsFormSpecification(
    templateForm: NewAlertRuleTemplateInternal
  ): FormSpecification<NewAlertRuleConfigInternal>[];
  getTemplateDefault(): NewAlertRuleTemplateInternal["specific"];
  getConfigDefaultValueInternal(
    templateForm: NewAlertRuleTemplateInternal
  ): NewAlertRuleConfigInternal;
  convertAlertRuleFormExternal(
    name: string,
    templateForm: NewAlertRuleTemplateInternal,
    defaultConfigForm: NewAlertRuleConfigInternal
  ): AlertRuleFormsExternal;
}

export class NewAlertForm {
  private promItems: string[];
  private alertRuleFormSpecific: NewAlertFormSpecific;

  constructor(promItems: string[]) {
    this.promItems = promItems;
    this.alertRuleFormSpecific = new NewCustomAlertForm(promItems);
  }

  getStep1FormSpecification(): FormSpecification<NewAlertRuleFormInternal>[] {
    return [
      {
        formType: "textField",
        name: "name",
        label: "Name",
      },
      {
        formType: "select",
        name: "type",
        label: "Template type",
        options: [
          {
            name: "type",
            label: "Custom",
            value: "custom",
          },
          {
            name: "type",
            label: "Fixed traces",
            value: "fixed_traces",
          },
          {
            name: "type",
            label: "Dynamic traces",
            value: "dynamic_traces",
          },
        ],
      },
    ];
  }

  updateTemplateType(templateType: AlertRuleTemplateTypesInternal) {
    if (templateType !== this.alertRuleFormSpecific.getType()) {
      if (templateType === "custom") {
        this.alertRuleFormSpecific = new NewCustomAlertForm(this.promItems);
      } else if (templateType === "fixed_traces") {
        this.alertRuleFormSpecific = new NewFixedTracesAlertForm();
      } else if (templateType === "dynamic_traces") {
        this.alertRuleFormSpecific = new NewDynamicTracesAlertForm();
      } else {
        throw Error("Template type not implemented");
      }
    }
  }

  getTemplateFormSpecification(): FormSpecification<NewAlertRuleTemplateInternal>[] {
    return [
      {
        formType: "subForm",
        name: "annotations",
        label: "Annotations",
        form: [
          {
            formType: "textField",
            name: "annotations.summary",
            label: "Summary",
            notRequired: {
              defaultValue: "",
            },
          },
          {
            formType: "textField",
            name: "annotations.description",
            label: "Description",
            notRequired: {
              defaultValue: "",
            },
          },
          {
            formType: "textField",
            name: "annotations.runbook_url",
            label: "Runbook Url",
            notRequired: {
              defaultValue: "",
            },
          },
        ],
      },
      ...this.alertRuleFormSpecific.getTemplateFormSpecification(),
    ];
  }

  getTemplateDefault(): NewAlertRuleTemplateInternal {
    return {
      annotations: {
        summary: null,
        description: null,
        runbook_url: null,
      },
      specific: this.alertRuleFormSpecific.getTemplateDefault(),
    };
  }

  getConfigsFormSpecification(
    template: NewAlertRuleTemplateInternal
  ): FormSpecification<NewAlertRuleConfigInternal>[] {
    return this.alertRuleFormSpecific.getConfigsFormSpecification(template);
  }

  getConfigDefaultValueInternal(
    templateForm: NewAlertRuleTemplateInternal
  ): NewAlertRuleConfigInternal {
    return this.alertRuleFormSpecific.getConfigDefaultValueInternal(
      templateForm
    );
  }

  convertAlertRuleFormExternal(
    name: string,
    templateForm: NewAlertRuleTemplateInternal,
    defaultConfigsForm: NewAlertRuleConfigInternal
  ): AlertRuleFormsExternal {
    return this.alertRuleFormSpecific.convertAlertRuleFormExternal(
      name,
      templateForm,
      defaultConfigsForm
    );
  }
}

class CustomAlertForm
  implements AlertFormSpecific<CustomAlertRuleFormExternal> {
  private type = "custom" as const;
  ruleForm: AlertRuleFormExternal<CustomAlertRuleFormExternal>;
  private promItems: string[];

  constructor(
    ruleForm: AlertRuleFormExternal<CustomAlertRuleFormExternal>,
    promItems: string[]
  ) {
    this.ruleForm = ruleForm;
    this.promItems = promItems;
  }

  getType() {
    return this.type;
  }

  getConfigZodElement() {
    return alertRuleConfigInternal.options[0].shape.custom.element;
  }

  convertTemplateInternal(): AlertRuleTemplateInternal["specific"] {
    let valueUnit: { dimension: string; unit: string } = {
      dimension: "dimensionless",
      unit: "",
    };
    if (this.ruleForm.template.spec.value_unit !== undefined) {
      const jsUnit = new JsUnit(this.ruleForm.template.spec.value_unit);
      valueUnit = {
        dimension: jsUnit.dimension(),
        unit: this.ruleForm.template.spec.value_unit,
      };
    }
    return {
      type: this.type,
      [this.type]: {
        item: this.ruleForm.template.spec.item,
        expr: this.ruleForm.template.spec.expr,
        valueUnit,
        params: Object.entries(this.ruleForm.template.spec.params).map(
          ([name, type]) => ({
            name,
            kind: type.kind,
            type: convertType(type.type),
          })
        ),
      },
    };
    function convertType(
      paramTypeSpec: ParamTypeSpec
    ): CustomParamTypeInternal {
      if ("prom_duration" in paramTypeSpec) {
        return "prom_duration";
      } else if ("int" in paramTypeSpec) {
        return "int";
      } else {
        return {
          quantity: {
            dimension: paramTypeSpec.quantity.dimension,
            units: paramTypeSpec.quantity.units || [],
            decimals: paramTypeSpec.quantity.decimals || null,
          },
        };
      }
    }
  }

  convertConfigsInternal(
    convertCommonConfigInternal: (
      config: AlertRuleFormExternal<CustomAlertRuleFormExternal>["configs"][""]
    ) => AlertRuleCommonConfigInternal,
    templateInternal: AlertRuleTemplateInternal
  ): AlertRuleConfigInternal {
    const configs = Object.entries(this.ruleForm.configs).map(
      ([name, config]) => ({
        name,
        common: convertCommonConfigInternal(config),
        specific: convertSpecificConfigInternal(
          templateInternal,
          config.params
        ),
      })
    );

    return {
      type: this.type,
      [this.type]: [
        {
          name: "default",
          common: convertCommonConfigInternal(this.ruleForm.template.default),
          specific: convertSpecificConfigInternal(
            templateInternal,
            this.ruleForm.template.default.params
          ),
        },
      ].concat(configs),
    };

    function convertSpecificConfigInternal(
      templateInternal: AlertRuleTemplateInternal,
      config: CustomAlertRuleFormExternal["config"]
    ): AlertRuleCustomConfigInternal {
      if (templateInternal.specific.type === "custom") {
        return {
          instance: config.instance,
          params: convertConfigParamsInternal(
            templateInternal.specific.custom.params,
            config.params
          ),
          thresholds: convertConfigThresholdInternal(
            templateInternal.specific.custom.params,
            config.thresholds
          ),
        };
      } else {
        throw Error("incompatible type");
      }

      function convertConfigParamsInternal(
        paramsTemplate: AlertRuleCustomTemplateInternal["params"],
        paramsConfig: CustomAlertRuleFormExternal["config"]["params"]
      ): AlertRuleCustomConfigInternal["params"] {
        //Set defaults
        const paramsTemplateMap: {
          [key: string]: AlertRuleCustomTemplateInternal["params"][0];
        } = {};
        const paramsInternal: AlertRuleCustomConfigInternal["params"] =
          Object.fromEntries(
            paramsTemplate
              .filter((paramTemplate) => paramTemplate.kind === "param")
              .map((paramTemplate) => {
                paramsTemplateMap[paramTemplate.name] = paramTemplate;
                if (paramTemplate.type === "int") {
                  return [paramTemplate.name, { paramType: "int", value: 0 }];
                } else if (paramTemplate.type === "prom_duration") {
                  return [
                    paramTemplate.name,
                    {
                      paramType: "prom_duration",
                      value: parseHumanReadableTime("15m"),
                    },
                  ];
                } else {
                  const defaultUnit =
                    paramTemplate.type.quantity.units.length > 0
                      ? paramTemplate.type.quantity.units[0]
                      : new JsDimension(
                        paramTemplate.type.quantity.dimension as Dimension
                      ).reference_unit();
                  return [
                    paramTemplate.name,
                    {
                      paramType: "quantity",
                      unit: defaultUnit,
                      value: parseFloat(
                        (0.0).toFixed(paramTemplate.type.quantity.decimals || 2)
                      ),
                    },
                  ];
                }
              })
          );
        Object.entries(paramsConfig).forEach(([paramName, paramValue]) => {
          const paramTemplate = paramsTemplateMap[paramName];
          if (paramTemplate === undefined) {
            return;
          }
          if (typeof paramValue === "number" && paramTemplate.type === "int") {
            paramsInternal[paramName] = { paramType: "int", value: paramValue };
          } else if (
            typeof paramValue === "string" &&
            paramTemplate.type === "prom_duration"
          ) {
            paramsInternal[paramName] = {
              paramType: "prom_duration",
              value: parseHumanReadableTime(paramValue),
            };
          } else if (
            typeof paramValue === "object" &&
            typeof paramTemplate.type === "object" &&
            "quantity" in paramTemplate.type
          ) {
            let unit = paramValue.unit;
            const jsUnit = new JsUnit(paramValue.unit);
            const units =
              paramTemplate.type.quantity.units.length > 0
                ? paramTemplate.type.quantity.units
                : new JsDimension(
                  paramTemplate.type.quantity.dimension as Dimension
                ).units();
            if (
              !units.includes(unit) &&
              paramTemplate.type.quantity.dimension !== jsUnit.dimension()
            ) {
              unit = units[0];
            }
            paramsInternal[paramName] = {
              paramType: "quantity",
              unit,
              value: parseFloat(
                paramValue.value.toFixed(
                  paramTemplate.type.quantity.decimals || 2
                )
              ),
            };
          }
        });
        return paramsInternal;
      }
      function convertConfigThresholdInternal(
        paramsTemplate: AlertRuleCustomTemplateInternal["params"],
        paramsConfig: CustomAlertRuleFormExternal["config"]["thresholds"]
      ): AlertRuleCustomConfigInternal["thresholds"] {
        //set default
        const paramsTemplateMap: {
          [key: string]: AlertRuleCustomTemplateInternal["params"][0];
        } = {};
        const thresholdInternal: AlertRuleCustomConfigInternal["thresholds"] =
          Object.fromEntries(
            paramsTemplate
              .filter((paramTemplate) => paramTemplate.kind === "threshold")
              .map((paramTemplate) => {
                paramsTemplateMap[paramTemplate.name] = paramTemplate;
                return [paramTemplate.name, { ...SEVERITIES_DEFAULT }];
              })
          );
        Object.entries(paramsConfig).forEach(([severity, paramValues]) => {
          Object.entries(paramValues).forEach(([paramName, paramValue]) => {
            const paramTemplate = paramsTemplateMap[paramName];
            if (paramTemplate === undefined) {
              return;
            }
            const severityKey = severity as Severity;
            if (
              typeof paramValue === "number" &&
              paramTemplate.type === "int"
            ) {
              thresholdInternal[paramName][severityKey] = {
                paramType: "int",
                value: paramValue,
              };
            } else if (
              typeof paramValue === "string" &&
              paramTemplate.type === "prom_duration"
            ) {
              thresholdInternal[paramName][severityKey] = {
                paramType: "prom_duration",
                value: parseHumanReadableTime(paramValue),
              };
            } else if (
              typeof paramValue === "object" &&
              typeof paramTemplate.type === "object" &&
              "quantity" in paramTemplate.type
            ) {
              let unit = paramValue.unit;
              const jsUnit = new JsUnit(paramValue.unit);
              const units =
                paramTemplate.type.quantity.units.length > 0
                  ? paramTemplate.type.quantity.units
                  : new JsDimension(
                    paramTemplate.type.quantity.dimension as Dimension
                  ).units();
              if (
                !units.includes(unit) &&
                paramTemplate.type.quantity.dimension !== jsUnit.dimension()
              ) {
                unit = units[0];
              }
              thresholdInternal[paramName][severityKey] = {
                paramType: "quantity",
                unit,
                value: parseFloat(
                  paramValue.value.toFixed(
                    paramTemplate.type.quantity.decimals || 2
                  )
                ),
              };
            }
          });
        });
        return thresholdInternal;
      }
    }
  }

  convertAlertRuleFormExternal(
    template: AlertRuleTemplateInternal,
    configsForm: AlertRuleConfigInternal,
    convertCommonConfigExternal: (
      config: AlertRuleCommonConfigInternal
    ) => Omit<
      AlertRuleFormExternal<CustomAlertRuleFormExternal>["configs"][""],
      "params"
    >
  ): AlertRuleFormsExternal {
    if (template.specific.type === "custom" && configsForm.type === "custom") {
      const paramsTemplate = template.specific.custom;
      const configs = Object.fromEntries(
        configsForm[this.type].map((config) => [
          config.name,
          {
            ...convertCommonConfigExternal(config.common),
            params: convertSpecificConfigExternal(
              config.specific,
              paramsTemplate
            ),
          },
        ])
      );
      const configDefault = configs["default"];
      const configUser = Object.fromEntries(
        Object.entries(configs).filter(([name]) => name !== "default")
      );
      return {
        [this.type]: {
          template: {
            alert: template.common.alert,
            annotations: {
              summary:
                template.common.annotations.summary === null
                  ? undefined
                  : template.common.annotations.summary,
              description:
                template.common.annotations.description === null
                  ? undefined
                  : template.common.annotations.description,
              runbook_url:
                template.common.annotations.runbook_url === null
                  ? undefined
                  : template.common.annotations.runbook_url,
            },
            default: configDefault,
            spec: {
              item: template.specific[this.type].item,
              expr: template.specific[this.type].expr,
              value_unit: template.specific[this.type].valueUnit.unit,
              params: Object.fromEntries(
                template.specific[this.type].params.map((params) => [
                  params.name,
                  {
                    kind: params.kind,
                    type: convertParamsTypeTemplateExternal(params.type),
                  },
                ])
              ),
            },
          },
          configs: configUser,
        },
      };

      function convertSpecificConfigExternal(
        specificConfig: AlertRuleCustomConfigInternal,
        template: AlertRuleCustomTemplateInternal
      ): CustomAlertRuleFormExternal["config"] {
        return {
          instance: specificConfig.instance,
          params: convertConfigParamsExternal(specificConfig.params, template),
          thresholds: convertConfigThresholdsExternal(
            specificConfig.thresholds,
            template
          ),
        };

        function convertConfigParamsExternal(
          params: AlertRuleCustomConfigInternal["params"],
          template: AlertRuleCustomTemplateInternal
        ): CustomAlertRuleFormExternal["config"]["params"] {
          const paramsTemplateMap: {
            [key: string]: AlertRuleCustomTemplateInternal["params"][0];
          } = {};
          template.params
            .filter((paramTemplate) => paramTemplate.kind === "param")
            .forEach((paramTemplate) => {
              paramsTemplateMap[paramTemplate.name] = paramTemplate;
            });
          return Object.fromEntries(
            Object.entries(params).map(([paramName, paramValue]) => {
              const paramTemplateMap = paramsTemplateMap[paramName];
              if (paramTemplateMap === undefined) {
                throw Error("Name in config does not exist in template");
              }
              if (
                paramValue.paramType === "int" &&
                paramTemplateMap.type === "int"
              ) {
                return [paramName, paramValue.value];
              } else if (
                paramValue.paramType === "prom_duration" &&
                paramTemplateMap.type === "prom_duration"
              ) {
                return [paramName, paramValue.value];
              } else if (
                paramValue.paramType === "quantity" &&
                typeof paramTemplateMap.type === "object" &&
                "quantity" in paramTemplateMap.type
              ) {
                return [
                  paramName,
                  {
                    unit: paramValue.unit,
                    value: parseFloat(
                      paramValue.value.toFixed(
                        paramTemplateMap.type.quantity.decimals || 2
                      )
                    ),
                  },
                ];
              }
              throw Error("mismatch types between template and config");
            })
          );
        }
        function convertConfigThresholdsExternal(
          thresholds: AlertRuleCustomConfigInternal["thresholds"],
          template: AlertRuleCustomTemplateInternal
        ): CustomAlertRuleFormExternal["config"]["thresholds"] {
          const paramsTemplateMap: {
            [key: string]: AlertRuleCustomTemplateInternal["params"][0];
          } = {};
          template.params
            .filter((paramTemplate) => paramTemplate.kind === "threshold")
            .forEach((paramTemplate) => {
              paramsTemplateMap[paramTemplate.name] = paramTemplate;
            });
          const thresholdsExternal: CustomAlertRuleFormExternal["config"]["thresholds"] =
            {};
          Object.entries(thresholds).forEach(([paramName, paramValues]) => {
            Object.entries(paramValues).forEach(([severity, paramValue]) => {
              const paramTemplateMap = paramsTemplateMap[paramName];
              if (paramTemplateMap === undefined) {
                throw Error("Name in config does not exist in template");
              }
              const severityKey = severity as Severity;
              if (paramValue === null) {
                return;
              }
              let newParamValue: ParamValue;
              if (
                paramValue.paramType === "int" &&
                paramTemplateMap.type === "int"
              ) {
                return paramValue.value;
              } else if (
                paramValue.paramType === "prom_duration" &&
                paramTemplateMap.type === "prom_duration"
              ) {
                newParamValue = parseToHumanReadableTime(paramValue.value);
              } else if (
                paramValue.paramType === "quantity" &&
                typeof paramTemplateMap.type === "object" &&
                "quantity" in paramTemplateMap.type
              ) {
                newParamValue = {
                  unit: paramValue.unit,
                  value: parseFloat(
                    paramValue.value.toFixed(
                      paramTemplateMap.type.quantity.decimals || 2
                    )
                  ),
                };
              } else {
                throw Error("mismatch types between template and config");
              }
              if (!(severity in thresholdsExternal)) {
                thresholdsExternal[severityKey] = {};
              }
              const formSeverity = thresholdsExternal[severityKey];
              if (formSeverity !== undefined) {
                formSeverity[paramName] = newParamValue;
              }
            });
          });
          return thresholdsExternal;
        }
      }
      function convertParamsTypeTemplateExternal(
        paramType: CustomParamTypeInternal
      ): CustomAlertRuleFormExternal["spec"]["params"][""]["type"] {
        if (paramType === "int") {
          return { int: {} };
        } else if (paramType === "prom_duration") {
          return { prom_duration: {} };
        } else {
          return {
            quantity: {
              dimension: paramType.quantity.dimension as DimensionExternal,
              units:
                paramType.quantity.units.length === 0
                  ? undefined
                  : paramType.quantity.units,
              decimals: paramType.quantity.decimals || undefined,
            },
          };
        }
      }
    }
    throw Error("incompatible type");
  }

  getTemplateFormSpecification(
    isNew?: boolean
  ): FormSpecification<AlertRuleTemplateInternal>[] {
    return [
      {
        formType: "select",
        name: "specific.custom.item",
        label: "Item",
        disabled: isNew ? false : true,
        options: this.promItems.map((promItem) => ({
          name: "specific.custom.item",
          label: promItem,
          value: promItem,
        })),
      },
      {
        formType: "textField",
        name: "specific.custom.expr",
        label: "Expression",
      },
      {
        formType: "subForm",
        name: "specific.custom.valueUnit",
        label: "Value unit",
        form: [
          {
            formType: "select",
            name: "specific.custom.valueUnit.dimension",
            label: "Dimension",
            options: JsDimension.dimensions().map((dimension) => ({
              name: "specific.custom.valueUnit.dimension",
              value: dimension.id,
              label: dimension.name,
            })),
          },
          {
            formType: "select",
            name: "specific.custom.valueUnit.unit",
            label: "Unit",
            options: [],
            getDynamicOptions: async (getValues) => {
              let dimension = getValues(
                "specific.custom.valueUnit.dimension"
              ) as Dimension;
              if (dimension === undefined) {
                if (this.ruleForm.template.spec.value_unit !== undefined) {
                  dimension = new JsUnit(
                    this.ruleForm.template.spec.value_unit
                  ).dimension();
                } else {
                  return [];
                }
              }
              return new JsDimension(dimension).units().map((unit) => ({
                name: "specific.custom.valueUnit.unit",
                label: unit,
                value: unit,
              }));
            },
            onWatch: (setValue, getValues) => {
              let currentDimension = getValues(
                "specific.custom.valueUnit.dimension"
              );
              const callback: WatchObserver<AlertRuleTemplateInternal> = (
                value
              ) => {
                const newDimension = getNestedFieldFromString(
                  value,
                  "specific.custom.valueUnit.dimension"
                );
                if (newDimension !== currentDimension) {
                  currentDimension = newDimension;
                  setValue(
                    "specific.custom.valueUnit.unit",
                    new JsDimension(newDimension).reference_unit()
                  );
                }
              };
              return callback;
            },
          },
        ],
      },
      {
        formType: "list",
        name: "specific.custom.params",
        label: "parameter",
        formGenerator: templateListFormGenerator(),
        schemaResolver: alertRuleCustomTemplateInternal.shape.params.element,
        newValueDefault: {
          name: "",
          kind: "param",
          type: {
            quantity: {
              dimension: "dimensionless",
              units: [],
              decimals: null,
            },
          },
        },
        sortingDisabled: true,
      },
    ];

    function templateListFormGenerator() {
      return (
        index: number,
        _getParentValues: UseFormGetValues<AlertRuleTemplateInternal>,
        isNew?: boolean
      ): FormSpecification<AlertRuleTemplateInternal>[] => {
        return [
          {
            formType: "textField",
            name: `specific.custom.params.${index}.name`,
            label: "Name",
            disabled: isNew === undefined ? true : false,
          },
          {
            formType: "select",
            name: `specific.custom.params.${index}.kind`,
            label: "Kind",
            options: [
              {
                name: `specific.custom.params.${index}.kind`,
                label: "Parameter",
                value: "param",
              },
              {
                name: `specific.custom.params.${index}.kind`,
                label: "Threshold",
                value: "threshold",
              },
            ],
          },
          {
            formType: "select",
            name: `specific.custom.params.${index}.type`,
            label: "Type",
            options: [
              {
                name: `specific.custom.params.${index}.type`,
                label: "Integer",
                value: "int",
              },
              {
                name: `specific.custom.params.${index}.type`,
                label: "Duration",
                value: "prom_duration",
              },
              {
                defaultValueOnOpen: {
                  dimension: "dimensionless",
                  units: [],
                  decimals: null,
                },
                form: {
                  formType: "subForm",
                  name: `specific.custom.params.${index}.type.quantity`,
                  label: "Quantity",
                  form: [
                    {
                      formType: "select",
                      name: `specific.custom.params.${index}.type.quantity.dimension`,
                      label: "Dimension",
                      options: JsDimension.dimensions().map((dimension) => ({
                        name: `specific.custom.params.${index}.type.quantity.dimension`,
                        value: dimension.id,
                        label: dimension.name,
                      })),
                    },
                    {
                      formType: "textField",
                      name: `specific.custom.params.${index}.type.quantity.decimals`,
                      label: "Decimals",
                      notRequired: {
                        defaultValue: 2,
                      },
                      number: "integer",
                    },
                    {
                      formType: "select",
                      name: `specific.custom.params.${index}.type.quantity.units`,
                      label: "Selectable units",
                      multiple: true,
                      options: [],
                      placeholder: "All",
                      getDynamicOptions: async (getValues) => {
                        const dimension = getValues(
                          `specific.custom.params.${index}.type.quantity.dimension`
                        ) as Dimension;
                        return new JsDimension(dimension)
                          .units()
                          .map((unit) => ({
                            name: `specific.custom.params.${index}.type.quantity.units`,
                            label: unit,
                            value: unit,
                          }));
                      },
                      onWatch: (setValue, getValues) => {
                        let currentDimension = getValues(
                          `specific.custom.params.${index}.type.quantity.dimension`
                        );
                        const callback: WatchObserver<
                          AlertRuleTemplateInternal
                        > = (value) => {
                          const newDimension = getNestedFieldFromString(
                            value,
                            `specific.custom.params.${index}.type.quantity.dimension`
                          );
                          if (newDimension !== currentDimension) {
                            currentDimension = newDimension;
                            setValue(
                              `specific.custom.params.${index}.type.quantity.units`,
                              []
                            );
                          }
                        };
                        return callback;
                      },
                    },
                  ],
                },
              },
            ],
          },
        ];
      };
    }
  }

  getConfigsFormSpecification(
    index: number,
    template: AlertRuleTemplateInternal
  ): FormSpecification<AlertRuleConfigInternal>[] {
    if (template.specific.type === this.type) {
      return [
        {
          formType: "select",
          name: `custom.${index}.specific.instance`,
          label: "Instance",
          options: [
            {
              name: `custom.${index}.specific.instance`,
              label: "Individual",
              value: "individual",
            },
            {
              name: `custom.${index}.specific.instance`,
              label: "Worst",
              value: "worst",
            },
            {
              name: `custom.${index}.specific.instance`,
              label: "Best",
              value: "best",
            },
          ],
        },
        {
          formType: "group",
          name: `custom.${index}.specific`,
          label: "",
          withToggle: true,
          forms: [
            {
              label: "Parameters",
              form: getParamsFormSpecification(),
            },
            {
              label: "Thresholds",
              form: getThresholdFormSpecification(),
            },
          ],
        },
      ];
      function getParamsFormSpecification(): FormSpecification<AlertRuleConfigInternal>[] {
        if (template.specific.type === "custom") {
          template.specific.custom.params
            .filter(({ kind }) => kind === "param")
            .map(({ name: paramName, type }) => {
              if (type === "int") {
                const form: FormSpecification<AlertRuleConfigInternal> = {
                  formType: "textField",
                  name: `custom.${index}.specific.params.${paramName}.value`,
                  label: paramName,
                  number: "integer",
                };
                return form;
              } else if (type === "prom_duration") {
                const form: FormSpecification<AlertRuleConfigInternal> = {
                  formType: "subForm",
                  name: `custom.${index}.specific.params.${paramName}.value`,
                  label: paramName,
                  horizontal: true,
                  form: DURATIONS.map((duration) => ({
                    formType: "textField",
                    name: `custom.${index}.specific.params.${paramName}.value.${duration}`,
                    label: duration,
                    numner: "integer",
                  })),
                };
                return form;
              } else {
                const form: FormSpecification<AlertRuleConfigInternal> = {
                  formType: "subForm",
                  name: `custom.${index}.specific.params.${paramName}`,
                  label: paramName,
                  horizontal: true,
                  form: [
                    {
                      formType: "textField",
                      name: `custom.${index}.specific.params.${paramName}.value`,
                      label: "Value",
                      number: { float: type.quantity.decimals || 2 },
                    },
                    {
                      formType: "select",
                      name: `custom.${index}.specific.params.${paramName}.unit`,
                      label: "Unit",
                      options: new JsDimension(
                        type.quantity.dimension as Dimension
                      )
                        .units()
                        .map((unit) => ({
                          name: `custom.${index}.specific.params.${paramName}.unit`,
                          label: unit,
                          value: unit,
                        })),
                    },
                  ],
                };
                return form;
              }
            });
          return [];
        } else {
          return [];
        }
      }
      function getThresholdFormSpecification(): FormSpecification<AlertRuleConfigInternal>[] {
        if (template.specific.type === "custom") {
          const form: FormSpecification<AlertRuleConfigInternal>[] =
            template.specific.custom.params
              .filter(({ kind }) => kind === "threshold")
              .map(({ name: paramName, type }) => ({
                formType: "subForm",
                name: `custom.${index}.specific.thresholds.${paramName}`,
                label: paramName,
                form: REV_SEVERITIES.map((status) => {
                  if (type === "int") {
                    const form: FormSpecification<AlertRuleConfigInternal> = {
                      formType: "textField",
                      name: `custom.${index}.specific.thresholds.${paramName}.${status}.value`,
                      label: paramName,
                      number: "integer",
                      notRequired: {
                        defaultValue: 0,
                      },
                    };
                    return form;
                  } else if (type === "prom_duration") {
                    const form: FormSpecification<AlertRuleConfigInternal> = {
                      formType: "subForm",
                      name: `custom.${index}.specific.thresholds.${paramName}.${status}.value`,
                      label: status,
                      notRequired: {
                        defaultValue: parseHumanReadableTime("15m"),
                      },
                      horizontal: true,
                      form: DURATIONS.map((duration) => ({
                        formType: "textField",
                        name: `custom.${index}.specific.thresholds.${paramName}.${status}.value.${duration}`,
                        label: duration,
                        number: "integer",
                      })),
                    };
                    return form;
                  } else {
                    const units =
                      type.quantity.units.length > 0
                        ? type.quantity.units
                        : new JsDimension(
                          type.quantity.dimension as Dimension
                        ).units();
                    const defaultUnit = units[0];
                    const form: FormSpecification<AlertRuleConfigInternal> = {
                      formType: "subForm",
                      name: `custom.${index}.specific.thresholds.${paramName}.${status}`,
                      notRequired: {
                        defaultValue: {
                          paramType: "quantity",
                          unit: defaultUnit,
                          value: 0,
                        },
                      },
                      label: status,
                      horizontal: true,
                      form: [
                        {
                          formType: "textField",
                          name: `custom.${index}.specific.thresholds.${paramName}.${status}.value`,
                          label: "Value",
                          number: { float: type.quantity.decimals || 2 },
                        },
                        {
                          formType: "select",
                          name: `custom.${index}.specific.thresholds.${paramName}.${status}.unit`,
                          label: "Unit",
                          options: units.map((unit) => ({
                            name: `custom.${index}.specific.params.${paramName}.unit`,
                            label: unit,
                            value: unit,
                          })),
                        },
                      ],
                    };
                    return form;
                  }
                }),
              }));
          return form;
        }
        return [];
      }
    }
    throw Error("incompatible type");
  }

  getConfigDefaultValueInternal(
    templateForm: AlertRuleTemplateInternal
  ): AlertRuleConfigElementInternal {
    if (templateForm.specific.type === this.type) {
      return {
        name: "",
        common: {
          for: parseHumanReadableTime("15m"),
          labels: [],
          selectors: [],
        },
        specific: {
          instance: "worst",
          params: Object.fromEntries(
            templateForm.specific.custom.params
              .filter(({ kind }) => kind === "param")
              .map(({ name, type }) => [
                name,
                type === "int"
                  ? { paramType: "int", value: 0 }
                  : type === "prom_duration"
                    ? {
                      paramType: "prom_duration",
                      value: parseHumanReadableTime("15m"),
                    }
                    : {
                      paramType: "quantity",
                      unit:
                        type.quantity.units.length > 0
                          ? type.quantity.units[0]
                          : new JsDimension(
                            type.quantity.dimension as Dimension
                          ).units()[0],
                      value: 0.0,
                    },
              ])
          ),
          thresholds: Object.fromEntries(
            templateForm.specific.custom.params
              .filter(({ kind }) => kind === "threshold")
              .map(({ name }) => [name, SEVERITIES_DEFAULT])
          ),
        },
      };
    }
    throw Error("incompatible type");
  }
}

class NewCustomAlertForm implements NewAlertFormSpecific {
  private type = "custom" as const;
  private promItems: string[];

  constructor(promItems: string[]) {
    this.promItems = promItems;
  }

  getType() {
    return this.type;
  }

  getTemplateFormSpecification(): FormSpecification<NewAlertRuleTemplateInternal>[] {
    return [
      {
        formType: "select",
        name: `specific.${this.type}.item`,
        label: "Item",
        options: this.promItems.map((promItem) => ({
          name: `specific.${this.type}.item`,
          label: promItem,
          value: promItem,
        })),
      },
      {
        formType: "textField",
        name: "specific.custom.expr",
        label: "Expression",
      },
      {
        formType: "subForm",
        name: "specific.custom.valueUnit",
        label: "Value unit",
        form: [
          {
            formType: "select",
            name: "specific.custom.valueUnit.dimension",
            label: "Dimension",
            options: JsDimension.dimensions().map((dimension) => ({
              name: "specific.custom.valueUnit.dimension",
              value: dimension.id,
              label: dimension.name,
            })),
          },
          {
            formType: "select",
            name: "specific.custom.valueUnit.unit",
            label: "Unit",
            options: [],
            getDynamicOptions: async (getValues) => {
              const dimension = (getValues(
                "specific.custom.valueUnit.dimension"
              ) || "dimensionless") as Dimension;
              return new JsDimension(dimension).units().map((unit) => ({
                name: "specific.custom.valueUnit.unit",
                label: unit,
                value: unit,
              }));
            },
            onWatch: (setValue, getValues) => {
              let currentDimension = getValues(
                "specific.custom.valueUnit.dimension"
              );
              const callback: WatchObserver<NewAlertRuleTemplateInternal> = (
                value
              ) => {
                const newDimension = getNestedFieldFromString(
                  value,
                  "specific.custom.valueUnit.dimension"
                );
                if (newDimension !== currentDimension) {
                  currentDimension = newDimension;
                  setValue(
                    "specific.custom.valueUnit.unit",
                    new JsDimension(newDimension).reference_unit()
                  );
                }
              };
              return callback;
            },
          },
        ],
      },
      {
        formType: "list",
        name: "specific.custom.params",
        label: "parameter",
        formGenerator: templateListFormGenerator(),
        schemaResolver: alertRuleCustomTemplateInternal.shape.params.element,
        newValueDefault: {
          name: "",
          kind: "param",
          type: {
            quantity: {
              dimension: "dimensionless",
              units: [],
              decimals: null,
            },
          },
        },
        sortingDisabled: true,
      },
    ];
    function templateListFormGenerator() {
      return (
        index: number,
        _getParentValues: UseFormGetValues<NewAlertRuleTemplateInternal>,
        isNew?: boolean
      ): FormSpecification<NewAlertRuleTemplateInternal>[] => {
        return [
          {
            formType: "textField",
            name: `specific.custom.params.${index}.name`,
            label: "Name",
            disabled: isNew === undefined ? true : false,
          },
          {
            formType: "select",
            name: `specific.custom.params.${index}.kind`,
            label: "Kind",
            options: [
              {
                name: `specific.custom.params.${index}.kind`,
                label: "Parameter",
                value: "param",
              },
              {
                name: `specific.custom.params.${index}.kind`,
                label: "Threshold",
                value: "threshold",
              },
            ],
          },
          {
            formType: "select",
            name: `specific.custom.params.${index}.type`,
            label: "Type",
            options: [
              {
                name: `specific.custom.params.${index}.type`,
                label: "Integer",
                value: "int",
              },
              {
                name: `specific.custom.params.${index}.type`,
                label: "Duration",
                value: "prom_duration",
              },
              {
                defaultValueOnOpen: {
                  dimension: "dimensionless",
                  units: [],
                  decimals: null,
                },
                form: {
                  formType: "subForm",
                  name: `specific.custom.params.${index}.type.quantity`,
                  label: "Quantity",
                  form: [
                    {
                      formType: "select",
                      name: `specific.custom.params.${index}.type.quantity.dimension`,
                      label: "Dimension",
                      options: JsDimension.dimensions().map((dimension) => ({
                        name: `specific.custom.params.${index}.type.quantity.dimension`,
                        value: dimension.id,
                        label: dimension.name,
                      })),
                    },
                    {
                      formType: "textField",
                      name: `specific.custom.params.${index}.type.quantity.decimals`,
                      label: "Decimals",
                      notRequired: {
                        defaultValue: 2,
                      },
                      number: "integer",
                    },
                    {
                      formType: "select",
                      name: `specific.custom.params.${index}.type.quantity.units`,
                      label: "Selectable units",
                      multiple: true,
                      options: [],
                      placeholder: "All",
                      getDynamicOptions: async (getValues) => {
                        const dimension = getValues(
                          `specific.custom.params.${index}.type.quantity.dimension`
                        ) as Dimension;
                        return new JsDimension(dimension)
                          .units()
                          .map((unit) => ({
                            name: `specific.custom.params.${index}.type.quantity.units`,
                            label: unit,
                            value: unit,
                          }));
                      },
                      onWatch: (setValue, getValues) => {
                        let currentDimension = getValues(
                          `specific.custom.params.${index}.type.quantity.dimension`
                        );
                        const callback: WatchObserver<
                          NewAlertRuleTemplateInternal
                        > = (value) => {
                          const newDimension = getNestedFieldFromString(
                            value,
                            `specific.custom.params.${index}.type.quantity.dimension`
                          );
                          if (newDimension !== currentDimension) {
                            currentDimension = newDimension;
                            setValue(
                              `specific.custom.params.${index}.type.quantity.units`,
                              []
                            );
                          }
                        };
                        return callback;
                      },
                    },
                  ],
                },
              },
            ],
          },
        ];
      };
    }
  }

  getTemplateDefault(): NewAlertRuleTemplateInternal["specific"] {
    return {
      type: this.type,
      [this.type]: {
        item: "",
        expr: "",
        params: [],
        valueUnit: {
          dimension: "dimensionless",
          unit: "",
        },
      },
    };
  }

  getConfigsFormSpecification(
    template: NewAlertRuleTemplateInternal
  ): FormSpecification<NewAlertRuleConfigInternal>[] {
    if (template.specific.type === this.type) {
      return [
        {
          formType: "select",
          name: "custom.specific.instance",
          label: "Instance",
          options: [
            {
              name: "custom.specific.instance",
              label: "Individual",
              value: "individual",
            },
            {
              name: "custom.specific.instance",
              label: "Worst",
              value: "worst",
            },
            {
              name: "custom.specific.instance",
              label: "Best",
              value: "best",
            },
          ],
        },
        {
          formType: "group",
          name: `${this.type}.specific`,
          label: "",
          withToggle: true,
          forms: [
            {
              label: "Parameters",
              form: getParamsFormSpecification(),
            },
            {
              label: "Thresholds",
              form: getThresholdFormSpecification(),
            },
          ],
        },
      ];
      function getParamsFormSpecification(): FormSpecification<NewAlertRuleConfigInternal>[] {
        if (template.specific.type === "custom") {
          return template.specific.custom.params
            .filter(({ kind }) => kind === "param")
            .map(({ name: paramName, type }) => {
              if (type === "int") {
                const form: FormSpecification<NewAlertRuleConfigInternal> = {
                  formType: "textField",
                  name: `custom.specific.params.${paramName}.value`,
                  label: paramName,
                  number: "integer",
                };
                return form;
              } else if (type === "prom_duration") {
                const form: FormSpecification<NewAlertRuleConfigInternal> = {
                  formType: "subForm",
                  name: `custom.specific.params.${paramName}.value`,
                  label: paramName,
                  horizontal: true,
                  form: DURATIONS.map((duration) => ({
                    formType: "textField",
                    name: `custom.specific.params.${paramName}.value.${duration}`,
                    label: duration,
                    number: "integer",
                  })),
                };
                return form;
              } else {
                const form: FormSpecification<NewAlertRuleConfigInternal> = {
                  formType: "subForm",
                  name: `custom.specific.params.${paramName}`,
                  label: paramName,
                  horizontal: true,
                  form: [
                    {
                      formType: "textField",
                      name: `custom.specific.params.${paramName}.value`,
                      label: "Value",
                      number: { float: type.quantity.decimals || 2 },
                    },
                    {
                      formType: "select",
                      name: `custom.specific.params.${paramName}.unit`,
                      label: "Unit",
                      options: new JsDimension(
                        type.quantity.dimension as Dimension
                      )
                        .units()
                        .map((unit) => ({
                          name: `custom.specific.params.${paramName}.unit`,
                          label: unit,
                          value: unit,
                        })),
                    },
                  ],
                };
                return form;
              }
            });
        } else {
          return [];
        }
      }
      function getThresholdFormSpecification(): FormSpecification<NewAlertRuleConfigInternal>[] {
        if (template.specific.type === "custom") {
          return template.specific.custom.params
            .filter(({ kind }) => kind === "threshold")
            .map(({ name: paramName, type }) => ({
              formType: "subForm",
              name: `custom.specific.thresholds.${paramName}`,
              label: paramName,
              form: REV_SEVERITIES.map((status) => {
                if (type === "int") {
                  const form: FormSpecification<NewAlertRuleConfigInternal> = {
                    formType: "textField",
                    name: `custom.specific.thresholds.${paramName}.${status}.value`,
                    label: paramName,
                    number: "integer",
                  };
                  return form;
                } else if (type === "prom_duration") {
                  const form: FormSpecification<NewAlertRuleConfigInternal> = {
                    formType: "subForm",
                    name: `custom.specific.thresholds.${paramName}.${status}.value`,
                    label: status,
                    notRequired: {
                      defaultValue: parseHumanReadableTime("15m"),
                    },
                    horizontal: true,
                    form: DURATIONS.map((duration) => ({
                      formType: "textField",
                      name: `custom.specific.thresholds.${paramName}.${status}.value.${duration}`,
                      label: duration,
                      number: "integer",
                    })),
                  };
                  return form;
                } else {
                  const units =
                    type.quantity.units.length > 0
                      ? type.quantity.units
                      : new JsDimension(
                        type.quantity.dimension as Dimension
                      ).units();
                  const defaultUnit = units[0];
                  const form: FormSpecification<NewAlertRuleConfigInternal> = {
                    formType: "subForm",
                    name: `custom.specific.thresholds.${paramName}.${status}`,
                    notRequired: {
                      defaultValue: {
                        paramType: "quantity",
                        value: 0,
                        unit: defaultUnit,
                      },
                    },
                    label: status,
                    horizontal: true,
                    form: [
                      {
                        formType: "textField",
                        name: `custom.specific.thresholds.${paramName}.${status}.value`,
                        label: "Value",
                        number: { float: type.quantity.decimals || 2 },
                      },
                      {
                        formType: "select",
                        name: `custom.specific.thresholds.${paramName}.${status}.unit`,
                        label: "Unit",
                        options: units.map((unit) => ({
                          name: `custom.specific.thresholds.${paramName}.${status}.unit`,
                          label: unit,
                          value: unit,
                        })),
                      },
                    ],
                  };
                  return form;
                }
              }),
            }));
        }
        return [];
      }
    }
    throw Error("incompatible type");
  }

  getConfigDefaultValueInternal(
    templateForm: NewAlertRuleTemplateInternal
  ): NewAlertRuleConfigInternal {
    if (templateForm.specific.type === this.type) {
      return {
        type: this.type,
        [this.type]: {
          duration: parseHumanReadableTime("15m"),
          specific: {
            instance: "worst",
            params: Object.fromEntries(
              templateForm.specific.custom.params
                .filter(({ kind }) => kind === "param")
                .map(({ name, type }) => [
                  name,
                  type === "int"
                    ? { paramType: "int", value: 0 }
                    : type === "prom_duration"
                      ? {
                        paramType: "prom_duration",
                        value: parseHumanReadableTime("15m"),
                      }
                      : {
                        paramType: "quantity",
                        unit:
                          type.quantity.units.length > 0
                            ? type.quantity.units[0]
                            : new JsDimension(
                              type.quantity.dimension as Dimension
                            ).reference_unit(),
                        value: 0.0,
                      },
                ])
            ),
            thresholds: Object.fromEntries(
              templateForm.specific.custom.params
                .filter(({ kind }) => kind === "threshold")
                .map(({ name }) => [name, SEVERITIES_DEFAULT])
            ),
          },
        },
      };
    }
    throw Error("incompatible type");
  }

  convertAlertRuleFormExternal(
    name: string,
    templateForm: NewAlertRuleTemplateInternal,
    defaultConfigForm: NewAlertRuleConfigInternal
  ): AlertRuleFormsExternal {
    if (
      templateForm.specific.type === this.type &&
      defaultConfigForm.type === this.type
    ) {
      return {
        [this.type]: {
          template: {
            alert: name,
            annotations: {
              summary: templateForm.annotations.summary || undefined,
              description: templateForm.annotations.description || undefined,
              runbook_url: templateForm.annotations.runbook_url || undefined,
            },
            spec: {
              item: templateForm.specific[this.type].item,
              expr: templateForm.specific[this.type].expr,
              value_unit: templateForm.specific[this.type].valueUnit.unit,
              params: Object.fromEntries(
                templateForm.specific[this.type].params.map((params) => [
                  params.name,
                  {
                    kind: params.kind,
                    type: convertParamsTypeTemplateExternal(params.type),
                  },
                ])
              ),
            },
            default: {
              for: parseToHumanReadableTime(defaultConfigForm.custom.duration),
              labels: {},
              selectors: {},
              params: convertSpecificConfigExternal(
                defaultConfigForm.custom.specific
              ),
            },
          },
          configs: {},
        },
      };

      function convertSpecificConfigExternal(
        specificConfig: AlertRuleCustomConfigInternal
      ): CustomAlertRuleFormExternal["config"] {
        return {
          instance: specificConfig.instance,
          params: convertConfigParamsExternal(specificConfig.params),
          thresholds: convertConfigThresholdsExternal(
            specificConfig.thresholds
          ),
        };

        function convertConfigParamsExternal(
          params: AlertRuleCustomConfigInternal["params"]
        ): CustomAlertRuleFormExternal["config"]["params"] {
          return Object.fromEntries(
            Object.entries(params).map(([paramName, paramValue]) => {
              if (paramValue.paramType === "int") {
                return [paramName, paramValue.value];
              } else if (paramValue.paramType === "prom_duration") {
                return [paramName, paramValue.value];
              } else {
                return [
                  paramName,
                  {
                    unit: paramValue.unit,
                    value: paramValue.value,
                  },
                ];
              }
            })
          );
        }
        function convertConfigThresholdsExternal(
          thresholds: AlertRuleCustomConfigInternal["thresholds"]
        ): CustomAlertRuleFormExternal["config"]["thresholds"] {
          const thresholdsExternal: CustomAlertRuleFormExternal["config"]["thresholds"] =
            {};
          Object.entries(thresholds).forEach(([paramName, paramValues]) => {
            Object.entries(paramValues).forEach(([severity, paramValue]) => {
              const severityKey = severity as Severity;
              if (paramValue === null) {
                return;
              }
              let newParamValue: ParamValue;
              if (paramValue.paramType === "int") {
                return paramValue.value;
              } else if (paramValue.paramType === "prom_duration") {
                newParamValue = parseToHumanReadableTime(paramValue.value);
              } else {
                newParamValue = {
                  unit: paramValue.unit,
                  value: paramValue.value,
                };
              }
              if (!(severity in thresholdsExternal)) {
                thresholdsExternal[severityKey] = {};
              }
              const formSeverity = thresholdsExternal[severityKey];
              if (formSeverity !== undefined) {
                formSeverity[paramName] = newParamValue;
              }
            });
          });
          return thresholdsExternal;
        }
      }
      function convertParamsTypeTemplateExternal(
        paramType: CustomParamTypeInternal
      ): CustomAlertRuleFormExternal["spec"]["params"][""]["type"] {
        if (paramType === "int") {
          return { int: {} };
        } else if (paramType === "prom_duration") {
          return { prom_duration: {} };
        } else {
          return {
            quantity: {
              dimension: paramType.quantity.dimension as DimensionExternal,
              units:
                paramType.quantity.units.length === 0
                  ? undefined
                  : paramType.quantity.units,
              decimals: paramType.quantity.decimals || undefined,
            },
          };
        }
      }
    }
    throw Error("incompatible type");
  }
}

class FixedTracesAlertForm
  implements AlertFormSpecific<FixedTracesAlertRuleFormExternal> {
  private type = "fixed_traces" as const;
  ruleForm: AlertRuleFormExternal<FixedTracesAlertRuleFormExternal>;

  constructor(
    ruleForm: AlertRuleFormExternal<FixedTracesAlertRuleFormExternal>
  ) {
    this.ruleForm = ruleForm;
  }

  getType() {
    return this.type;
  }

  getConfigZodElement() {
    return alertRuleConfigInternal.options[1].shape.fixed_traces.element;
  }

  convertTemplateInternal(): AlertRuleTemplateInternal["specific"] {
    return {
      type: this.type,
      [this.type]: {
        item: "operation",
        metric: this.ruleForm.template.spec.metric,
        param: this.ruleForm.template.spec.param,
        interval: this.ruleForm.template.spec.interval,
      },
    };
  }

  convertConfigsInternal(
    convertCommonConfigInternal: (
      config: AlertRuleFormExternal<FixedTracesAlertRuleFormExternal>["configs"][""]
    ) => AlertRuleCommonConfigInternal
  ): AlertRuleConfigInternal {
    const configs = Object.entries(this.ruleForm.configs).map(
      ([name, config]) => ({
        name,
        common: convertCommonConfigInternal(config),
        specific: this.convertConfigForm(config.params),
      })
    );
    return {
      type: this.type,
      [this.type]: [
        {
          name: "default",
          common: convertCommonConfigInternal(this.ruleForm.template.default),
          specific: this.convertConfigForm(
            this.ruleForm.template.default.params
          ),
        },
      ].concat(configs),
    };
  }

  convertAlertRuleFormExternal(
    template: AlertRuleTemplateInternal,
    configsForm: AlertRuleConfigInternal,
    convertCommonConfigExternal: (
      config: AlertRuleCommonConfigInternal
    ) => Omit<
      AlertRuleFormExternal<FixedTracesAlertRuleFormExternal>["configs"][""],
      "params"
    >
  ): AlertRuleFormsExternal {
    if (
      template.specific.type === this.type &&
      configsForm.type === this.type
    ) {
      const configs = Object.fromEntries(
        configsForm[this.type].map((config) => [
          config.name,
          {
            ...convertCommonConfigExternal(config.common),
            params: this.convertConfigAlertRuleForm(config.specific),
          },
        ])
      );
      const configDefault = configs["default"];
      const configUser = Object.fromEntries(
        Object.entries(configs).filter(([name]) => name !== "default")
      );
      return {
        [this.type]: {
          template: {
            alert: template.common.alert,
            annotations: {
              summary:
                template.common.annotations.summary === null
                  ? undefined
                  : template.common.annotations.summary,
              description:
                template.common.annotations.description === null
                  ? undefined
                  : template.common.annotations.description,
              runbook_url:
                template.common.annotations.runbook_url === null
                  ? undefined
                  : template.common.annotations.runbook_url,
            },
            default: configDefault,
            spec: {
              item: template.specific[this.type].item,
              metric: template.specific[this.type].metric,
              interval: template.specific[this.type].interval,
              param: template.specific[this.type].param,
            },
          },
          configs: configUser,
        },
      };
    }
    throw Error("incompatible type");
  }

  getTemplateFormSpecification(
    isNew?: boolean
  ): FormSpecification<AlertRuleTemplateInternal>[] {
    return [
      {
        formType: "select",
        name: "specific.fixed_traces.item",
        label: "Item",
        disabled: isNew ? false : true,
        options: [
          {
            name: "specific.fixed_traces.item",
            label: "Operation",
            value: "operation",
          },
        ],
      },
      {
        formType: "select",
        name: "specific.fixed_traces.metric",
        label: "Metric",
        options: [
          {
            name: "specific.fixed_traces.metric",
            label: "Duration",
            value: "duration",
          },
          {
            name: "specific.fixed_traces.metric",
            label: "Busy",
            value: "busy",
          },
          {
            name: "specific.fixed_traces.metric",
            label: "Call rate",
            value: "call_rate",
          },
          {
            name: "specific.fixed_traces.metric",
            label: "Error rate",
            value: "error_rate",
          },
        ],
      },
      {
        formType: "select",
        name: "specific.fixed_traces.param",
        label: "Parameter",
        options: [
          {
            name: "specific.fixed_traces.param",
            label: "Mean",
            value: "mean",
          },
          {
            name: "specific.fixed_traces.param",
            label: "Higher Bound",
            value: "higher_bound",
          },
          {
            name: "specific.fixed_traces.param",
            label: "Lower Bound",
            value: "lower_bound",
          },
        ],
      },
      {
        formType: "select",
        name: "specific.fixed_traces.interval",
        label: "Interval",
        options: [
          {
            name: "specific.fixed_traces.interval",
            value: "5m",
            label: "5m",
          },
          {
            name: "specific.fixed_traces.interval",
            value: "15m",
            label: "15m",
          },
        ],
      },
    ];
  }

  getConfigsFormSpecification(
    index: number,
    template: AlertRuleTemplateInternal
  ): FormSpecification<AlertRuleConfigInternal>[] {
    if (template.specific.type === this.type) {
      return [
        {
          formType: "textField",
          name: `${this.type}.${index}.specific.quantile`,
          label: "Quantile",
          number: { float: 1 },
        },
        {
          formType: "subForm",
          name: `${this.type}.${index}.specific.thresholds`,
          label: "Treshold",
          form: REV_SEVERITIES.map((status) => ({
            formType: "textField",
            name: `${this.type}.${index}.specific.thresholds.${status}`,
            label: "Major",
            notRequired: {
              defaultValue: 0.1,
            },
            number: { float: 1 },
          })),
        },
      ];
    }
    throw Error("incompatible type");
  }

  getConfigDefaultValueInternal(
    templateForm: AlertRuleTemplateInternal
  ): AlertRuleConfigElementInternal {
    if (templateForm.specific.type === this.type) {
      return {
        name: "",
        common: {
          for: parseHumanReadableTime("15m"),
          labels: [],
          selectors: [],
        },
        specific: {
          quantile: 0.95,
          thresholds: SEVERITIES_DEFAULT,
        },
      };
    }
    throw Error("incompatible type");
  }

  private convertConfigForm(
    config: FixedTracesAlertRuleFormExternal["config"]
  ): AlertRuleFixedTracesConfigInternal {
    return {
      quantile: config.quantile,
      thresholds: this.convertThresholds(config.thresholds),
    };
  }
  private convertThresholds(
    thresholds: FixedTracesAlertRuleFormExternal["config"]["thresholds"]
  ): AlertRuleFixedTracesConfigInternal["thresholds"] {
    const thresholdsConverted: AlertRuleFixedTracesConfigInternal["thresholds"] =
    {
      ...SEVERITIES_DEFAULT,
    };
    Object.entries(thresholds).forEach(([severity, paramValue]) => {
      const severityKey = severity as Severity;
      if (paramValue === undefined) {
        thresholdsConverted[severityKey] = null;
      } else {
        thresholdsConverted[severityKey] = paramValue;
      }
    });
    return thresholdsConverted;
  }

  private convertConfigAlertRuleForm(
    config: AlertRuleFixedTracesConfigInternal
  ): FixedTracesAlertRuleFormExternal["config"] {
    return {
      quantile: config.quantile,
      thresholds: this.convertThresholdsAlertRuleForm(config.thresholds),
    };
  }
  private convertThresholdsAlertRuleForm(
    thresholds: AlertRuleFixedTracesConfigInternal["thresholds"]
  ): FixedTracesAlertRuleFormExternal["config"]["thresholds"] {
    const thresholdsConverted: FixedTracesAlertRuleFormExternal["config"]["thresholds"] =
    {
      major: undefined,
      critical: undefined,
      warning: undefined,
      minor: undefined,
    };
    Object.entries(thresholds).forEach(([severity, paramValue]) => {
      const severityKey = severity as Severity;
      if (paramValue === null) {
        thresholdsConverted[severityKey] = undefined;
      } else {
        thresholdsConverted[severityKey] = paramValue;
      }
    });
    return thresholdsConverted;
  }
}

class NewFixedTracesAlertForm implements NewAlertFormSpecific {
  private type = "fixed_traces" as const;

  getType() {
    return this.type;
  }

  getTemplateFormSpecification(): FormSpecification<NewAlertRuleTemplateInternal>[] {
    return [
      {
        formType: "select",
        name: "specific.fixed_traces.item",
        label: "Item",
        options: [
          {
            name: "specific.fixed_traces.item",
            label: "Operation",
            value: "operation",
          },
        ],
      },
      {
        formType: "select",
        name: "specific.fixed_traces.metric",
        label: "Metric",
        options: [
          {
            name: "specific.fixed_traces.metric",
            label: "Duration",
            value: "duration",
          },
          {
            name: "specific.fixed_traces.metric",
            label: "Busy",
            value: "busy",
          },
          {
            name: "specific.fixed_traces.metric",
            label: "Call rate",
            value: "call_rate",
          },
          {
            name: "specific.fixed_traces.metric",
            label: "Error rate",
            value: "error_rate",
          },
        ],
      },
      {
        formType: "select",
        name: "specific.fixed_traces.param",
        label: "Parameter",
        options: [
          {
            name: "specific.fixed_traces.param",
            label: "Mean",
            value: "mean",
          },
          {
            name: "specific.fixed_traces.param",
            label: "Higher Bound",
            value: "higher_bound",
          },
          {
            name: "specific.fixed_traces.param",
            label: "Lower Bound",
            value: "lower_bound",
          },
        ],
      },
      {
        formType: "select",
        name: "specific.fixed_traces.interval",
        label: "Interval",
        options: [
          {
            name: "specific.fixed_traces.interval",
            value: "5m",
            label: "5m",
          },
          {
            name: "specific.fixed_traces.interval",
            value: "15m",
            label: "15m",
          },
        ],
      },
    ];
  }

  getTemplateDefault(): NewAlertRuleTemplateInternal["specific"] {
    return {
      type: this.type,
      [this.type]: {
        item: "operation",
        metric: "duration",
        param: "mean",
        interval: "15m",
      },
    };
  }

  getConfigsFormSpecification(): FormSpecification<NewAlertRuleConfigInternal>[] {
    return [
      {
        formType: "textField",
        name: `${this.type}.specific.quantile`,
        label: "Quantile",
        number: { float: 1 },
      },
      {
        formType: "subForm",
        name: `${this.type}.specific.thresholds`,
        label: "Treshold",
        form: REV_SEVERITIES.map((status) => ({
          formType: "textField",
          name: `${this.type}.specific.thresholds.${status}`,
          label: status,
          notRequired: {
            defaultValue: 1,
          },
          number: { float: 1 },
        })),
      },
    ];
  }

  getConfigDefaultValueInternal(): NewAlertRuleConfigInternal {
    return {
      type: this.type,
      [this.type]: {
        duration: parseHumanReadableTime("15m"),
        specific: {
          quantile: 0.99,
          thresholds: SEVERITIES_DEFAULT,
        },
      },
    };
  }

  convertAlertRuleFormExternal(
    name: string,
    templateForm: NewAlertRuleTemplateInternal,
    defaultConfigForm: NewAlertRuleConfigInternal
  ): AlertRuleFormsExternal {
    if (
      templateForm.specific.type === this.type &&
      defaultConfigForm.type === this.type
    ) {
      return {
        [this.type]: {
          template: {
            alert: name,
            annotations: {
              summary: templateForm.annotations.summary || undefined,
              description: templateForm.annotations.description || undefined,
              runbook_url: templateForm.annotations.runbook_url || undefined,
            },
            spec: {
              item: templateForm.specific[this.type].item,
              metric: templateForm.specific[this.type].metric,
              interval: templateForm.specific[this.type].interval,
              param: templateForm.specific[this.type].param,
            },
            default: {
              for: parseToHumanReadableTime(
                defaultConfigForm[this.type].duration
              ),
              labels: {},
              selectors: {},
              params: {
                quantile: defaultConfigForm[this.type].specific.quantile,
                thresholds: this.convertThresholdsAlertRuleForm(
                  defaultConfigForm[this.type].specific.thresholds
                ),
              },
            },
          },
          configs: {},
        },
      };
    }
    throw Error("incompatible type");
  }

  private convertThresholdsAlertRuleForm(
    thresholds: AlertRuleFixedTracesConfigInternal["thresholds"]
  ): FixedTracesAlertRuleFormExternal["config"]["thresholds"] {
    const thresholdsConverted: FixedTracesAlertRuleFormExternal["config"]["thresholds"] =
    {
      major: undefined,
      critical: undefined,
      warning: undefined,
      minor: undefined,
    };
    Object.entries(thresholds).forEach(([severity, paramValue]) => {
      const severityKey = severity as Severity;
      if (paramValue === null) {
        thresholdsConverted[severityKey] = undefined;
      } else {
        thresholdsConverted[severityKey] = paramValue;
      }
    });
    return thresholdsConverted;
  }
}

class DynamicTracesAlertForm
  implements AlertFormSpecific<DynamicTracesAlertRuleFormExternal> {
  private type = "dynamic_traces" as const;
  ruleForm: AlertRuleFormExternal<DynamicTracesAlertRuleFormExternal>;

  constructor(
    ruleForm: AlertRuleFormExternal<DynamicTracesAlertRuleFormExternal>
  ) {
    this.ruleForm = ruleForm;
  }

  getType() {
    return this.type;
  }

  getConfigZodElement() {
    return alertRuleConfigInternal.options[2].shape.dynamic_traces.element;
  }

  convertTemplateInternal(): AlertRuleTemplateInternal["specific"] {
    return {
      type: this.type,
      [this.type]: {
        item: this.ruleForm.template.spec.item,
        metric: this.ruleForm.template.spec.metric,
        short_term_interval: this.ruleForm.template.spec.short_term_interval,
        long_term_interval: this.ruleForm.template.spec.long_term_interval,
      },
    };
  }

  convertConfigsInternal(
    convertCommonConfigInternal: (
      config: AlertRuleFormExternal<DynamicTracesAlertRuleFormExternal>["configs"][""]
    ) => AlertRuleCommonConfigInternal
  ): AlertRuleConfigInternal {
    const configs = Object.entries(this.ruleForm.configs).map(
      ([name, config]) => ({
        name,
        common: convertCommonConfigInternal(config),
        specific: this.convertConfigForm(config.params),
      })
    );
    return {
      type: this.type,
      [this.type]: [
        {
          name: "default",
          common: convertCommonConfigInternal(this.ruleForm.template.default),
          specific: this.convertConfigForm(
            this.ruleForm.template.default.params
          ),
        },
      ].concat(configs),
    };
  }

  convertAlertRuleFormExternal(
    template: AlertRuleTemplateInternal,
    configsForm: AlertRuleConfigInternal,
    convertCommonConfigExternal: (
      config: AlertRuleCommonConfigInternal
    ) => Omit<
      AlertRuleFormExternal<FixedTracesAlertRuleFormExternal>["configs"][""],
      "params"
    >
  ): AlertRuleFormsExternal {
    if (
      template.specific.type === this.type &&
      configsForm.type === this.type
    ) {
      const configs = Object.fromEntries(
        configsForm[this.type].map((config) => [
          config.name,
          {
            ...convertCommonConfigExternal(config.common),
            params: this.convertConfigAlertRuleForm(config.specific),
          },
        ])
      );
      const configDefault = configs["default"];
      const configUser = Object.fromEntries(
        Object.entries(configs).filter(([name]) => name !== "default")
      );
      return {
        [this.type]: {
          template: {
            alert: template.common.alert,
            annotations: {
              summary:
                template.common.annotations.summary === null
                  ? undefined
                  : template.common.annotations.summary,
              description:
                template.common.annotations.description === null
                  ? undefined
                  : template.common.annotations.description,
              runbook_url:
                template.common.annotations.runbook_url === null
                  ? undefined
                  : template.common.annotations.runbook_url,
            },
            default: configDefault,
            spec: {
              item: template.specific[this.type].item,
              metric: template.specific[this.type].metric,
              short_term_interval: template.specific[this.type].short_term_interval,
              long_term_interval: template.specific[this.type].long_term_interval,
            },
          },
          configs: configUser,
        },
      };
    }
    throw Error("incompatible type");
  }

  getTemplateFormSpecification(
    isNew?: boolean
  ): FormSpecification<AlertRuleTemplateInternal>[] {
    return [
      {
        formType: "select",
        name: "specific.dynamic_traces.item",
        label: "Item",
        disabled: isNew ? false : true,
        options: [
          {
            name: "specific.dynamic_traces.item",
            label: "Operation",
            value: "operation",
          },
          {
            defaultValueOnOpen: 0.5,
            form: {
              formType: "textField",
              name: "specific.dynamic_traces.item.service.combine",
              label: "Combination Factor",
              number: { float: 2 }
            },
          },
        ],
      },
      {
        formType: "select",
        name: "specific.dynamic_traces.metric",
        label: "Metric",
        options: [
          {
            name: "specific.dynamic_traces.metric",
            label: "Duration",
            value: "duration",
          },
          {
            name: "specific.dynamic_traces.metric",
            label: "Busy",
            value: "busy",
          },
          {
            name: "specific.dynamic_traces.metric",
            label: "Call rate",
            value: "call_rate",
          },
          {
            name: "specific.dynamic_traces.metric",
            label: "Error rate",
            value: "error_rate",
          },
        ],
      },
      {
        formType: "select",
        name: "specific.dynamic_traces.short_term_interval",
        label: "Short Term Interval",
        options: ["5m", "15m"].map(option => ({
          name: "specific.dynamic_traces.short_term_interval",
          label: option,
          value: option,
        }))
      },
      {
        formType: "select",
        name: "specific.dynamic_traces.long_term_interval",
        label: "Long Term Interval",
        options: ["7d", "30d"].map(option => ({
          name: "specific.dynamic_traces.long_term_interval",
          label: option,
          value: option,
        }))
      },
    ];
  }

  getConfigsFormSpecification(
    index: number,
    template: AlertRuleTemplateInternal
  ): FormSpecification<AlertRuleConfigInternal>[] {
    if (template.specific.type === this.type) {
      return [
        {
          formType: "textField",
          name: `${this.type}.${index}.specific.offset`,
          label: "Offset",
          number: { float: 1 },
        },
        {
          formType: "subForm",
          name: `${this.type}.${index}.specific.thresholds`,
          label: "Treshold",
          form: REV_SEVERITIES.map((status) => ({
            formType: "textField",
            name: `${this.type}.${index}.specific.thresholds.${status}`,
            label: status,
            notRequired: {
              defaultValue: 0,
            },
            number: { float: 1 },
          })),
        },
      ];
    }
    throw Error("incompatible type");
  }

  getConfigDefaultValueInternal(
    templateForm: AlertRuleTemplateInternal
  ): AlertRuleConfigElementInternal {
    if (templateForm.specific.type === this.type) {
      return {
        name: "",
        common: {
          for: parseHumanReadableTime("15m"),
          labels: [],
          selectors: [],
        },
        specific: {
          offset: 1,
          thresholds: SEVERITIES_DEFAULT,
        },
      };
    }
    throw Error("incompatible type");
  }

  private convertConfigForm(
    config: DynamicTracesAlertRuleFormExternal["config"]
  ): AlertRuleDynamicTracesConfigInternal {
    return {
      offset: config.offset,
      thresholds: this.convertThresholdsForm(config.thresholds),
    };
  }
  private convertThresholdsForm(
    thresholds: DynamicTracesAlertRuleFormExternal["config"]["thresholds"]
  ): AlertRuleDynamicTracesConfigInternal["thresholds"] {
    const thresholdsConverted: AlertRuleDynamicTracesConfigInternal["thresholds"] =
    {
      ...SEVERITIES_DEFAULT,
    };
    Object.entries(thresholds).forEach(([severity, paramValue]) => {
      const severityKey = severity as Severity;
      if (paramValue === undefined) {
        thresholdsConverted[severityKey] = null;
      } else {
        thresholdsConverted[severityKey] = paramValue;
      }
    });
    return thresholdsConverted;
  }

  private convertConfigAlertRuleForm(
    config: AlertRuleDynamicTracesConfigInternal
  ): DynamicTracesAlertRuleFormExternal["config"] {
    return {
      offset: config.offset,
      thresholds: this.convertThresholdsAlertRuleForm(config.thresholds),
    };
  }
  private convertThresholdsAlertRuleForm(
    thresholds: AlertRuleDynamicTracesConfigInternal["thresholds"]
  ): DynamicTracesAlertRuleFormExternal["config"]["thresholds"] {
    const thresholdsConverted: DynamicTracesAlertRuleFormExternal["config"]["thresholds"] =
    {
      major: undefined,
      critical: undefined,
      warning: undefined,
      minor: undefined,
    };
    Object.entries(thresholds).forEach(([severity, paramValue]) => {
      const severityKey = severity as Severity;
      if (paramValue === null) {
        thresholdsConverted[severityKey] = undefined;
      } else {
        thresholdsConverted[severityKey] = paramValue;
      }
    });
    return thresholdsConverted;
  }
}

class NewDynamicTracesAlertForm implements NewAlertFormSpecific {
  private type = "dynamic_traces" as const;

  getType() {
    return this.type;
  }

  getTemplateFormSpecification(): FormSpecification<NewAlertRuleTemplateInternal>[] {
    return [
      {
        formType: "select",
        name: "specific.dynamic_traces.item",
        label: "Item",

        options: [
          {
            name: "specific.dynamic_traces.item",
            label: "Operation",
            value: "operation",
          },
          {
            defaultValueOnOpen: 0.5,
            form: {
              formType: "textField",
              name: "specific.dynamic_traces.item.service.combine",
              label: "Combination Factor",
              number: { float: 2 }
            },
          },
        ],
      },
      {
        formType: "select",
        name: "specific.dynamic_traces.metric",
        label: "Metric",
        options: [
          {
            name: "specific.dynamic_traces.metric",
            label: "Duration",
            value: "duration",
          },
          {
            name: "specific.dynamic_traces.metric",
            label: "Busy",
            value: "busy",
          },
          {
            name: "specific.dynamic_traces.metric",
            label: "Call rate",
            value: "call_rate",
          },
          {
            name: "specific.dynamic_traces.metric",
            label: "Error rate",
            value: "error_rate",
          },
        ],
      },
      {
        formType: "select",
        name: "specific.dynamic_traces.short_term_interval",
        label: "Short Term Interval",
        options: ["5m", "15m"].map(option => ({
          name: "specific.dynamic_traces.short_term_interval",
          label: option,
          value: option,
        }))
      },
      {
        formType: "select",
        name: "specific.dynamic_traces.long_term_interval",
        label: "Long Term Interval",
        options: ["7d", "30d"].map(option => ({
          name: "specific.dynamic_traces.long_term_interval",
          label: option,
          value: option,
        }))
      },
    ];
  }

  getTemplateDefault(): NewAlertRuleTemplateInternal["specific"] {
    return {
      type: this.type,
      [this.type]: {
        item: "operation",
        metric: "duration",
        short_term_interval: "15m",
        long_term_interval: "7d",
      },
    };
  }

  getConfigsFormSpecification(): FormSpecification<NewAlertRuleConfigInternal>[] {
    return [
      {
        formType: "textField",
        name: `${this.type}.specific.offset`,
        label: "Offset",
        number: { float: 1 },
      },
      {
        formType: "subForm",
        name: `${this.type}.specific.thresholds`,
        label: "Treshold",
        form: REV_SEVERITIES.map((status) => ({
          formType: "textField",
          name: `${this.type}.specific.thresholds.${status}`,
          label: status,
          notRequired: {
            defaultValue: 0,
          },
          number: { float: 1 },
        })),
      },
    ];
  }

  getConfigDefaultValueInternal(): NewAlertRuleConfigInternal {
    return {
      type: this.type,
      [this.type]: {
        duration: parseHumanReadableTime("15m"),
        specific: {
          offset: 1,
          thresholds: SEVERITIES_DEFAULT,
        },
      },
    };
  }

  convertAlertRuleFormExternal(
    name: string,
    templateForm: NewAlertRuleTemplateInternal,
    defaultConfigForm: NewAlertRuleConfigInternal
  ): AlertRuleFormsExternal {
    if (
      templateForm.specific.type === this.type &&
      defaultConfigForm.type === this.type
    ) {
      return {
        [this.type]: {
          template: {
            alert: name,
            annotations: {
              summary: templateForm.annotations.summary || undefined,
              description: templateForm.annotations.description || undefined,
              runbook_url: templateForm.annotations.runbook_url || undefined,
            },
            spec: {
              item: templateForm.specific[this.type].item,
              metric: templateForm.specific[this.type].metric,
              short_term_interval: templateForm.specific[this.type].short_term_interval,
              long_term_interval: templateForm.specific[this.type].long_term_interval,
            },
            default: {
              for: parseToHumanReadableTime(
                defaultConfigForm[this.type].duration
              ),
              labels: {},
              selectors: {},
              params: {
                offset: defaultConfigForm[this.type].specific.offset,
                thresholds: this.convertThresholdsAlertRuleForm(
                  defaultConfigForm[this.type].specific.thresholds
                ),
              },
            },
          },
          configs: {},
        },
      };
    }
    throw Error("incompatible type");
  }

  private convertThresholdsAlertRuleForm(
    thresholds: AlertRuleDynamicTracesConfigInternal["thresholds"]
  ): DynamicTracesAlertRuleFormExternal["config"]["thresholds"] {
    const thresholdsConverted: DynamicTracesAlertRuleFormExternal["config"]["thresholds"] =
    {
      major: undefined,
      critical: undefined,
      warning: undefined,
      minor: undefined,
    };
    Object.entries(thresholds).forEach(([severity, paramValue]) => {
      const severityKey = severity as Severity;
      if (paramValue === null) {
        thresholdsConverted[severityKey] = undefined;
      } else {
        thresholdsConverted[severityKey] = paramValue;
      }
    });
    return thresholdsConverted;
  }
}
