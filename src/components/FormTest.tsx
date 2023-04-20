/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import Button from "@mui/material/Button";

import Form from "./Form";

import { FormSpecification } from "../types/form";

//In this example we will create a form to update a person's information. Beneath we will also add improvement for our validations.

//1. First we need to have the external typescript schema for the ValueSchemaExternal
type PersonInfoExternal = {
  name: string;
  email: string;
  address?: {
    country: string;
    city: string;
    street: string;
    number: number;
    state?: string;
  };
  favoriteFruit:
    | "oranges"
    | "bananas"
    | { apples: "green" | "red" }
    | { other: string };
  hobbies: ("football" | "tennis" | "volleybal")[];
  visitedCountries: {
    [key: string]: number;
  };
  isSubscribed: boolean;
};

//2. With the contract that the ValueSchemaInternal must adhere to for our form library, we generate the zodValueInternalSchema
const personInfoInternal = z.object({
  name: z.string().nonempty(),
  email: z.string().email(),
  address: z
    .object({
      country: z.string().nonempty(),
      city: z.string().nonempty(),
      street: z.string().nonempty(),
      number: z.number().positive(),
      state: z.string().nullable(),
    })
    .nullable(),
  favoriteFruit: z.union([
    z.literal("oranges"),
    z.literal("bananas"),
    z.object({
      apples: z.enum(["green", "red"]),
    }),
    z.object({
      other: z.string(),
    }),
  ]),
  hobbies: z.array(z.enum(["football", "tennis", "volleybal"])),
  visitedCountries: z.array(
    z.object({
      name: z.string().nonempty(),
      numberOfTimes: z.number().positive().min(1),
    })
  ),
  isSubscribed: z.boolean(),
});

//3. Infer the typescript ValueSchemaInternal from the zodValueInternalSchema
type PersonInfoInternal = z.infer<typeof personInfoInternal>;

//4. Generate the form with the type FormSpecification and given ValueSchemaInternal
const PERSON_FORMSPECIFICATION: FormSpecification<PersonInfoInternal>[] = [
  {
    formType: "toggle",
    name: "isSubscribed",
    label: "Payed subscription",
  },
  {
    formType: "group",
    name: "group",
    label: "Person info",
    withToggle: true,
    forms: [
      {
        label: "Legal info",
        form: [
          {
            formType: "textField",
            name: "email",
            label: "Email",
          },
          {
            formType: "textField",
            name: "name",
            label: "Name",
          },
          {
            formType: "subForm",
            name: "address",
            label: "Address",
            notRequired: {
              defaultValue: {
                country: "",
                city: "",
                street: "",
                number: 1,
                state: null,
              },
            },
            form: [
              {
                formType: "textField",
                name: "address.country",
                label: "Country",
              },
              {
                formType: "textField",
                name: "address.state",
                label: "State",
                notRequired: {
                  defaultValue: "",
                },
              },
              {
                formType: "textField",
                name: "address.city",
                label: "City",
              },
              {
                formType: "textField",
                name: "address.street",
                label: "Street",
              },
              {
                formType: "textField",
                name: "address.number",
                label: "number",
                number: "integer",
              },
            ],
          },
        ],
      },
      {
        label: "Personal info",
        form: [
          {
            formType: "select",
            name: "favoriteFruit",
            label: "Favorite fruit",
            options: [
              {
                name: "favoriteFruit",
                label: "Oranges",
                value: "oranges",
              },
              {
                name: "favoriteFruit",
                label: "Bananas",
                value: "bananas",
              },
              {
                defaultValueOnOpen: "red",
                form: {
                  formType: "select",
                  name: "favoriteFruit.apples",
                  label: "Apples",
                  options: [
                    {
                      name: "favoriteFruit.apples",
                      label: "Red",
                      value: "red",
                    },
                    {
                      name: "favoriteFruit.apples",
                      label: "Green",
                      value: "green",
                    },
                  ],
                },
              },
              {
                defaultValueOnOpen: "",
                form: {
                  formType: "textField",
                  name: "favoriteFruit.other",
                  label: "Other",
                },
              },
            ],
          },
          {
            formType: "select",
            name: "hobbies",
            label: "Hobbies",
            multiple: true,
            options: [
              {
                value: "football",
                name: "hobbies",
                label: "Football",
              },
              {
                value: "tennis",
                name: "hobbies",
                label: "Tennis",
              },
              {
                value: "volleybal",
                name: "hobbies",
                label: "Volleybal",
              },
            ],
          },
          {
            formType: "list",
            name: "visitedCountries",
            label: "Visited countries",
            emptyLabel: "country",
            addLabel: "country",
            formGenerator: (index) => {
              const form: FormSpecification<PersonInfoInternal>[] = [
                {
                  formType: "textField",
                  name: `visitedCountries.${index}.name`,
                  label: "Country",
                },
                {
                  formType: "textField",
                  name: `visitedCountries.${index}.numberOfTimes`,
                  label: "Number of times visited",
                  number: "integer",
                },
              ];
              return form;
            },
            schemaResolver: personInfoInternal.shape.visitedCountries.element,
            newValueDefault: {
              name: "",
              numberOfTimes: 1,
            },
          },
        ],
      },
    ],
  },
];

