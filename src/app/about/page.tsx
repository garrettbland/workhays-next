import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "About", alternates: { canonical: "/about" } };

export default function Page() {
  return <InfoPage page="about" />;
}
