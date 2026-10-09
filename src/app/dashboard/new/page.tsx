import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClaimEmployerForm, CreateEmployerForm } from "@/components/dashboard/NewEmployerForms";
import { Loading, PageShell, PageTitle } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Add a business", robots: { index: false } };

export default function NewEmployerPage({ searchParams }: PageProps<"/dashboard/new">) {
  return (
    <PageShell narrow>
      <Suspense fallback={<Loading />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

async function Content({ searchParams }: Pick<PageProps<"/dashboard/new">, "searchParams">) {
  const sp = await searchParams;
  const claim = typeof sp.claim === "string" ? sp.claim : "";
  await requireUser(`/dashboard/new${claim ? `?claim=${claim}` : ""}`);

  if (claim) {
    const supabase = await createClient();
    const { data: employer } = await supabase.from("employers").select("id, name, is_claimable").eq("id", claim).maybeSingle();
    if (employer?.is_claimable) {
      return (
        <>
          <PageTitle sub="A moderator confirms claims before you can manage the listing.">Claim {employer.name}</PageTitle>
          <ClaimEmployerForm employerId={employer.id} employerName={employer.name} />
        </>
      );
    }
  }

  return (
    <>
      <PageTitle sub="A moderator reviews new businesses, usually within a day. You can write job drafts while you wait.">
        Add a business
      </PageTitle>
      <CreateEmployerForm />
    </>
  );
}
