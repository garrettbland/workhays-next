"use client";

import { useActionState } from "react";
import { saveJob } from "@/app/dashboard/actions";
import { adminSaveJob } from "@/app/admin/actions";
import { Field, Input, Select } from "@/components/ui/Field";
import { ActionForm, FormMessage, SubmitButton } from "@/components/ui/Form";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";

export type JobFormValues = {
  id?: string;
  status?: string;
  title: string;
  job_type: string;
  industry: string | null;
  location: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_period: string | null;
  application_url: string | null;
  application_email: string | null;
  description_html: string;
  auto_renew: boolean;
};

const TYPES = [
  ["full_time", "Full-time"],
  ["part_time", "Part-time"],
  ["contract", "Contract"],
  ["temporary", "Temporary"],
  ["seasonal", "Seasonal"],
  ["internship", "Internship"],
];

export function JobForm({
  employerId,
  values,
  industries,
  canPublish,
  admin = false,
}: {
  employerId: string;
  values: JobFormValues;
  industries: { slug: string; name: string }[];
  canPublish: boolean;
  /** Staff editing from /admin: saves content only and returns to the admin job page. */
  admin?: boolean;
}) {
  const [state, action] = useActionState(admin ? adminSaveJob : saveJob, undefined);
  const isLive = admin || values.status === "active";

  return (
    <ActionForm action={action} className="flex max-w-[760px] flex-col gap-6">
      <input type="hidden" name="employer_id" value={employerId} />
      {values.id && <input type="hidden" name="job_id" value={values.id} />}

      <Field label="Job title" htmlFor="title">
        <Input id="title" name="title" defaultValue={values.title} required maxLength={200} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Type" htmlFor="job_type">
          <Select id="job_type" name="job_type" defaultValue={values.job_type}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Industry" htmlFor="industry">
          <Select id="industry" name="industry" defaultValue={values.industry ?? ""}>
            <option value="">Choose one</option>
            {industries.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="Location" htmlFor="location" hint="Town, if it isn't Hays. For example: Russell, KS.">
        <Input id="location" name="location" defaultValue={values.location ?? ""} maxLength={120} />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[15px] font-semibold">Pay <span className="font-normal text-muted">(optional, but jobs with pay get more applicants)</span></legend>
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="pay_min">Minimum pay</label>
          <Input id="pay_min" name="pay_min" type="number" min={0} step="0.01" placeholder="From" defaultValue={values.pay_min ?? ""} className="max-w-[160px]" />
          <span aria-hidden="true">–</span>
          <label className="sr-only" htmlFor="pay_max">Maximum pay</label>
          <Input id="pay_max" name="pay_max" type="number" min={0} step="0.01" placeholder="To" defaultValue={values.pay_max ?? ""} className="max-w-[160px]" />
          <label className="sr-only" htmlFor="pay_period">Per</label>
          <Select id="pay_period" name="pay_period" defaultValue={values.pay_period ?? "hour"} className="max-w-[160px]">
            <option value="hour">per hour</option>
            <option value="week">per week</option>
            <option value="month">per month</option>
            <option value="year">per year</option>
          </Select>
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Application link" htmlFor="application_url" hint="Where applicants apply online.">
          <Input id="application_url" name="application_url" type="url" placeholder="https://" defaultValue={values.application_url ?? ""} />
        </Field>
        <Field label="…or application email" htmlFor="application_email" hint="We'll show an “Apply by email” button.">
          <Input id="application_email" name="application_email" type="email" defaultValue={values.application_email ?? ""} />
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[15px] font-semibold" id="desc-label">Description</span>
        <RichTextEditor
          name="description_html"
          label="Job description"
          initialHtml={values.description_html}
          placeholder="What the job involves, requirements, schedule, benefits…"
        />
      </div>

      <label className="flex items-start gap-3 text-[15px]">
        <input type="checkbox" name="auto_renew" defaultChecked={values.auto_renew} className="mt-1 size-5 accent-[#8a5a00]" />
        <span>
          <strong>Keep this job up automatically.</strong> We&apos;ll renew it every 30 days and check in by email every 60 days to make
          sure you&apos;re still hiring.
        </span>
      </label>

      <FormMessage state={state} />

      <div className="flex flex-wrap gap-3 border-t-[3px] border-ink pt-6">
        {isLive ? (
          <SubmitButton name="intent" value="save" variant="gold" pendingLabel="Saving…">Save changes</SubmitButton>
        ) : (
          <>
            {canPublish && <SubmitButton name="intent" value="publish" variant="gold" pendingLabel="Publishing…">Publish job</SubmitButton>}
            <SubmitButton name="intent" value="draft" variant="secondary" pendingLabel="Saving…">Save draft</SubmitButton>
          </>
        )}
      </div>
      {!admin && !canPublish && !isLive && <p className="text-[14px] text-muted">You can publish once your business is approved.</p>}
    </ActionForm>
  );
}
