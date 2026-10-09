import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Help", alternates: { canonical: "/help" } };

export default function Page() {
  return <InfoPage page="help" />;
}
