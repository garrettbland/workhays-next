import { Suspense } from "react";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { Loading } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Ads · Admin", robots: { index: false } };

export default function AdminAdsPage() {
  return (
    <>
      <h1 className="condensed mb-6 text-[36px] sm:text-[44px]">Ads and featured jobs</h1>
      <Suspense fallback={<Loading />}>
        <Placeholder />
      </Suspense>
    </>
  );
}

async function Placeholder() {
  await requireStaff("/admin/ads");
  return (
    <div className="max-w-[720px] text-[17px]">
      <p className="border-l-[3px] border-gold bg-gold-tint px-4 py-3">Coming after launch. The database is already set up for it, so nothing will need to move.</p>
      <h2 className="mt-8 text-[20px] font-bold">What will go here</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li><strong>Featured jobs:</strong> businesses pay (through Stripe) to pin a job to the top of the list for a set time. You&apos;ll see each purchase, when it ends, and can feature a job by hand.</li>
        <li><strong>Ads:</strong> banner spots on the home page and job pages. Upload an image and link, pick the dates, and turn it on or off.</li>
        <li><strong>Revenue:</strong> what&apos;s been sold, refunds, and what&apos;s running now.</li>
      </ul>
    </div>
  );
}
