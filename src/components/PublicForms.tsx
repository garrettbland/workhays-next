"use client";

import { useActionState } from "react";
import { sendContact, submitEvent, subscribe } from "@/app/public-actions";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { FormMessage, SubmitButton } from "@/components/ui/Form";
import { Turnstile } from "@/components/Turnstile";

/** Off-screen field that only bots fill in. */
function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
      <label>Website<input type="text" name="website_hp" tabIndex={-1} autoComplete="off" /></label>
    </div>
  );
}

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, action] = useActionState(subscribe, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="flex flex-col gap-3">
      <Honeypot />
      <div className="flex flex-wrap gap-2">
        <label htmlFor={compact ? "nl-email-c" : "nl-email"} className="sr-only">Email address</label>
        <Input id={compact ? "nl-email-c" : "nl-email"} name="email" type="email" required placeholder="you@example.com" className="min-w-0 flex-[1_1_220px]" />
        <SubmitButton pendingLabel="…">Subscribe</SubmitButton>
      </div>
      <Turnstile resetKey={state} compact />
      <FormMessage state={state} />
    </form>
  );
}

export function EventSubmitForm() {
  const [state, action] = useActionState(submitEvent, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="flex max-w-[760px] flex-col gap-6">
      <Honeypot />
      <Field label="Event name" htmlFor="title"><Input id="title" name="title" required maxLength={200} /></Field>
      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Date" htmlFor="date"><Input id="date" name="date" type="date" required /></Field>
        <Field label="Starts" htmlFor="start_time" hint="Leave blank for all day."><Input id="start_time" name="start_time" type="time" /></Field>
        <Field label="Ends" htmlFor="end_time"><Input id="end_time" name="end_time" type="time" /></Field>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Where" htmlFor="location_name" hint="For example: Hays Public Library."><Input id="location_name" name="location_name" required /></Field>
        <Field label="Address" htmlFor="address"><Input id="address" name="address" /></Field>
      </div>
      <Field label="Link for more info" htmlFor="event_url"><Input id="event_url" name="event_url" type="url" placeholder="https://" /></Field>
      <Field label="Description" htmlFor="description"><Textarea id="description" name="description" rows={6} required maxLength={5000} /></Field>
      <label className="flex items-center gap-3 text-[15px]">
        <input type="checkbox" name="is_job_fair" className="size-5 accent-[#8a5a00]" /> This is a job fair or hiring event
      </label>
      <fieldset className="flex flex-col gap-4 border-t border-line pt-6">
        <legend className="mb-2 text-[15px] font-semibold">Your contact info <span className="font-normal text-muted">(not shown publicly)</span></legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Your name" htmlFor="submitter_name"><Input id="submitter_name" name="submitter_name" required /></Field>
          <Field label="Your email" htmlFor="submitter_email"><Input id="submitter_email" name="submitter_email" type="email" required /></Field>
        </div>
      </fieldset>
      <Turnstile resetKey={state} />
      <FormMessage state={state} />
      <div><SubmitButton variant="gold" pendingLabel="Sending…">Submit event for review</SubmitButton></div>
    </form>
  );
}

export function ContactForm({ initialMessage = "" }: { initialMessage?: string }) {
  const [state, action] = useActionState(sendContact, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="flex max-w-[640px] flex-col gap-6">
      <Honeypot />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name"><Input id="c-name" name="name" autoComplete="name" required /></Field>
        <Field label="Email" htmlFor="c-email"><Input id="c-email" name="email" type="email" autoComplete="email" required /></Field>
      </div>
      <Field label="Phone (optional)" htmlFor="c-phone"><Input id="c-phone" name="phone" type="tel" autoComplete="tel" /></Field>
      <Field label="Message" htmlFor="c-message"><Textarea id="c-message" name="message" rows={6} required defaultValue={initialMessage} /></Field>
      <Turnstile resetKey={state} />
      <FormMessage state={state} />
      <div><SubmitButton pendingLabel="Sending…">Send message</SubmitButton></div>
    </form>
  );
}
