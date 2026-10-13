import { sanitizeRichText } from "@/lib/sanitize";
import { SITE } from "@/lib/site";

/** "2026-11-05" + "18:30" in Central time → ISO timestamp. */
export function zonedIso(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const offsetMin = (() => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: SITE.timezone, timeZoneName: "shortOffset" })
      .formatToParts(new Date(guess))
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT-6";
    const match = parts.match(/GMT([+-]\d+)(?::(\d+))?/);
    return match ? Number(match[1]) * 60 + Math.sign(Number(match[1])) * Number(match[2] ?? 0) : -360;
  })();
  return new Date(guess - offsetMin * 60_000).toISOString();
}

/** Plain text from a textarea → safe paragraphs. */
export function plainToHtml(text: string): string {
  return sanitizeRichText(
    text
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`)
      .join(""),
  );
}

