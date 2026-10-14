import "server-only";

export const PAGE_SIZE = 50;

export type ListParams = { q: string; status: string; page: number; from: number; to: number };

/** Reads ?q=, ?status= and ?page= from an admin list URL. */
export function listParams(sp: Record<string, string | string[] | undefined>, defaultStatus = "all"): ListParams {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);
  return {
    q: one(sp.q).trim().slice(0, 100),
    status: one(sp.status) || defaultStatus,
    page,
    from: (page - 1) * PAGE_SIZE,
    to: page * PAGE_SIZE - 1,
  };
}

/** A search term that's safe inside PostgREST ilike/or filters. */
export function ilike(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/[,()"]/g, " ")}%`;
}

export const personName = (p: { first_name: string | null; last_name: string | null; email: string } | null | undefined) =>
  p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email : "Unknown";

/** "Now" and "24 hours ago" as ISO strings. Only call from request-time code. */
export function timeCutoffs() {
  const now = Date.now();
  return { now: new Date(now).toISOString(), dayAgo: new Date(now - 86400_000).toISOString() };
}
