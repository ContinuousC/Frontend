/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import {
  Path,
  PathValue,
  FieldValues,
  UseFormGetValues,
  UseFormSetValue,
  WatchObserver,
  ArrayPath,
} from "react-hook-form";
import { z } from "zod";
import { TOPOLOGY_LIMIT } from "../constants";
import {
  Dimension,
  JsAlertRuleTypes,
  JsAnnotationTemplate,
  JsExprSpec,
  ParamTypeMap,
} from "@continuousc/relation-graph";

export type FormSpecification<
  T extends FieldValues,
  P extends Path<T> = Path<T>,
> = FormGenericProps &
  (
    | (FormInputProps<T, P> &
      (
        | ({
          formType: "textField";
        } & TextFieldFormControllerProps)
        | ({
          formType: "select";
        } & SelectFormControllerProps<T, P>)
        | {
          formType: "toggle";
        }
        | ({
          formType: "subForm";
        } & SubFormControllerProps<T, P>)
      ))
    | ({
      formType: "list";
    } & ListFormControllerProps<T, P>)
    | ({
      formType: "group";
    } & GroupFormControllerProps<T, P>)
  );

export interface FormGenericProps {
  label: string;
  title?: string;
  disabled?: boolean;
}
export interface FormInputProps<
  T extends FieldValues,
  P extends Path<T> = Path<T>,
> {
  name: P;
  notRequired?: {
    defaultValue: PathValue<T, P>;
    setText?: string;
    unsetText?: string;
  };
  onWatch?: (
    setValue: UseFormSetValue<T>,
    getValues: UseFormGetValues<T>
  ) => WatchObserver<T>;
}
export interface TextFieldFormControllerProps {
  number?: "integer" | { float: number };
}
export interface SelectFormControllerProps<
  T extends FieldValues,
  P extends Path<T> = Path<T>,
> {
  options: SelectOptions<T, P>;
  multiple?: boolean;
  placeholder?: string;
  getDynamicOptions?: (
    getValues: UseFormGetValues<T>
  ) => Promise<SelectOptions<T, P>>;
}
export type SelectOptions<
  T extends FieldValues,
  P extends Path<T> = Path<T>,
> = SelectOption<T, P>[];
export type SelectOption<T extends FieldValues, P extends Path<T> = Path<T>> =
  | SelectOptionForm<T, P>
  | SelectOptionValue<T, P>;
export type SelectOptionForm<
  T extends FieldValues,
  P extends Path<T> = Path<T>,
> = {
  defaultValueOnOpen: PathValue<T, P>;
  form: FormSpecification<T, P>;
};
export interface SelectOptionValue<
  T extends FieldValues,
  P extends Path<T> = Path<T>,
> {
  name: P;
  label: string;
  value: string;
}
export interface SubFormControllerProps<
  T extends FieldValues,
  P extends Path<T> = Path<T>,
> {
  form: FormSpecification<T, P>[];
  horizontal?: boolean;
}
export type ListFormControllerProps<
  T extends FieldValues,
  P extends Path<T> = Path<T>,
> = {
  name: ArrayPath<T>;
  formGenerator: (
    index: number,
    getValues: UseFormGetValues<T>,
    isNew?: boolean
  ) => FormSpecification<T, P>[];
  newValueDefault: PathValue<T, P>;
  schemaResolver: z.AnyZodObject;
  sortingDisabled?: boolean;
  emptyLabel?: string;
  addLabel?: string;
  updateDynamiclyDisabled?: { [name: string]: { formExcluded?: boolean } };
} & Exclude<FormInputProps<T, P>, "name">;
export interface GroupFormControllerProps<
  T extends FieldValues,
  P extends Path<T> = Path<T>,
> {
  name: string;
  forms: {
    label: string;
    form: FormSpecification<T, P>[];
    horizontal?: boolean;
  }[];
  withToggle?: boolean;
}

//Zod
//generics
const name = z
  .string()
  .min(1)
  .trim()
  .regex(/[a-zA-Z_][a-zA-Z0-9_]*/);
