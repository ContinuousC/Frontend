# Form Components

## Intro

Our [form library](../src/components/Form.tsx) is an abstraction on top of our UI library 'MUI-components' and the headless [react-hook-form](https://react-hook-form.com/) library. The goal is to declaratively define your form with the domain specific language (DSL) of our form library.

- Why was this form library created?
  We want consistenty on how our forms are constructed and visualized.

- Why not a form library as [surveyjs.io](https://surveyjs.io/)?
  We wanted a headles form library, where we could plugin the UI-library of choice. Furthermore we did not want to be restricted by the limitation of business logic we could apply.

- Why not [formik](https://formik.org/) as headless form library?
  React hook form had better documentation at the time and it felt, personally, more intuitive to work with.

## Getting Started

These are the steps we need to follow to create a form

1. First we need to have the external typescript schema for the [ValueSchemaExternal](#valueschemaexternal)

2. With the [contract](#contract-valueschemainternal) that the [ValueSchemaInternal](#valueschemainternal) must adhere to for our form library, we create the [zodValueInternalSchema](#zodvalueinternalschema)

3. Infer the typescript [ValueSchemaInternal](#valueschemainternal) from the [zodValueInternalSchema](#zodvaluetype)

4. Create the form with the [FormSpecification](#formspecification) and given [ValueSchemaInternal](#valueschemainternal). For each formType of the FormSpecification.

5. If needed, create functionality to convert from [ValueSchemaExternal](#valueschemaexternal) to [ValueSchemaInternal](#valueschemainternal) and vice versa.

6. Render component by using useForm hook, FormProvider context and Form component.

See [simple example](../src/components/FormTest.tsx). It's imported in [configuration page](../src/pages/Configurations.tsx), uncomment neccesary parts. For more complex examples check [configurationAlertRule.tsx](../src/components/ConfigurationAlertRule.tsx)

## Design

### DSL

We opted for a js representation instead of a strict JSON representation (serializable representation) for the DSL. One of the advantage is that we for example benefit from expressing custom logic within a function instead of conveying the complexity in a strict JSON format. I think it's better to start this way and when finding recurring logic/patterns, to include that in the DSL itself along the way.

The DSL is actually just the form and is defined as an array of [FormSpecification](#formspecification). In the next sections we will cover terminology used inside our DSL and as last we will cover potential improvements for our form library.

### ValueSchemaExternal

This is the typescript schema from the external source

### ValueSchemaInternal

This is the typescript schema for the internal representation

### zodValueInternalSchema

Is where the ValueSchemaInternal is infered from. This is done automatically with zod by infering the zodValueInternalSchema. This will be used for schema validation and for field value validations checks.

### FormSpecification

A FormSpecification consist of the formType, some generic settings and formType specific settings.

FormSpecification accepts the generic type [ValueSchemaInternal](#valueschemainternal) -> FormSpecification<ValueSchemaInternal>. We can choose which fields of the ValueSchemaInternal to visualize in the form.

#### Generic settings

- label: the label shown for the input
- title?: will shown as questionmark next to label with some description
- disabled?: if disabled this field cannot be updated

#### Input settings for textfield, select, toggle, subForm and list

- name: the path in ValueSchemaInternal. Example: {a: {b: c}}, name for c would be: "a.b.c".
- notRequired?: if this field must be set or not. DefaultValue must be given. You can also choose the setText and unSetText
- onWatch?: function watch values of other values in form and perform some custom

Caveats:

- DefaultValue in notRequired can be any value from the ValueSchemaInternal, and is not tightly coupled to the given path. This should be the case, however this is not yet checked at compile time.

#### Textfield settings

- number?: can be integer or float. For float a number must be given for the number of decimals

#### Toggle settings

This is for fields that are booleans.

#### Group settings

Is purely for visualization to group forms

- name: any string
- forms: a list of list of FormSpecification. There is setting 'horizontal' to render the FormSpecification horizontally. If not they will just be rendered vertically.
- withToggle?: if this is set to true, forms will be rendered as tabs. If not set of false, forms will be rendered next to each other

Caveats:

- the name from [generic settings](#generic-settings) can be any string, However within another form such as options in select, or in a list, it must be unique.

#### Select settings

- options: list of values that can be chosen. Can be either an optionValue or an optionForm
- getDynamicOptions?: a function to dynamically get the options. It accept getValues and setValues
- multiple?: make multiple selection possible
- placeholder: show what me be set when no value given

Caveats:

- When we have an optionValue in options, the name should be the same name from the [generic settings](#generic-settings)
- the optionForm equired a defaultValueOnOpen. As with DefaultValue, this is not yet checked by typescript

#### SubForm settings

This is usefull if you have nested schema and they belong together. Compared to formType group, there is actually logic involved.

- form: list of FormSpecifications
- horizontal?: render the FormSpecification next to each other

Caveats:

- the FormSpecifications in form can be arbritary, but it must correspond the the nested schema

#### List settings

- formGenerator: a function with as parameter index, to generate a new form
- newValueDefault: default value for a new item. Again as with DefaultValue, this is not yet checked by typescript
- schemaResolver: the zod schema for an item in the list
- sortingDisabled?: disabled sorting
- emptyLabel?: the label when no name is set
- addLabel?: the label on the add button
- updateDynamiclyDisabled?: disable an item to be updateable by reference of name

The form library handles the validation for a unique name when adding a new item

Caveats:

- schemaResolver can be arbritary, but is should match the item schema
- newValueDefault can be set arbritary, but the value must be set to the item schema

### Contract ValueSchemaInternal

- All fields must be specified as either null or a value. Cannot be undefined.
- For list:
  - the item must always be objects and there must exist a field named 'name'
  - You must make sure that for each item that the 'name' is unique

### Validation

The backend should offcourse always perform the full business validation. Preferably the frontend should perform the same validation. Where could we adopt validation in frontend?

- Schema validation:
  - At compile time with typescript.
  - At runtime with zod
- Field value validation is done at runtime with the zod library. For more complex field validation:
  - We can add custom types to zod
  - A specific usecase is where a field is defined as string in the ValueInternalSchema, but we know that it must be a set of options. Here we need to use the formType [select](#select-settings) and then choosing one of the following options:
    - by first fetching the options and then either updating this in the zodValueInternalSchema or in the FormSpecification. However when updating zodValueInternalSchema, we must have a default for zodValueInternalSchema to infer ValueSchemaInternal. As consequence at compile time we always check against the default ValueSchemaInternal.
    - using dynamicoptions field in the settings of the formType [select](#select-settings)
- Validation between different field values at runtime
  - We can use the useWatch function, see [Generic Settings](#generic-settings), to listen to a value in fieldB and fieldC to update a value in fieldA.
  - We can either update the zodValueInternalSchema or the FormSpecification dynamically by using [formOutput.watch](https://react-hook-form.com/docs/useform/watch)
- Validation between different forms at runtime
  - We can either update the zodValueInternalSchema or the FormSpecification dynamically by using [formOutput.watch](https://react-hook-form.com/docs/useform/watch)
- Another approach for all of them is to let the backend do the work and not using the zod library. The returned error from the backend must adhere to the react-hook-library so we can set the error by using [formOutput.setError](https://react-hook-form.com/docs/useform/seterror)

### Improvements

#### Fix caveats

- Input settings
  - the defaultValue from the notRequired field should be inferred from the given name
- FormType 'group':
  - should not have to set name
- FormType 'select'
  - for the optionValue the name should not be needed
- FormType 'subForm"
  - improve typechecking by make suring the name in the FormSpecification in the form field, can only be a nested field from name
- FormType 'list'
  - schemaResolver should be discared and be derived from the zodValueInternalSchema and the name
  - newValueDefault be inferred from the given name

#### New features

- Implement a 'StepController' in our form library (see example [ConfigurationAlertRuleAdd](../src/components/ConfigurationAlertRuleAdd.tsx))
- The form library should abstract the use of the react-hook-form library for the client.
  - Move FormProvider to Form
  - useForm as custum hook
  - FormSpecification should not depedent on reac-hook-form library (however this is difficult as it solves typecheck validation for us)

#### Ultimate goal

The DSL should be fully JSON declarative and thus be able to define runtime validation and be able to handle complex logic but not go overboard and thus restrict what is possible (see for example what is possible in survey.js).
