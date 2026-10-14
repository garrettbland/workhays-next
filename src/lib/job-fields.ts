import "server-only";
import { z } from "zod";
import { sanitizeRichText, toPlainText } from "@/lib/sanitize";

const url = z.union([z.literal(""), z.url({ message: "Enter a full web address, starting with https://" })]);
const money = z.union([z.literal(""), z.coerce.number().min(0).max(10_000_000)]);
const jobSchema = z
  .object({
    title: z.string().trim().min(3, "Enter a job title").max(200),
    job_type: z.enum(["full_time", "part_time", "contract", "temporary", "seasonal", "internship"]),
    industry: z.string().trim().max(80),
    location: z.string().trim().max(120),
    pay_min: money,
    pay_max: money,
    pay_period: z.union([z.literal(""), z.enum(["hour", "week", "month", "year"])]),
    application_url: url,
    application_email: z.union([z.literal(""), z.email("Enter a valid application email")]),
    description_html: z.string().max(100_000),
  })
  .refine((d) => d.application_url || d.application_email, {
    message: "Add a link or an email address where people can apply.",
  })
  .refine((d) => d.pay_min === "" || d.pay_max === "" || Number(d.pay_max) >= Number(d.pay_min), {
    message: "The maximum pay should be more than the minimum.",
  });

const KEYS = ["title", "job_type", "industry", "location", "pay_min", "pay_max", "pay_period", "application_url", "application_email", "description_html"];
const optional = (v: string) => (v === "" ? null : v);

/** The editable fields of a job from the job form (shared by the dashboard and admin). */
export function parseJobFields(form: FormData) {
  const parsed = jobSchema.safeParse(Object.fromEntries(KEYS.map((k) => [k, String(form.get(k) ?? "").trim()])));
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;
  const d = parsed.data;
  const description = sanitizeRichText(d.description_html);
  if (toPlainText(description).length < 30) return { error: "Add a description of at least a couple of sentences." } as const;
  return {
    fields: {
      title: d.title,
      job_type: d.job_type,
      industry: optional(d.industry),
      location: optional(d.location),
      pay_min: d.pay_min === "" ? null : d.pay_min,
      pay_max: d.pay_max === "" ? null : d.pay_max,
      pay_period: d.pay_min === "" && d.pay_max === "" ? null : optional(d.pay_period) ?? "hour",
      application_url: optional(d.application_url),
      application_email: optional(d.application_email.toLowerCase()),
      description_html: description,
      auto_renew: form.get("auto_renew") === "on",
    },
  } as const;
}