//5. If needed, create functionality to convert from ValueSchemaExternal to ValueSchemaInternal and vice versa.
class PersonInfo {
  static convertToValueInternal(
    personInfoExternalValue: PersonInfoExternal
  ): PersonInfoInternal {
    return {
      name: personInfoExternalValue.name,
      email: personInfoExternalValue.email,
      address:
        personInfoExternalValue.address !== undefined
          ? {
              country: personInfoExternalValue.address.country,
              city: personInfoExternalValue.address.city,
              street: personInfoExternalValue.address.street,
              number: personInfoExternalValue.address.number,
              state: personInfoExternalValue.address.state || null,
            }
          : null,
      favoriteFruit: personInfoExternalValue.favoriteFruit,
      hobbies: personInfoExternalValue.hobbies,
      visitedCountries: Object.entries(
        personInfoExternalValue.visitedCountries
      ).map(([name, value]) => ({
        name: name,
        numberOfTimes: value,
      })),
      isSubscribed: personInfoExternalValue.isSubscribed,
    };
  }

  static convertToValueExternal(
    personInfoInternalValue: PersonInfoInternal
  ): PersonInfoExternal {
    return {
      name: personInfoInternalValue.name,
      email: personInfoInternalValue.email,
      address:
        personInfoInternalValue.address !== null
          ? {
              country: personInfoInternalValue.address.country,
              city: personInfoInternalValue.address.city,
              street: personInfoInternalValue.address.street,
              number: personInfoInternalValue.address.number,
              state: personInfoInternalValue.address.state || undefined,
            }
          : undefined,
      favoriteFruit: personInfoInternalValue.favoriteFruit,
      hobbies: personInfoInternalValue.hobbies,
      visitedCountries: Object.fromEntries(
        personInfoInternalValue.visitedCountries.map((visitedCountry) => [
          visitedCountry.name,
          visitedCountry.numberOfTimes,
        ])
      ),
      isSubscribed: personInfoInternalValue.isSubscribed,
    };
  }

  static getFormSpecification(): FormSpecification<PersonInfoInternal>[] {
    return PERSON_FORMSPECIFICATION;
  }

  static fetchPersonInfoExternal(): PersonInfoExternal {
    return {
      name: "John Doe",
      email: "johndoe@gmail.com",
      address: {
        country: "Belgium",
        city: "Leuven",
        street: "Mercatorpad",
        number: 15,
        state: undefined,
      },
      favoriteFruit: {
        apples: "red",
      },
      hobbies: ["tennis", "football"],
      visitedCountries: {
        France: 5,
        Germany: 1,
      },
      isSubscribed: false,
    };
  }

  static savePersonInfoExternal(personInfoExternalValue: PersonInfoExternal) {
    console.log("savePersonInfoExternal", personInfoExternalValue);
  }
}

//6. Render component by using useForm hook, FormProvider context and Form component.
export default function FormTest() {
  const personInfoExternalValue = PersonInfo.fetchPersonInfoExternal();
  const personInfoInternalValue = PersonInfo.convertToValueInternal(
    personInfoExternalValue
  );

  const personFormOutput = useForm<PersonInfoInternal>({
    values: personInfoInternalValue,
    defaultValues: personInfoInternalValue,
    resolver: zodResolver(personInfoInternal),
  });

  function handleSubmit() {
    personFormOutput.handleSubmit((newPersonInfoValue) => {
      const newPersonInfoExternal =
        PersonInfo.convertToValueExternal(newPersonInfoValue);
      PersonInfo.savePersonInfoExternal(newPersonInfoExternal);
    })();
  }

  const personFormSpecification = PersonInfo.getFormSpecification();

  return (
    <div className="flex flex-col gap-2 h-full">
      <Button onClick={handleSubmit}>Save</Button>
      {Object.keys(personFormOutput.formState.errors).length > 0 &&
        Object.entries(personFormOutput.formState.errors).map(
          ([field, error]) => (
            <div key={field}>
              {field}: {error.message}
            </div>
          )
        )}
      <div className="overflow-auto h-full">
        <FormProvider {...personFormOutput}>
          <Form form={personFormSpecification} />
        </FormProvider>
      </div>
    </div>
  );
}

// Improve validation

// Let say that we must respect following validation logic

// - name must be unique
// - email must be a valid and unique
// - If address is defined, it must be a valid address.
// - VisitedCountries is a list that can be updated and the number represent the number of time visited.
//   - the keys in visitedCountries must be a valid country
//   - the number must always be greater than 1

// We can implements this with following setup:

// - For name and email fetching all existing values and updating the zodValueInternalSchema with a custom type
// - For address:
//   - use getDynamicOptions to retrieve the list of countries, cities, streets
//   - use personFormOutput.watch 'address.country' to:
//     - update the FormSpecification to make a state not an option if the country requires a state
//     - Optionally create a new zodValueInternalSchema and use this in UseForm.
//   - use the onWatch in the [generic settings](#generic-settings) to update the field of dependend fields:
//     - Update state value if country changes (value depends on city and country)
//     - Update city value if country or state changes
//     - Update streets value if country, state or city changes
//     - Update number value if country, state, city or street changes
//   - use the onWatch in getDynamicOptions to update option if a dependant field changes:
//     - Update state options if country changes (options depends on city and country)
//     - Update city options if country or state changes
//     - Update streets options if country, state or city changes
//     - Update number options if country, state, city or street changes
// - For name (the country) in visitedCountries:
//   - use getDynamicOptions to retrieve the list of countries
