import { Suspense } from "react";
import { getMyEmployer } from "@/lib/dashboard";
import { assetUrl } from "@/lib/site";
import { EmployerProfileForm, LogoForm } from "@/components/dashboard/ProfileForms";
import { Loading } from "@/components/ui/Page";

export default function ProfilePage({ params }: PageProps<"/dashboard/[employerId]/profile">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/dashboard/[employerId]/profile">, "params">) {
  const { employerId } = await params;
  const { employer, canManage } = await getMyEmployer(employerId, `/dashboard/${employerId}/profile`);
  if (!canManage) {
    return <p className="text-body">Only owners and admins can edit the business profile. Ask one of them if something needs changing.</p>;
  }
  return (
    <div className="flex flex-col gap-12">
      <LogoForm employerId={employer.id} logoUrl={assetUrl(employer.logo_path)} />
      <EmployerProfileForm employer={employer} />
    </div>
  );
}
