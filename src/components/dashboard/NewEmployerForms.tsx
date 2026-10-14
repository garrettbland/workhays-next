"use client";

import { useActionState } from "react";
import { claimEmployer, createEmployer } from "@/app/dashboard/actions";
import { Field, Input, Textarea } from "@/components/ui/Field";
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

export function ClaimEmployerForm({ employerId, employerName }: { employerId: string; employerName: string }) {
  const [state, action] = useActionState(claimEmployer, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <ActionForm action={action} className="flex flex-col gap-5">
      <input type="hidden" name="employer_id" value={employerId} />
      <input type="hidden" name="employer_name" value={employerName} />
      <Field label="How are you connected to this business?" htmlFor="message" hint="For example: “I'm the HR manager.” This helps us approve you quickly.">
        <Textarea id="message" name="message" rows={3} maxLength={500} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton variant="gold" pendingLabel="Sending…">Request to claim {employerName}</SubmitButton>
    </ActionForm>
  );
}