const anyString = z.string().min(1);
const durationObject = z.object({
  milliseconds: z.number(),
  seconds: z.number(),
  minutes: z.number(),
  hours: z.number(),
  days: z.number(),
  weeks: z.number(),
  years: z.number(),
});
export const newSimpleListElement = z.array(z.object({ name: z.string() }));
export const alertRuleTemplateTypesInternal = z.enum([
  "custom",
  "fixed_traces",
  "dynamic_traces",
]);
export type AlertRuleTemplateTypesInternal = z.infer<
  typeof alertRuleTemplateTypesInternal
>;

//Alert
//Common
const alertRuleCommonTemplateInternal = z.object({
  alert: name,
  annotations: z.object({
    summary: anyString.nullable(),
    description: anyString.nullable(),
    runbook_url: anyString.nullable(),
  }),
});
export const alertRuleCommonConfigInternal = z.object({
  for: durationObject,
  labels: z.array(
    z.object({
      name: name,
      value: z.string(),
    })
  ),
  selectors: z.array(
    z.object({
      name: name,
      selector: z.union([
        z.literal("opt"),
        z.literal("set"),
        z.literal("unset"),
        z.object({ eq: z.string() }),
        z.object({ ne: z.string() }),
        z.object({ in: z.array(z.string()) }),
        z.object({ not_in: z.array(z.string()) }),
      ]),
    })
  ),
});

//Custom
//TODO zod refine validation
// expression (for expression where all parameters should be defined + for parameters match the type in the expression)
// annotations
export const alertRuleCustomTemplateInternal = z.object({
  item: anyString,
  expr: anyString,
  valueUnit: z.object({
    dimension: z.string(),
    unit: z.string(),
  }),
  params: z.array(
    z.object({
      name: name,
      kind: z.enum(["param", "threshold"]),
      type: z
        .literal("prom_duration")
        .or(z.literal("int"))
        .or(
          z.object({
            quantity: z.object({
              dimension: z.string(),
              units: z.array(z.string()),
              decimals: z.number().positive().min(1).nullable(),
            }),
          })
        ),
    })
  ),
});
export type CustomParamTypeInternal = z.infer<
  typeof alertRuleCustomTemplateInternal.shape.params.element.shape.type
>;
const paramConfig = z.discriminatedUnion("paramType", [
  z.object({
    paramType: z.literal("int"),
    value: z.number(),
  }),
  z.object({
    paramType: z.literal("prom_duration"),
    value: durationObject,
  }),
  z.object({
    paramType: z.literal("quantity"),
    unit: z.string(),
    value: z.number(),
  }),
]);
export const alertRuleCustomConfigInternal = z.object({
  instance: z.enum(["individual", "worst", "best"]),
  params: z.record(paramConfig),
  thresholds: z.record(
    z.object({
      major: paramConfig.nullable(),
      critical: paramConfig.nullable(),
      warning: paramConfig.nullable(),
      minor: paramConfig.nullable(),
    })
  ),
});

//FixedTraces
const alertRuleFixedTracesTemplateInternal = z.object({
  item: z.literal("operation"),
  metric: z.enum(["duration", "busy", "call_rate", "error_rate"]),
  param: z.enum(["mean", "lower_bound", "higher_bound"]),
  interval: z.enum(["5m", "15m"]),
});
const alertRuleFixedTracesConfigInternal = z.object({
  quantile: z.number(),
  thresholds: z.object({
    major: z.number().nullable(),
    critical: z.number().nullable(),
    warning: z.number().nullable(),
    minor: z.number().nullable(),
  }),
});

//Dynamic traces
const alertRuleDynamicTracesTemplateInternal = z.object({
  item: z.union([
    z.literal("operation"),
    z.object({ service: z.object({ combine: z.number().min(0).max(1) }) }),
  ]),
  metric: z.enum(["duration", "busy", "call_rate", "error_rate"]),
  short_term_interval: z.enum(["5m", "15m"]),
  long_term_interval: z.enum(["7d", "30d"]),
});
const alertRuleDynamicTracesConfigInternal = z.object({
  offset: z.number(),
  thresholds: z.object({
    major: z.number().nullable(),
    critical: z.number().nullable(),
    warning: z.number().nullable(),
    minor: z.number().nullable(),
  }),
});

