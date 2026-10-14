import { getEvent } from "@/lib/data";
import { toPlainText } from "@/lib/sanitize";
import { SITE } from "@/lib/site";

/** Calendar file (.ics) for "Add to calendar". Works with Apple, Google and Outlook calendars. */
export async function GET(_: Request, { params }: RouteContext<"/events/[id]/calendar.ics">) {
  const { id } = await params;
  const ev = await getEvent(id);
  if (!ev) return new Response("Not found", { status: 404 });

  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const localDate = (iso: string, addDays = 0) => {
    const d = new Date(new Date(iso).getTime() + addDays * 86400_000);
    return new Intl.DateTimeFormat("en-CA", { timeZone: SITE.timezone }).format(d).replace(/-/g, "");
  };
  const start = ev.all_day ? `DTSTART;VALUE=DATE:${localDate(ev.starts_at)}` : `DTSTART:${utc(ev.starts_at)}`;
  const end = ev.all_day
    ? `DTEND;VALUE=DATE:${localDate(ev.ends_at ?? ev.starts_at, 1)}`
    : `DTEND:${utc(ev.ends_at ?? new Date(new Date(ev.starts_at).getTime() + 3600_000).toISOString())}`;
  const url = `${SITE.url}/events/${ev.id}`;
  const host = new URL(SITE.url).hostname;
  // Lines over 75 octets are folded per RFC 5545.
  const fold = (line: string) => line.match(/.{1,73}/g)!.join("\r\n ");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE.name}//Events//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.id}@${host}`,
    `DTSTAMP:${utc(ev.starts_at)}`,
    start,
    end,
    `SUMMARY:${esc(ev.title)}`,
    `DESCRIPTION:${esc(`${toPlainText(ev.description_html).slice(0, 1500)}\n\n${url}`)}`,
    ...(ev.location_name || ev.address ? [`LOCATION:${esc([ev.location_name, ev.address].filter(Boolean).join(", "))}`] : []),
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].map(fold);
  const filename = ev.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 60) || "event";
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
    },
  });
}
