"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type RefObject } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendContact, submitEvent, subscribe } from "@/app/public-actions";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ActionForm, FormMessage, SubmitButton } from "@/components/ui/Form";
import { Turnstile } from "@/components/Turnstile";

/** Off-screen field that only bots fill in. */
function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
      <label>Website<input type="text" name="website_hp" tabIndex={-1} autoComplete="off" /></label>
    </div>
  );
}

type Me = { name: string; email: string; businesses: { id: string; name: string }[] };

/** If someone is signed in, look up their name, email and approved businesses (in the browser, so pages stay cached). */
function useSignedInUser(): Me | null {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    if (!document.cookie.includes("-auth-token")) return;
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const [{ data: profile }, { data: members }] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, email").eq("id", auth.user.id).maybeSingle(),
        supabase.from("employer_members").select("employer:employers(id, name, status)").eq("user_id", auth.user.id),
      ]);
      if (cancelled) return;
      type Emp = { id: string; name: string; status: string } | null;
      setMe({
        name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
        email: profile?.email ?? auth.user.email ?? "",
        businesses: (members ?? [])
          .map((m) => m.employer as unknown as Emp)
          .filter((e): e is NonNullable<Emp> => !!e && e.status === "approved")
          .map(({ id, name }) => ({ id, name })),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return me;
}

/** Fill empty fields with the signed-in person's details, without overwriting anything typed. */
function usePrefill(form: RefObject<HTMLFormElement | null>, me: Me | null, fields: { name: string; email: string }) {
  useEffect(() => {
    if (!me || !form.current) return;
    for (const [field, value] of [[fields.name, me.name], [fields.email, me.email]] as const) {
      const input = form.current.elements.namedItem(field) as HTMLInputElement | null;
      if (input && !input.value && value) input.value = value;
    }
  }, [me, form, fields.name, fields.email]);
}

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, action] = useActionState(subscribe, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <ActionForm action={action} className="flex flex-col gap-3">
      <Honeypot />
      <div className="flex flex-wrap gap-2">
        <label htmlFor={compact ? "nl-email-c" : "nl-email"} className="sr-only">Email address</label>
        <Input id={compact ? "nl-email-c" : "nl-email"} name="email" type="email" required placeholder="you@example.com" className="min-w-0 flex-[1_1_220px]" />
        <SubmitButton pendingLabel="…">Subscribe</SubmitButton>
      </div>
      <Turnstile resetKey={state} compact />
      <FormMessage state={state} />
    </ActionForm>
  );
}

export function EventSubmitForm() {
  const [state, action] = useActionState(submitEvent, undefined);
  const me = useSignedInUser();
  const ref = useRef<HTMLFormElement>(null);
  usePrefill(ref, me, { name: "submitter_name", email: "submitter_email" });
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <ActionForm ref={ref} action={action} className="flex max-w-[760px] flex-col gap-6">
      {me && me.businesses.length > 0 && (
        <p className="border-l-[3px] border-gold bg-gold-tint px-4 py-3 text-[15px]">
          Posting for {me.businesses.length === 1 ? me.businesses[0].name : "your business"}? Post it from{" "}
          {me.businesses.map((b, i) => (
            <span key={b.id}>
              {i > 0 && (i === me.businesses.length - 1 ? " or " : ", ")}
              <Link href={`/dashboard/${b.id}/events`} className="font-semibold underline underline-offset-[3px]">
                {me.businesses.length === 1 ? "your dashboard" : `${b.name}'s dashboard`}
              </Link>
            </span>
          ))}{" "}
          instead and it goes live right away, under your business name.
        </p>
      )}
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
      <Field label="Description" htmlFor="description" hint="What it is, who it's for, and anything people should bring. At least 10 characters.">
        <Textarea id="description" name="description" rows={6} required minLength={10} maxLength={5000} />
      </Field>
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
    </ActionForm>
  );
}

export function ContactForm({ initialMessage = "" }: { initialMessage?: string }) {
  const [state, action] = useActionState(sendContact, undefined);
  const me = useSignedInUser();
  const ref = useRef<HTMLFormElement>(null);
  usePrefill(ref, me, { name: "name", email: "email" });
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <ActionForm ref={ref} action={action} className="flex max-w-[640px] flex-col gap-6">
      <Honeypot />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name"><Input id="c-name" name="name" autoComplete="name" required /></Field>
        <Field label="Email" htmlFor="c-email"><Input id="c-email" name="email" type="email" autoComplete="email" required /></Field>
      </div>
      <Field label="Phone (optional)" htmlFor="c-phone"><Input id="c-phone" name="phone" type="tel" autoComplete="tel" /></Field>
      <Field label="Message" htmlFor="c-message"><Textarea id="c-message" name="message" rows={6} required minLength={10} defaultValue={initialMessage} /></Field>
      <Turnstile resetKey={state} />
      <FormMessage state={state} />
      <div><SubmitButton pendingLabel="Sending…">Send message</SubmitButton></div>
    </ActionForm>
  );
}
