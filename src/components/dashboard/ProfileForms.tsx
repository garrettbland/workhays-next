"use client";

import { useActionState } from "react";
import { saveEmployer, uploadLogo } from "@/app/dashboard/actions";
import { Field, Input } from "@/components/ui/Field";
import { ActionForm, FormMessage, SubmitButton } from "@/components/ui/Form";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import type { EmployerRow } from "@/lib/dashboard";

export function EmployerProfileForm({ employer }: { employer: EmployerRow }) {
  const [state, action] = useActionState(saveEmployer, undefined);
  return (
    <ActionForm action={action} className="flex max-w-[760px] flex-col gap-6">
      <input type="hidden" name="employer_id" value={employer.id} />
      <Field label="Business name" htmlFor="name"><Input id="name" name="name" defaultValue={employer.name} required /></Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Contact person" htmlFor="contact_name"><Input id="contact_name" name="contact_name" defaultValue={employer.contact_name ?? ""} /></Field>
        <Field label="Phone" htmlFor="phone"><Input id="phone" name="phone" type="tel" defaultValue={employer.phone ?? ""} /></Field>
      </div>
      <Field label="Public contact email" htmlFor="email" hint="Shown on your business page.">
        <Input id="email" name="email" type="email" defaultValue={employer.email ?? ""} />
      </Field>
      <Field label="Website" htmlFor="website_url"><Input id="website_url" name="website_url" type="url" placeholder="https://" defaultValue={employer.website_url ?? ""} /></Field>
      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Facebook" htmlFor="facebook_url"><Input id="facebook_url" name="facebook_url" type="url" placeholder="https://" defaultValue={employer.facebook_url ?? ""} /></Field>
        <Field label="Instagram" htmlFor="instagram_url"><Input id="instagram_url" name="instagram_url" type="url" placeholder="https://" defaultValue={employer.instagram_url ?? ""} /></Field>
        <Field label="LinkedIn" htmlFor="linkedin_url"><Input id="linkedin_url" name="linkedin_url" type="url" placeholder="https://" defaultValue={employer.linkedin_url ?? ""} /></Field>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[15px] font-semibold">About the business</span>
        <RichTextEditor name="description_html" label="About the business" initialHtml={employer.description_html ?? ""} placeholder="What you do, where you are, why people like working there." />
      </div>
      <FormMessage state={state} />
      <div><SubmitButton variant="gold" pendingLabel="Saving…">Save profile</SubmitButton></div>
    </ActionForm>
  );
}

export function LogoForm({ employerId, logoUrl }: { employerId: string; logoUrl: string | null }) {
  const [state, action] = useActionState(uploadLogo, undefined);
  return (
    <ActionForm action={action} className="flex max-w-[760px] flex-col gap-4">
      <input type="hidden" name="employer_id" value={employerId} />
      <div className="flex flex-wrap items-center gap-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Current logo" className="size-20 border border-line object-contain" />
        ) : (
          <div className="flex size-20 items-center justify-center border border-dashed border-line text-[12px] text-muted">No logo</div>
        )}
        <Field label="Logo" htmlFor="logo" hint="PNG, JPG or WebP, up to 2 MB. Square works best.">
          <input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="text-[15px]" />
        </Field>
      </div>
      <FormMessage state={state} />
      <div><SubmitButton variant="secondary" pendingLabel="Uploading…">Upload logo</SubmitButton></div>
    </ActionForm>
  );
}
