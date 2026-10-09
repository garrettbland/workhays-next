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
 * Only accounts that were approved ("verified") on the old site move over. Decided 2026-10-08:
 * unverified users and their businesses are not migrated. They can sign up again on the new site,
 * where new businesses go through moderator approval.
 *  - staff are always kept
 *  - verified accounts are kept unless they look like spam and never posted a job
 *  - pending and locked accounts are dropped
 */
export function classifyAccount(user: LegacyUser, employer: LegacyEmployer | undefined, jobCount: number): Decision {
  if (user.role === "admin" || user.role === "moderator") return "keep";
  if (user.status !== "verified") return "drop";
  if (jobCount === 0 && looksLikeSpam(user, employer)) return "drop";
  return "keep";
}
