import type { Metadata } from "next";
import { VerifyForm } from "@/components/AuthForms";
import { PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Two-factor verification", robots: { index: false } };

export default function VerifyPage() {
  return (
    <PageShell narrow>
      <PageTitle sub="Open your authenticator app and enter the current code for Work Hays.">Two-factor check</PageTitle>
      <VerifyForm />
    </PageShell>
  );
}
