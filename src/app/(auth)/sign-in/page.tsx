import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/AuthForms";
import { PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage() {
  return (
    <PageShell narrow>
      <PageTitle sub="Employers and their teams sign in here. Your password from the old Work Hays site still works.">Sign in</PageTitle>
      <SignInForm />
      <p className="mt-8 text-[15px]">New to Work Hays? <Link href="/sign-up" className="font-semibold underline underline-offset-[3px]">Create an employer account</Link></p>
    </PageShell>
  );
}