//Template
export const alertRuleTemplateInternal = z
  .object({
    common: alertRuleCommonTemplateInternal,
    specific: z.discriminatedUnion("type", [
      z.object({
        type: z.literal("custom"),
        custom: alertRuleCustomTemplateInternal,
      }),
      z.object({
        type: z.literal("fixed_traces"),
        fixed_traces: alertRuleFixedTracesTemplateInternal,
      }),
      z.object({
        type: z.literal("dynamic_traces"),
        dynamic_traces: alertRuleDynamicTracesTemplateInternal,
      }),
    ]),
  })
  .refine(
    (val) => {
      if (val.specific.type === "custom") {
        try {
          const jsExpr = new JsExprSpec(val.specific.custom.expr);
          const params: ParamTypeMap = Object.fromEntries(
            val.specific.custom.params.map((param) => {
              if (param.type === "int" || param.type === "prom_duration") {
                return [param.name, param.type];
              } else {
                return [
                  param.name,
                  { quantity: param.type.quantity.dimension as Dimension },
                ];
              }
            })
          );
          const jsAlertRule = new JsAlertRuleTypes(
            val.specific.custom.valueUnit.dimension as Dimension,
            params
          );
          jsExpr.verify(jsAlertRule);
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Invalid prometheus expression or parameters schema does not satisify the expression",
      path: ["specific.custom.expr"],
    }
  )
  .refine(
    (val) => {
      if (val.common.annotations.summary !== null) {
        try {
          const jsExpr = new JsAnnotationTemplate(
            val.common.annotations.summary
          );
          if (val.specific.type === "custom") {
            const params: ParamTypeMap = Object.fromEntries(
              val.specific.custom.params.map((param) => {
                if (param.type === "int" || param.type === "prom_duration") {
                  return [param.name, param.type];
                } else {
                  return [
                    param.name,
                    { quantity: param.type.quantity.dimension as Dimension },
                  ];
                }
              })
            );
            const jsAlertRule = new JsAlertRuleTypes(
              val.specific.custom.valueUnit.dimension as Dimension,
              params
            );
            jsExpr.verify(jsAlertRule);
          }
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Invalid prometheus expression or parameters schema does not satisify the expression",
      path: ["val.common.annotations.summary"],
    }
  )
  .refine(
    (val) => {
      if (val.common.annotations.description !== null) {
        try {
          const jsExpr = new JsAnnotationTemplate(
            val.common.annotations.description
          );
          if (val.specific.type === "custom") {
            const params: ParamTypeMap = Object.fromEntries(
              val.specific.custom.params.map((param) => {
                if (param.type === "int" || param.type === "prom_duration") {
                  return [param.name, param.type];
                } else {
                  return [
                    param.name,
                    { quantity: param.type.quantity.dimension as Dimension },
                  ];
                }
              })
            );
            const jsAlertRule = new JsAlertRuleTypes(
              val.specific.custom.valueUnit.dimension as Dimension,
              params
            );
            jsExpr.verify(jsAlertRule);
          }
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Invalid prometheus expression or parameters schema does not satisify the expression",
      path: ["val.common.annotations.description"],
    }
  )
  .refine(
    (val) => {
      if (val.common.annotations.runbook_url !== null) {
        try {
          const jsExpr = new JsAnnotationTemplate(
            val.common.annotations.runbook_url
          );
          if (val.specific.type === "custom") {
            const params: ParamTypeMap = Object.fromEntries(
              val.specific.custom.params.map((param) => {
                if (param.type === "int" || param.type === "prom_duration") {
                  return [param.name, param.type];
                } else {
                  return [
                    param.name,
                    { quantity: param.type.quantity.dimension as Dimension },
                  ];
                }
              })
            );
            const jsAlertRule = new JsAlertRuleTypes(
              val.specific.custom.valueUnit.dimension as Dimension,
              params
            );
            jsExpr.verify(jsAlertRule);
          }
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Invalid prometheus expression or parameters schema does not satisify the expression",
      path: ["val.common.annotations.runbook_url"],
    }
  );
export type AlertRuleTemplateInternal = z.infer<
  typeof alertRuleTemplateInternal
>;
export type AlertRuleCustomTemplateInternal = z.infer<
  typeof alertRuleCustomTemplateInternal
>;
export type AlertRuleFixedTracesTemplateInternal = z.infer<
  typeof alertRuleFixedTracesTemplateInternal
>;
export type AlertRuleDynamicTracesTemplateInternal = z.infer<
  typeof alertRuleDynamicTracesTemplateInternal
>;

//Config
const alertRuleCustomConfigElementInternal = z.object({
  name: name,
  common: alertRuleCommonConfigInternal,
  specific: alertRuleCustomConfigInternal,
});
const alertRuleFixedTracesConfigElementInternal = z.object({
  name: name,
  common: alertRuleCommonConfigInternal,
  specific: alertRuleFixedTracesConfigInternal,
});
const alertRuleDynamicTracesConfigElementInternal = z.object({
  name: name,
  common: alertRuleCommonConfigInternal,
  specific: alertRuleDynamicTracesConfigInternal,
});
export const alertRuleConfigInternal = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("custom"),
    custom: z.array(alertRuleCustomConfigElementInternal),
  }),
  z.object({
    type: z.literal("fixed_traces"),
    fixed_traces: z.array(alertRuleFixedTracesConfigElementInternal),
  }),
  z.object({
    type: z.literal("dynamic_traces"),
    dynamic_traces: z.array(alertRuleDynamicTracesConfigElementInternal),
  }),
]);
export type AlertRuleConfigInternal = z.infer<typeof alertRuleConfigInternal>;
export type AlertRuleCommonConfigInternal = z.infer<
  typeof alertRuleCommonConfigInternal
>;
export type AlertRuleCustomConfigInternal = z.infer<
  typeof alertRuleCustomConfigInternal
>;
export type AlertRuleFixedTracesConfigInternal = z.infer<
  typeof alertRuleFixedTracesConfigInternal
>;
export type AlertRuleDynamicTracesConfigInternal = z.infer<
  typeof alertRuleDynamicTracesConfigInternal
>;
export type AlertRuleConfigElementInternal =
  | z.infer<typeof alertRuleCustomConfigElementInternal>
  | z.infer<typeof alertRuleFixedTracesConfigElementInternal>
  | z.infer<typeof alertRuleDynamicTracesConfigElementInternal>;

//New alert
export const newAlertRuleFormResolver = (existingRuleFormNames: string[]) =>
  z.object({
    name: name.superRefine((val, ctx) => {
      const stringParse = name.safeParse(val);
      if (!stringParse.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "String must contain at least 1 character(s)",
        });
      }
      if (existingRuleFormNames.includes(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ruleform name already exist, choose another name",
        });
      }
    }),
    type: alertRuleTemplateTypesInternal,
  });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const newAlerRuleForm = z.object({
  name: z.string(),
  type: alertRuleTemplateTypesInternal,
});
export type NewAlertRuleFormInternal = z.infer<typeof newAlerRuleForm>;

export const newAlertRuleTemplateInternal = z
  .object({
    annotations: z.object({
      summary: anyString.nullable(),
      description: anyString.nullable(),
      runbook_url: anyString.nullable(),
    }),
    specific: z.discriminatedUnion("type", [
      z.object({
        type: z.literal("custom"),
        custom: alertRuleCustomTemplateInternal,
      }),
      z.object({
        type: z.literal("fixed_traces"),
        fixed_traces: alertRuleFixedTracesTemplateInternal,
      }),
      z.object({
        type: z.literal("dynamic_traces"),
        dynamic_traces: alertRuleDynamicTracesTemplateInternal,
      }),
    ]),
  })
  .refine(
    (val) => {
      if (val.specific.type === "custom") {
        try {
          const jsExpr = new JsExprSpec(val.specific.custom.expr);
          const params: ParamTypeMap = Object.fromEntries(
            val.specific.custom.params.map((param) => {
              if (param.type === "int" || param.type === "prom_duration") {
                return [param.name, param.type];
              } else {
                return [
                  param.name,
                  { quantity: param.type.quantity.dimension as Dimension },
                ];
              }
            })
          );
          const jsAlertRule = new JsAlertRuleTypes(
            val.specific.custom.valueUnit.dimension as Dimension,
            params
          );
          jsExpr.verify(jsAlertRule);
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Invalid prometheus expression or parameters schema does not satisify the expression",
      path: ["specific.custom.expr"],
    }
  )
  .refine(
    (val) => {
      if (val.annotations.summary !== null) {
        try {
          const jsExpr = new JsAnnotationTemplate(val.annotations.summary);
          if (val.specific.type === "custom") {
            const params: ParamTypeMap = Object.fromEntries(
              val.specific.custom.params.map((param) => {
                if (param.type === "int" || param.type === "prom_duration") {
                  return [param.name, param.type];
                } else {
                  return [
                    param.name,
                    { quantity: param.type.quantity.dimension as Dimension },
                  ];
                }
              })
            );
            const jsAlertRule = new JsAlertRuleTypes(
              val.specific.custom.valueUnit.dimension as Dimension,
              params
            );
            jsExpr.verify(jsAlertRule);
          }
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Invalid prometheus expression or parameters schema does not satisify the expression",
      path: ["val.annotations.summary"],
    }
  )
  .refine(
    (val) => {
      if (val.annotations.description !== null) {
        try {
          const jsExpr = new JsAnnotationTemplate(val.annotations.description);
          if (val.specific.type === "custom") {
            const params: ParamTypeMap = Object.fromEntries(
              val.specific.custom.params.map((param) => {
                if (param.type === "int" || param.type === "prom_duration") {
                  return [param.name, param.type];
                } else {
                  return [
                    param.name,
                    { quantity: param.type.quantity.dimension as Dimension },
                  ];
                }
              })
            );
            const jsAlertRule = new JsAlertRuleTypes(
              val.specific.custom.valueUnit.dimension as Dimension,
              params
            );
            jsExpr.verify(jsAlertRule);
          }
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Invalid prometheus expression or parameters schema does not satisify the expression",
      path: ["val.annotations.description"],
    }
  )
  .refine(
    (val) => {
      if (val.annotations.runbook_url !== null) {
        try {
          const jsExpr = new JsAnnotationTemplate(val.annotations.runbook_url);
          if (val.specific.type === "custom") {
            const params: ParamTypeMap = Object.fromEntries(
              val.specific.custom.params.map((param) => {
                if (param.type === "int" || param.type === "prom_duration") {
                  return [param.name, param.type];
                } else {
                  return [
                    param.name,
                    { quantity: param.type.quantity.dimension as Dimension },
                  ];
                }
              })
            );
            const jsAlertRule = new JsAlertRuleTypes(
              val.specific.custom.valueUnit.dimension as Dimension,
              params
            );
            jsExpr.verify(jsAlertRule);
          }
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Invalid prometheus expression or parameters schema does not satisify the expression",
      path: ["val.annotations.runbook_url"],
    }
  );
export type NewAlertRuleTemplateInternal = z.infer<
  typeof newAlertRuleTemplateInternal
>;

export const newAlertRuleConfigInternal = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("custom"),
    custom: z.object({
      duration: durationObject,
      specific: alertRuleCustomConfigInternal,
    }),
  }),
  z.object({
    type: z.literal("fixed_traces"),
    fixed_traces: z.object({
      duration: durationObject,
      specific: alertRuleFixedTracesConfigInternal,
    }),
  }),
  z.object({
    type: z.literal("dynamic_traces"),
    dynamic_traces: z.object({
      duration: durationObject,
      specific: alertRuleDynamicTracesConfigInternal,
    }),
  }),
]);
export type NewAlertRuleConfigInternal = z.infer<
  typeof newAlertRuleConfigInternal
>;

//View
export const viewSettings = z.object({
  topologyLimit: z.number().default(TOPOLOGY_LIMIT),
  filterElementsByTopology: z.boolean().default(true),
  gridFilterStatusByEqual: z.boolean().default(false),
  gridFilterByManagedObjectType: z.boolean().default(false),
  metricSources: z.record(z.string()),
  openAlertsIncludeChildren: z.boolean().default(false),
});
export type ViewSettings = z.infer<typeof viewSettings>;

//Topology
export const topologyMetricSettings = z.record(z.boolean());
export type TopologyMetricSettings = z.infer<typeof topologyMetricSettings>;
