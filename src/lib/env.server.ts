import "server-only";
import { z } from "zod";

// Optional settings left blank in .env (KEY=) count as not set.
const optional = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: optional(z.string().min(1)),
  INBOUND_EMAIL_DOMAIN: optional(z.string().min(3)),
  RESEND_WEBHOOK_SECRET: optional(z.string().startsWith("whsec_")),
  TURNSTILE_SECRET_KEY: optional(z.string().min(1)),
  CRON_SECRET: optional(z.string().min(16)),
});

/** Server-only secrets. Importing this from a client component fails the build. */
export const serverEnv = serverSchema.parse(process.env);
