export type LegacyUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  password: string;
  status: "pending" | "verified" | "locked";
  role: "employer" | "moderator" | "admin";
  created_at: Date;
  updated_at: Date;
};

export type LegacyEmployer = {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  header_image_url: string | null;
  website_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  created_at: Date;
  updated_at: Date;
};

export type Decision = "keep" | "drop";
export type Verdict = Decision | "duplicate";

const SPAM_PATTERN = new RegExp(
  [
    "loan", "financ", "\\batm\\b", "whatsapp", "assignment", "essay", "crypto", "bitcoin", "casino", "\\bseo\\b",
    "hack", "credit", "lender", "invest", "escort", "viagra", "aborsi", "\\bobat\\b", "slot", "bonus", "gacor",
    "togel", "judi", "pharm", "phamarcy", "patches", "ghostwrit", "backlink", "followers", "\\bcbd\\b", "keto",
    "occult", "ritual", "\\bspell", "\\bwa\\s?\\+?\\d", "\\+\\d{8,}", "\\d{4}\\s?\\d{4}\\s?\\d{4}",
  ].join("|"),
  "i",
);

/** Random mixed-case names like "cUeKnhrM" that bots generate. */
const BOT_NAME = /^[A-Za-z]*[a-z][A-Z][a-z]*[A-Z]/;

export function looksLikeSpam(user: LegacyUser, employer?: LegacyEmployer): boolean {
  const text = [employer?.title, user.first_name, user.last_name, user.email].filter(Boolean).join(" ");
  return SPAM_PATTERN.test(text) || BOT_NAME.test(user.first_name ?? "");
}

/**
 * Same rules used for the production cleanup on 2026-10-08:
 *  - staff, anyone who has posted, and approved businesses with a name are kept (unless the name is spam with no jobs)
 *  - unapproved accounts with no business name are dropped
 *  - the in-between "review" group: obvious spam is dropped, the rest is kept as PENDING businesses,
 *    which still need moderator approval in the new system before anything is public.
 */
export function classifyAccount(user: LegacyUser, employer: LegacyEmployer | undefined, jobCount: number): Decision {
  if (user.role === "admin" || user.role === "moderator") return "keep";
  if (jobCount > 0) return "keep";
  const hasName = !!employer?.title?.trim();
  if (!hasName && user.status !== "verified") return "drop";
  if (looksLikeSpam(user, employer)) return "drop";
  if (user.status === "locked") return "drop";
  return "keep";
}
