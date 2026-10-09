import type { Metadata } from "next";
import { ForgotForm } from "@/components/AuthForms";
import { PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <PageShell narrow>
      <PageTitle sub="Enter your email and we'll send you a link to choose a new password.">Reset password</PageTitle>
      <ForgotForm />
    </PageShell>
  );
}
