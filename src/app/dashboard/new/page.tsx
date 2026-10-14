import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { CreateEmployerForm } from "@/components/dashboard/NewEmployerForms";
import { Loading, PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Add a business", robots: { index: false } };

export default function NewEmployerPage() {
  return (
    <PageShell narrow>
      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </PageShell>
  );
}

async function Content() {
  await requireUser("/dashboard/new");
  return (
    <>
      <PageTitle sub="A moderator reviews new businesses, usually within a day. You can write job drafts while you wait.">
        Add a business
      </PageTitle>
      <CreateEmployerForm />
    </>
  );
}
