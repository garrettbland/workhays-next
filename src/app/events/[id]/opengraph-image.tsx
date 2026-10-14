import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getEvent } from "@/lib/data";
import { formatEventWhen } from "@/lib/format";
import { SITE } from "@/lib/site";

export const alt = "Event on Work Hays";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The picture shown when an event link is shared on Facebook, texts, etc. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ev = await getEvent(id);
  const when = ev ? formatEventWhen(ev.starts_at, ev.ends_at, ev.all_day) : null;
  const title = ev?.title ?? "Events in Hays";
  const [bold, regular] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/archivo-latin-800-normal.woff")),
    readFile(join(process.cwd(), "assets/fonts/archivo-latin-500-normal.woff")),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", padding: "64px 72px", color: "#111111", fontFamily: "Archivo" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "6px solid #111111", paddingBottom: 24 }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4 }}>WORK HAYS</div>
          <div style={{ fontSize: 26, color: "#8a5a00", fontWeight: 800, letterSpacing: 2 }}>EVENT</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          {when && <div style={{ fontSize: 34, color: "#8a5a00", fontWeight: 500 }}>{`${when.date} · ${when.time}`}</div>}
          <div style={{ fontSize: title.length > 60 ? 64 : 80, fontWeight: 800, lineHeight: 1.05, marginTop: 18, letterSpacing: -1 }}>{title}</div>
          {ev?.location_name && <div style={{ fontSize: 34, color: "#444444", fontWeight: 500, marginTop: 24 }}>{ev.location_name}</div>}
        </div>
        <div style={{ fontSize: 24, color: "#5b5b5b", fontWeight: 500 }}>{`${SITE.url.replace(/^https?:\/\//, "")}/events`}</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: bold, weight: 800, style: "normal" },
        { name: "Archivo", data: regular, weight: 500, style: "normal" },
      ],
    },
  );
}
