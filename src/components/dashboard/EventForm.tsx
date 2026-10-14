"use client";

import { useActionState } from "react";
import { createEvent } from "@/app/dashboard/actions";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ActionForm, FormMessage, SubmitButton } from "@/components/ui/Form";

export function EmployerEventForm({ employerId }: { employerId: string }) {
  const [state, action] = useActionState(createEvent, undefined);
  return (
    <ActionForm action={action} className="flex max-w-[760px] flex-col gap-6" key={state?.ok}>
      <input type="hidden" name="employer_id" value={employerId} />
      <Field label="Event name" htmlFor="ev-title"><Input id="ev-title" name="title" required maxLength={200} /></Field>
      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Date" htmlFor="ev-date"><Input id="ev-date" name="date" type="date" required /></Field>
        <Field label="Starts" htmlFor="ev-start" hint="Blank for all day."><Input id="ev-start" name="start_time" type="time" /></Field>
        <Field label="Ends" htmlFor="ev-end"><Input id="ev-end" name="end_time" type="time" /></Field>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Where" htmlFor="ev-loc"><Input id="ev-loc" name="location_name" required /></Field>
        <Field label="Address" htmlFor="ev-addr"><Input id="ev-addr" name="address" /></Field>
      </div>
      <Field label="Link for more info" htmlFor="ev-url"><Input id="ev-url" name="event_url" type="url" placeholder="https://" /></Field>
      <Field label="Description" htmlFor="ev-desc"><Textarea id="ev-desc" name="description" rows={5} required minLength={10} /></Field>
      <FormMessage state={state} />
      <div><SubmitButton variant="gold" pendingLabel="Posting…">Post event</SubmitButton></div>
    </ActionForm>
  );
}
