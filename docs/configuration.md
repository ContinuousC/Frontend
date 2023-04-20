# Alert configuration

## Terminology

A ruleform consist of rules and templates. In templates you can choose the template type:

- Custom
- Fixed Traces
- Dynamic traces

Based on template type and settings within the template rules can be configured.

When creating a new ruleform:

1. Choose the template type and name
2. Configurate generic options and specific option for the template type
3. Define a default rule

## Design

The alert configuration is constructed with the [form lib](./form.md) and is used in the [Configurations page](../src/pages/Configurations.tsx) inside a tab Alerts where components [ConfigurationAlertRule](../src/components/ConfigurationAlertRule.tsx) is used. We have create two forms: rules and templates. The helper classes in [alertConfig](../src/utils/alertConfig.ts) help us to create the alert configuration form in two ways:

- Convert the [ValueSchemaExternal](./form.md#valueschemaexternal) to [ValueSchemaInternal](./form.md#valueschemainternal)
- Generate the [FormSpecification](./form.md#formspecification)

Implemented [validation](./form.md#validation):

- with the [zod schemas](../src/types/form.ts)
  - Schema validation
  - Field value validation: With custom types zod schema
  - With dynamic custom types (example: unique names when adding new ruleform)
- Validation between different field values at runtime (example: getDynamicOptions for label value in selector)
- Validation between different forms at runtime
  - For the template type 'custom' changing the template setting has an impact on how the rule will look, so we used a top level watch hook to update the rule FormSpecification if the template values changes, see [validation options in form](./form.md#validation)
