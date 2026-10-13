import Link from "next/link";
import { NewsletterForm } from "@/components/PublicForms";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-start justify-between gap-8 px-6 pb-4 pt-10">
        <div className="max-w-[420px] flex-[1_1_320px]">
          <h2 className="condensed text-[22px]">New jobs every Monday</h2>
          <p className="mb-4 mt-1 text-[15px] text-body">One email a week with new jobs in Hays and western Kansas.</p>
          <NewsletterForm compact />
        </div>
        <div className="flex gap-12 text-[15px]">
          <nav aria-label="For employers" className="flex flex-col gap-2">
            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-muted">Employers</span>
            <a href="/post-a-job">Post a job</a>
            <Link href="/events/submit">Submit an event</Link>
            <Link href="/sign-in">Sign in</Link>
          </nav>
          <nav aria-label="Work Hays" className="flex flex-col gap-2">
            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-muted">Work Hays</span>
            <Link href="/about">About</Link>
            <Link href="/help">Help</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-4 px-6 py-6 text-[14px] text-muted">
        <span>© Work Hays · Hays, Kansas</span>
        <nav aria-label="Legal" className="flex flex-wrap gap-5">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
