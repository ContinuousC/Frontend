/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useCallback, useMemo, useState, Fragment, useEffect } from "react";
import {
  FieldValues,
  useFormContext,
  useController,
  UseControllerProps,
  UseFormSetValue,
  UseFormTrigger,
  useFieldArray,
  useWatch,
  UseFormGetValues,
  useForm,
  FormProvider,
  Resolver,
  FieldErrors,
  Path,
  UseFormWatch,
  WatchObserver,
  PathValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TextField from "@mui/material/TextField";
import HelpIcon from "@mui/icons-material/Help";
import InputLabel from "@mui/material/InputLabel";
import Autocomplete from "@mui/material/Autocomplete";
import FormHelperText from "@mui/material/FormHelperText";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";

import TabPanel from "../components/TabPanel";

import * as generalUtils from "../utils/general";

import {
  FormSpecification,
  FormGenericProps,
  TextFieldFormControllerProps,
  SelectFormControllerProps,
  SubFormControllerProps,
  SelectOptions,
  ListFormControllerProps,
  GroupFormControllerProps,
  FormInputProps,
} from "../types/form";

function Form<T extends FieldValues>(props: {
  form: FormSpecification<T>[];
  horizontal?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex gap-4 w-full ${
        props.horizontal ? "flex-row" : "flex-col"
      }`}
    >
      {props.form.map((formController) => (
        <FormController
          key={formController.name}
          {...formController}
          disabled={props.disabled || formController.disabled}
        />
      ))}
    </div>
  );
}

export default Form;

interface FormContextProps<T extends FieldValues> {
  setValue: UseFormSetValue<T>;
  trigger: UseFormTrigger<T>;
  getValues: UseFormGetValues<T>;
  watch: UseFormWatch<T>;
}

function FormController<T extends FieldValues>(props: FormSpecification<T>) {
  const { control, setValue, trigger, getValues, watch } = useFormContext<T>();
  const formContextProps: FormContextProps<T> = {
    setValue: setValue,
    trigger: trigger,
    getValues: getValues,
    watch: watch,
  };
  const formGenericProps: FormGenericProps = {
    label: props.label,
    title: props.title,
    disabled: props.disabled,
  };

  if (props.formType === "group") {
    return (
      <GroupFormController
        key={props.name}
        {...formContextProps}
        {...formGenericProps}
        name={props.name}
        forms={props.forms}
        withToggle={props.withToggle}
      />
    );
  }

  const formInputProps: FormInputProps<T> = {
    name: props.name,
    notRequired: props.notRequired,
    onWatch: props.onWatch,
  };

  if (props.formType === "textField") {
    return (
      <TextFieldFormController
        key={props.name}
        {...control}
        {...formContextProps}
        {...formGenericProps}
        {...formInputProps}
        number={props.number}
      />
    );
  } else if (props.formType === "select") {
    return (
      <SelectFormController
        key={props.name}
        {...control}
        {...formContextProps}
        {...formGenericProps}
        {...formInputProps}
        options={props.options}
        multiple={props.multiple}
        placeholder={props.placeholder}
        getDynamicOptions={props.getDynamicOptions}
      />
    );
  } else if (props.formType === "toggle") {
    return (
      <ToggleFormController
        key={props.name}
        {...control}
        {...formContextProps}
        {...formGenericProps}
        {...formInputProps}
      />
    );
  } else if (props.formType === "list") {
    return (
      <ListFormController
        key={props.name}
        {...control}
        {...formContextProps}
        {...formGenericProps}
        {...formInputProps}
        name={props.name}
        formGenerator={props.formGenerator}
        newValueDefault={props.newValueDefault}
        schemaResolver={props.schemaResolver}
        sortingDisabled={props.sortingDisabled}
        emptyLabel={props.emptyLabel}
        addLabel={props.addLabel}
        updateDynamiclyDisabled={props.updateDynamiclyDisabled}
        notRequired={props.notRequired}
        onWatch={props.onWatch}
      />
    );
  } else if (props.formType === "subForm") {
    return (
      <SubFormFormController
        key={props.name}
        {...control}
        {...formContextProps}
        {...formGenericProps}
        {...formInputProps}
        form={props.form}
        horizontal={props.horizontal}
      />
    );
  }
  return null;
}

function TextFieldFormController<T extends FieldValues>(
  props: UseControllerProps<T> &
    FormContextProps<T> &
    FormGenericProps &
    FormInputProps<T> &
    TextFieldFormControllerProps
) {
  const {
    field,
    fieldState: { error, invalid },
  } = useController({
    name: props.name,
    control: props.control,
  });
  onWatchHook({
    onWatch: props.onWatch,
    watch: props.watch,
    setValue: props.setValue,
    getValues: props.getValues,
  });
  const fieldValue = field.value || props.getValues(field.name);
  return (
    <TextField
      {...field}
      value={convertToInputValue(fieldValue)}
      onChange={(event) => {
        props.setValue(field.name, converToFormValue(event.target.value));
      }}
      required={!props.notRequired}
      type={props.number ? "number" : "text"}
      disabled={props.disabled || (props.notRequired && fieldValue === null)}
      label={
        <div className="flex gap-2 items-center">
          <span>{props.label}</span>
          {props.title && (
            <span title={props.title}>
              <HelpIcon className="cursor-help" />
            </span>
          )}
        </div>
      }
      placeholder={props.notRequired !== undefined ? "" : "Required"}
      error={invalid}
      helperText={error?.message}
      color={invalid ? "error" : undefined}
      fullWidth
      slotProps={{
        input: {
          startAdornment: props.notRequired && (
            <ToggleButtonGroup
              value={fieldValue === null ? false : true}
              onChange={(_event, set: boolean) => {
                if (!set) {
                  props.setValue(field.name, null as PathValue<T, Path<T>>);
                } else {
                  props.setValue(
                    field.name,
                    //notRequired will not be undefined, but typescript cannot infer this
                    props.notRequired?.defaultValue as PathValue<T, Path<T>>
                  );
                }
              }}
              size="small"
              color="info"
              exclusive
              className="pr-2"
              disabled={props.disabled}
            >
              <ToggleButton value={true}>
                {props.notRequired.setText ? props.notRequired.setText : "SET"}
              </ToggleButton>
              <ToggleButton value={false}>
                {props.notRequired.unsetText
                  ? props.notRequired.unsetText
                  : "UNSET"}
              </ToggleButton>
            </ToggleButtonGroup>
          ),
        },
        htmlInput:
          typeof props.number === "object"
            ? {
                step: Math.pow(
                  10,
                  -(props.number.float < 1 ? 1 : props.number.float)
                ),
              }
            : undefined,
        inputLabel: {
          shrink: true,
        },
      }}
    />
  );

  function convertToInputValue(value: PathValue<T, Path<T>>) {
    if (typeof value === "string") {
      return value;
    } else if (typeof value === "number" && props.number) {
      if (props.number === "integer") {
        return parseInt(value).toString();
      } else {
        return parseFloat(value);
      }
    } else {
      return "";
    }
  }
  function converToFormValue(value: string): PathValue<T, Path<T>> {
    if (props.number) {
      let number: PathValue<T, Path<T>>;
      if (props.number === "integer") {
        number = parseInt(value) as PathValue<T, Path<T>>;
      } else {
        number = parseFloat(value) as PathValue<T, Path<T>>;
      }
      if (!Number.isNaN(number)) {
        return number;
      }
    }
    return value as PathValue<T, Path<T>>;
  }
}

const EMPTY_VALUE = "EMPTY_VALUE_FORM";
function SelectFormController<T extends FieldValues>(
  props: UseControllerProps<T> &
    FormContextProps<T> &
    FormGenericProps &
    FormInputProps<T> &
    SelectFormControllerProps<T>
) {
  type inputSelectType = {
    id: string;
    label: string;
    type: "simple" | "form";
  };
  const {
    field,
    fieldState: { error, invalid },
  } = useController({
    name: props.name,
    control: props.control,
  });
  onWatchHook({
    onWatch: props.onWatch,
    watch: props.watch,
    setValue: props.setValue,
    getValues: props.getValues,
  });

  const [options, setOptions] = useState<SelectOptions<T>>(props.options);
  const [loading, setLoading] = useState<boolean>(false);

  const fieldValue = field.value || props.getValues(field.name);
  //Not performant hack because getDynamicoptions will not reload if options are not loaded
  useEffect(() => {
    getOptions();
  }, [props.options, props.getDynamicOptions, fieldValue]);

  const inputOptions = useMemo<inputSelectType[]>(
    () =>
      options.map((option) => {
        if ("value" in option) {
          return {
            id: option.value === "" ? EMPTY_VALUE : option.value,
            label: option.value === "" ? "Empty string" : option.label,
            type: "simple",
          };
        } else {
          return {
            id: option.form.name,
            label: option.form.label,
            type: "form",
          };
        }
      }),
    [options]
  );

  const inputValue = convertToInputValue(fieldValue);
  return (
    <FormGroup className="flex gap-2">
      <Autocomplete
        id={props.name}
        value={inputValue}
        onChange={(_event, newValue) => {
          props.setValue(field.name, converToFormValue(newValue));
        }}
        options={inputOptions}
        multiple={props.multiple}
        limitTags={3}
        disabled={props.disabled || (props.notRequired && fieldValue === null)}
        fullWidth
        color={invalid ? "error" : undefined}
        loading={loading}
        onOpen={getOptions}
        getOptionKey={(option) => option.id}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={props.label}
            placeholder={getPlaceholder()}
            helperText={error?.message}
            error={invalid}
            color={invalid ? "error" : undefined}
            required={!props.notRequired}
            disabled={
              props.disabled || (props.notRequired && fieldValue === null)
            }
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <>
                    {props.notRequired && (
                      <ToggleButtonGroup
                        value={fieldValue === null ? false : true}
                        onChange={(_event, set: boolean) => {
                          if (!set) {
                            props.setValue(
                              field.name,
                              null as PathValue<T, Path<T>>
                            );
                          } else {
                            props.setValue(
                              field.name,
                              //notRequired will not be undefined, but typescript cannot infer this
                              props.notRequired?.defaultValue as PathValue<
                                T,
                                Path<T>
                              >
                            );
                          }
                        }}
                        size="small"
                        color="info"
                        exclusive
                        className="pr-2"
                        disabled={props.disabled}
                      >
                        <ToggleButton value={true}>
                          {props.notRequired.setText
                            ? props.notRequired.setText
                            : "SET"}
                        </ToggleButton>
                        <ToggleButton value={false}>
                          {props.notRequired.unsetText
                            ? props.notRequired.unsetText
                            : "UNSET"}
                        </ToggleButton>
                      </ToggleButtonGroup>
                    )}
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
              inputLabel: {
                ...params.InputLabelProps,
                shrink: true,
              },
            }}
          />
        )}
      />
      <div className="pl-4">
        <Form
          form={getFormSpecification(inputValue)}
          disabled={props.disabled}
        />
      </div>
    </FormGroup>
  );

  function getPlaceholder() {
    if (props.placeholder) {
      if (Array.isArray(inputValue) && inputValue.length > 0) {
        return "";
      }
      return props.placeholder;
    }
    if (
      props.notRequired === undefined &&
      ((Array.isArray(inputValue) && inputValue.length === 0) ||
        inputValue === null)
    ) {
      return "Required";
    }
  }

  function convertToInputValue(
    fieldValue: PathValue<T, Path<T>>
  ): null | inputSelectType | inputSelectType[] {
    if (fieldValue === null || fieldValue === undefined) {
      return props.multiple ? [] : null;
    } else if (Array.isArray(fieldValue)) {
      if (props.multiple) {
        const values: inputSelectType[] = [];
        fieldValue.forEach((fieldValue: PathValue<T, Path<T>>) => {
          if (typeof fieldValue === "object") {
            const optionName = `${field.name}.${Object.keys(fieldValue)[0]}`;
            const option = inputOptions.find(
              (option) => option.type === "form" && option.id === optionName
            );
            if (option !== undefined) {
              values.push(option);
            }
          } else {
            const val = fieldValue === "" ? EMPTY_VALUE : fieldValue;
            const option = inputOptions.find(
              (option) => option.type === "simple" && option.id === val
            );
            if (option !== undefined) {
              values.push(option);
            }
          }
        });
        return values;
      } else {
        return [];
      }
    } else if (typeof fieldValue === "object") {
      const optionName = `${field.name}.${Object.keys(fieldValue)[0]}`;
      const option = inputOptions.find(
        (option) => option.type === "form" && option.id === optionName
      );
      if (option !== undefined) {
        return option;
      }
    } else {
      const val = fieldValue === "" ? EMPTY_VALUE : fieldValue;
      const option = inputOptions.find(
        (option) => option.type === "simple" && option.id === val
      );
      if (option !== undefined) {
        return option;
      }
    }
    return null;
  }

  function converToFormValue(
    inputValue: null | inputSelectType | inputSelectType[]
  ): PathValue<T, Path<T>> {
    if (inputValue === null) {
      return null as PathValue<T, Path<T>>;
    } else if (Array.isArray(inputValue)) {
      const values: (string | PathValue<T, Path<T>>)[] = [];
      inputValue.forEach((inputVal: inputSelectType) => {
        if (inputVal.type === "simple") {
          const val = inputVal.id === EMPTY_VALUE ? "" : inputVal.id;
          values.push(val as PathValue<T, Path<T>>);
        } else {
          const option = options.find(
            (option) => "form" in option && option.form.name === inputVal.id
          );
          if (option !== undefined && "defaultValueOnOpen" in option) {
            const optionNameVec = option.form.name.split(".");
            const optionName = optionNameVec[optionNameVec.length - 1];
            const value = {
              [optionName]: option.defaultValueOnOpen,
            } as PathValue<T, Path<T>>;
            values.push(value);
          }
        }
      });
      return values as PathValue<T, Path<T>>;
    } else {
      if (inputValue.type === "simple") {
        const val = inputValue.id === EMPTY_VALUE ? "" : inputValue.id;
        return val as PathValue<T, Path<T>>;
      } else {
        const option = options.find(
          (option) => "form" in option && option.form.name === inputValue.id
        );
        if (option !== undefined && "defaultValueOnOpen" in option) {
          const optionNameVec = option.form.name.split(".");
          const optionName = optionNameVec[optionNameVec.length - 1];
          return { [optionName]: option.defaultValueOnOpen } as PathValue<
            T,
            Path<T>
          >;
        }
      }
    }
    return null as PathValue<T, Path<T>>;
  }

  function getFormSpecification(
    inputValue: null | inputSelectType | inputSelectType[]
  ): FormSpecification<T>[] {
    if (inputValue === null) {
      return [];
    }
    if (Array.isArray(inputValue)) {
      const form: {
        label: string;
        form: FormSpecification<T>[];
        horizontal?: boolean;
      }[] = [];
      inputValue.forEach((inputValue) => {
        const option = options.find(
          (option) =>
            "form" in option &&
            inputValue.type === "form" &&
            option.form.name === inputValue.id
        );
        if (option !== undefined && "form" in option) {
          form.push({
            label: option.form.label,
            form: [option.form],
          });
        }
      });
      if (form.length === 1) {
        return form[0].form;
      } else if (form.length > 1) {
        return [
          {
            formType: "group",
            name: "",
            label: "Multi select",
            withToggle: true,
            forms: form,
          },
        ];
      }
    } else if (inputValue.type === "form") {
      const option = options.find(
        (option) => "form" in option && option.form.name === inputValue.id
      );
      if (option !== undefined && "form" in option) {
        return [option.form];
      }
    }
    return [];
  }

  async function getOptions() {
    if (props.getDynamicOptions) {
      setLoading(true);
      try {
        setOptions([
          ...props.options,
          ...(await props.getDynamicOptions(props.getValues)),
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.warn("Clould not dynamuc options", e.toString());
      }
      setLoading(false);
    } else {
      setOptions(props.options);
    }
  }
}

function ToggleFormController<T extends FieldValues>(
  props: UseControllerProps<T> &
    FormContextProps<T> &
    FormGenericProps &
    FormInputProps<T>
) {
  const {
    field,
    fieldState: { error, invalid },
  } = useController({
    name: props.name,
    control: props.control,
  });
  onWatchHook({
    onWatch: props.onWatch,
    watch: props.watch,
    setValue: props.setValue,
    getValues: props.getValues,
  });
  const fieldValue = field.value || props.getValues(field.name);
  return (
    <FormGroup className="flex flex-col">
      <InputLabel id={field.name} shrink disabled={props.disabled}>
        <div className="flex gap-2 items-center">
          <span>{props.label}</span>
          {props.title && (
            <span title={props.title}>
              <HelpIcon className="cursor-help" />
            </span>
          )}
        </div>
      </InputLabel>
      <ToggleButtonGroup
        {...field}
        value={convertToInputValue(fieldValue)}
        onChange={(_event, newValue) => {
          props.setValue(field.name, converToFormValue(newValue));
        }}
        color={invalid ? "error" : "info"}
        exclusive
        disabled={props.disabled}
      >
        <ToggleButton value={true}>True</ToggleButton>
        <ToggleButton value={false}>False</ToggleButton>
        {props.notRequired !== undefined && (
          <ToggleButton value="unset">
            {props.notRequired.unsetText
              ? props.notRequired.unsetText
              : "Unset"}
          </ToggleButton>
        )}
      </ToggleButtonGroup>
      {error && <FormHelperText>{error?.message}</FormHelperText>}
    </FormGroup>
  );

  function convertToInputValue(fieldValue: PathValue<T, Path<T>>) {
    if (
      props.notRequired &&
      (fieldValue === null || fieldValue === undefined)
    ) {
      return "unset";
    }
    return !!fieldValue;
  }

  function converToFormValue(
    inputValue: boolean | "unset"
  ): PathValue<T, Path<T>> {
    if (props.notRequired && inputValue === "unset") {
      return null as PathValue<T, Path<T>>;
    } else {
      return !!inputValue as PathValue<T, Path<T>>;
    }
  }
}

function useValidationResolver<T extends FieldValues>(
  validationSchema: z.AnyZodObject,
  rootPath: Path<T>,
  index: number,
  getValues: UseFormGetValues<T>,
  label: string,
  dynamiclyDisabledNames?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Resolver<T, any> {
  const path = `${rootPath}.${index}`;
  return useCallback(
    async (values, context, options) => {
      const allNames = getValues(rootPath).map(
        ({ name }: { name: string }) => name
      );
      const nestedData = generalUtils.getNestedFieldFromString(values, path);
      if (
        dynamiclyDisabledNames !== undefined &&
        dynamiclyDisabledNames.includes(nestedData.name)
      ) {
        return {
          values: {},
          errors: {
            [`${path}.name`]: {
              type: "string",
              message: label + " cannot be used",
            },
          } as FieldErrors<T>,
        };
      }
      if (allNames.includes(nestedData.name)) {
        return {
          values: {},
          errors: {
            [`${path}.name`]: {
              type: "string",
              message: label + " is already used",
            },
          } as FieldErrors<T>,
        };
      }
      const resolvedData = await zodResolver(validationSchema)(
        nestedData,
        context,
        options
      );
      const errors: FieldErrors<T> = {};
      Object.entries(resolvedData.errors).forEach(([errorPath, error]) => {
        const resolvedPath = `${path}.${errorPath}`;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        errors[resolvedPath] = error;
      });
      return {
        values: resolvedData.values,
        errors: errors,
      };
    },
    [validationSchema, path, index, getValues]
  );
}

function ListFormController<T extends FieldValues>(
  props: UseControllerProps<T> &
    FormContextProps<T> &
    FormGenericProps &
    ListFormControllerProps<T>
) {
  const [expandedId, setExpandedId] = useState<string | null>();
  const { fields, remove, append, move } = useFieldArray({
    control: props.control,
    name: props.name,
  });
  onWatchHook({
    onWatch: props.onWatch,
    watch: props.watch,
    setValue: props.setValue,
    getValues: props.getValues,
  });
  const resolver = useValidationResolver<T>(
    props.schemaResolver,
    props.name,
    fields.length,
    props.getValues,
    props.emptyLabel || "Name",
    props.updateDynamiclyDisabled !== undefined
      ? Object.keys(props.updateDynamiclyDisabled)
      : undefined
  );
  const methods = useForm<T>({
    resolver,
  });
  useEffect(() => {
    const data = new Array(fields.length + 1);
    data[data.length - 1] = props.newValueDefault;
    methods.setValue(props.name, data as PathValue<T, Path<T>>);
  }, [fields.length]);
  return (
    <div className="w-full flex flex-col gap-2">
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext
          items={fields}
          strategy={verticalListSortingStrategy}
          id="id"
        >
          {fields.map((field, index) => (
            <ListForm
              key={field.id}
              id={field.id}
              rootPath={`${props.name}.${index}.`}
              emptyLabel={props.emptyLabel}
              addLabel={props.addLabel}
              label={props.label}
              form={props.formGenerator(index, props.getValues)}
              onExpand={() => handleExpandClick(field.id)}
              expanded={expandedId === field.id}
              onDelete={() => remove(index)}
              deletingDisabled={props.disabled}
              sortingDisabled={props.sortingDisabled}
              disabled={props.disabled}
              updateDynamiclyDisabled={props.updateDynamiclyDisabled}
            />
          ))}
          {!props.disabled && (
            <FormProvider {...methods}>
              <ListForm
                id={`${props.name}.${fields.length}`}
                rootPath={`${props.name}.${fields.length}.`}
                emptyLabel={props.emptyLabel}
                addLabel={props.addLabel}
                label={props.label}
                form={props.formGenerator(fields.length, props.getValues, true)}
                expanded
                sortingDisabled
                onAdd={() => {
                  methods.handleSubmit(
                    (data) => {
                      handleAppend(data);
                    },
                    (error) => console.log("LIST ERROR", error)
                  )();
                }}
              />
            </FormProvider>
          )}
        </SortableContext>
      </DndContext>
    </div>
  );

  function handleExpandClick(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  }
  function handleDragStart() {
    setExpandedId(null);
  }
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (
      over !== null &&
      active.id !== over.id &&
      active.data.current?.sortable.index !== undefined &&
      over.data.current?.sortable.index !== undefined
    ) {
      move(
        active.data.current.sortable.index,
        over.data.current.sortable.index
      );
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleAppend(data: any) {
    append(data);
  }
}

function ListForm<T extends FieldValues>(props: {
  id: string;
  rootPath: string;
  emptyLabel?: string;
  addLabel?: string;
  label?: string;
  form: FormSpecification<T>[];
  onExpand?: () => void;
  expanded: boolean;
  onDelete?: () => void;
  deletingDisabled?: boolean;
  sortingDisabled?: boolean;
  onAdd?: () => void;
  disabled?: boolean;
  updateDynamiclyDisabled?: { [name: string]: { formExcluded?: boolean } };
}) {
  const value = useWatch({ name: props.rootPath + "name" });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id, disabled: props.sortingDisabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderWidth: props.onAdd ? 1 : undefined,
    borderColor: props.onAdd ? "#64748b" : undefined,
  };
  const deletingDisabled =
    props.deletingDisabled ||
    (props.updateDynamiclyDisabled !== undefined
      ? value in props.updateDynamiclyDisabled
      : false);
  const formDisabled =
    props.disabled ||
    (props.updateDynamiclyDisabled !== undefined
      ? value in props.updateDynamiclyDisabled &&
        !props.updateDynamiclyDisabled[value].formExcluded
      : false);
  return (
    <Card className="w-full" style={style} ref={setNodeRef}>
      <CardHeader
        title={
          <span className={`text-base lowercase ${value ? "" : "italic"}`}>
            {value ||
              `Set ${
                props.emptyLabel ||
                (props.label ? props.label + " name" : "name")
              }`}
          </span>
        }
        action={
          <>
            {props.onAdd && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={props.onAdd}
                disabled={!value}
              >
                Add new {props.addLabel || props.label}
              </Button>
            )}
            {props.onDelete && (
              <IconButton
                onClick={handleOnRemove}
                title={"Delete " + props.label}
                disabled={deletingDisabled}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
            {!props.sortingDisabled && (
              <IconButton disabled={props.expanded || deletingDisabled}>
                <DragIndicatorIcon
                  className={`${
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                  {...listeners}
                  {...attributes}
                />
              </IconButton>
            )}
            {props.onExpand && (
              <IconButton onClick={handleExpandClick}>
                {props.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </>
        }
      />
      {props.expanded && !isDragging && (
        <CardContent>
          <Form<T> form={props.form} disabled={formDisabled} />
        </CardContent>
      )}
    </Card>
  );

  function handleOnRemove() {
    if (props.onDelete) {
      props.onDelete();
    }
  }

  function handleExpandClick() {
    if (props.onExpand) {
      props.onExpand();
    }
  }
}

function SubFormFormController<T extends FieldValues>(
  props: UseControllerProps<T> &
    FormContextProps<T> &
    FormGenericProps &
    FormInputProps<T> &
    SubFormControllerProps<T>
) {
  const {
    field,
    fieldState: { error, invalid },
  } = useController({
    name: props.name,
    control: props.control,
  });
  onWatchHook({
    onWatch: props.onWatch,
    watch: props.watch,
    setValue: props.setValue,
    getValues: props.getValues,
  });
  const fieldValue = field.value || props.getValues(field.name);
  return (
    <FormGroup className="flex flex-col">
      <InputLabel
        id={field.name}
        shrink
        disabled={props.disabled || (props.notRequired && fieldValue === null)}
      >
        <div
          className="flex gap-2 items-center"
          onClick={(e) => e.preventDefault()}
        >
          <span>{props.label}</span>
          {props.title && (
            <span title={props.title}>
              <HelpIcon className="cursor-help" />
            </span>
          )}
          {props.notRequired && (
            <ToggleButtonGroup
              {...field}
              value={!!fieldValue}
              onChange={(_, set: boolean) => {
                if (set) {
                  props.setValue(
                    field.name,
                    props.notRequired?.defaultValue as PathValue<T, Path<T>>
                  );
                } else {
                  props.setValue(field.name, null as PathValue<T, Path<T>>);
                }
              }}
              size="small"
              className="pb-4"
              color={invalid && fieldValue ? "error" : "info"}
              exclusive
              disabled={props.disabled}
            >
              <ToggleButton value={true}>
                {props.notRequired.setText ? props.notRequired.setText : "SET"}
              </ToggleButton>
              <ToggleButton value={false}>
                {props.notRequired.unsetText
                  ? props.notRequired.unsetText
                  : "UNSET"}
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </div>
      </InputLabel>
      {error && fieldValue && <FormHelperText>{error?.message}</FormHelperText>}
      <div className="pl-4">
        {!(props.notRequired && fieldValue === null) && (
          <Form
            form={props.form}
            horizontal={props.horizontal}
            disabled={props.disabled}
          />
        )}
      </div>
    </FormGroup>
  );
}

function GroupFormController<T extends FieldValues>(
  props: FormContextProps<T> & FormGenericProps & GroupFormControllerProps<T>
) {
  const [formSelected, setFormSelected] = useState<number>(0);
  return (
    <FormGroup className="flex flex-col w-full">
      <InputLabel id={props.name} shrink disabled={props.disabled}>
        <div className="flex gap-2 items-center">
          <span>{props.label}</span>
          {props.title && (
            <span title={props.title}>
              <HelpIcon className="cursor-help" />
            </span>
          )}
        </div>
        {props.withToggle && (
          <ToggleButtonGroup
            value={formSelected}
            onChange={(_event, newValue) => {
              if (newValue !== null) {
                setFormSelected(newValue);
              }
            }}
            size="small"
            exclusive
          >
            {props.forms.map((form, index) => (
              <ToggleButton key={index} value={index}>
                {form.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      </InputLabel>
      <div className="flex flex-1 flex-row gap-4 w-full">
        {props.withToggle
          ? props.forms.map((form, index) => (
              <TabPanel
                key={index}
                index={formSelected}
                value={index}
                className="w-full"
              >
                <Form
                  form={form.form}
                  horizontal={form.horizontal}
                  disabled={props.disabled}
                />
              </TabPanel>
            ))
          : props.forms.map((form, index) => (
              <Fragment key={index}>
                <div className="flex flex-row gap-4 w-full">
                  <div className="w-full">
                    <InputLabel
                      id={props.name}
                      shrink
                      disabled={props.disabled}
                    >
                      <div className="flex gap-2 items-center">
                        <span>{form.label}</span>
                      </div>
                    </InputLabel>
                    <Form
                      form={form.form}
                      horizontal={form.horizontal}
                      disabled={props.disabled}
                    />
                  </div>
                  {index !== props.forms.length - 1 && (
                    <Divider orientation="vertical" flexItem />
                  )}
                </div>
              </Fragment>
            ))}
      </div>
    </FormGroup>
  );
}

function onWatchHook<T extends FieldValues>(props: {
  setValue: UseFormSetValue<T>;
  getValues: UseFormGetValues<T>;
  watch: UseFormWatch<T>;
  onWatch?: (
    setValue: UseFormSetValue<T>,
    getValues: UseFormGetValues<T>
  ) => WatchObserver<T>;
}) {
  const { onWatch, watch, setValue, getValues } = props;
  if (onWatch === undefined) {
    return;
  }
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (onWatch) {
      const subscription = watch(onWatch(setValue, getValues));
      unsubscribe = subscription.unsubscribe;
    }
    return unsubscribe;
  }, [onWatch, watch, setValue]);
}
