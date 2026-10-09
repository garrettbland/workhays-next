import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

export default function Page() {
  return <InfoPage page="terms" />;
}
