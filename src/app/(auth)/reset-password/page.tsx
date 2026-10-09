import type { Metadata } from "next";
import { ResetForm } from "@/components/AuthForms";
import { PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPage() {
  return (
    <PageShell narrow>
      <PageTitle>Choose a new password</PageTitle>
      <ResetForm />
    </PageShell>
  );
}
