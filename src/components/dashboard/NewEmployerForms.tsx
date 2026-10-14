"use client";

import { useActionState } from "react";
import { createEmployer } from "@/app/dashboard/actions";
import { Field, Input } from "@/components/ui/Field";
import { ActionForm, FormMessage, SubmitButton } from "@/components/ui/Form";

export function CreateEmployerForm() {
  const [state, action] = useActionState(createEmployer, undefined);
  return (
    <ActionForm action={action} className="flex flex-col gap-5">
      <Field label="Business name" htmlFor="name" hint="As customers and applicants know it.">
        <Input id="name" name="name" required minLength={2} maxLength={200} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton variant="gold" pendingLabel="Adding…">Add business</SubmitButton>
    </ActionForm>
  );
}
