import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/AuthForms";
import { PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Create an employer account", robots: { index: false } };

export default function SignUpPage() {
  return (
    <PageShell narrow>
      <PageTitle sub="Post jobs and events for free. Invite your team once you're set up.">Create an employer account</PageTitle>
      <SignUpForm />
      <p className="mt-8 text-[15px]">Already have an account? <Link href="/sign-in" className="font-semibold underline underline-offset-[3px]">Sign in</Link></p>
    </PageShell>
  );
}
