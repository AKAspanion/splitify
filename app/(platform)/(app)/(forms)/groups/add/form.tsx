"use client";

import { createGroup } from "@/actions/create-group";
import { useFormState } from "react-dom";
import { FormInput } from "./form-input";
import { FormButton } from "./form-button";

export const Form = () => {
  const intialState = { message: null, errors: undefined };
  const [state, dispatch] = useFormState(createGroup, intialState);

  return (
    <form className="flex flex-col gap-6" action={dispatch}>
      <FormInput
        id="title"
        name="title"
        placeholder="Group title"
        errors={state?.errors?.title}
      />
      <FormInput
        id="type"
        name="type"
        placeholder="Group type"
        errors={state?.errors?.type}
      />
      <FormButton />
    </form>
  );
};
