import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-4 px-6 py-7 text-[14px] text-muted">
        <span>© Work Hays · Hays, Kansas</span>
        <nav aria-label="Footer" className="flex flex-wrap gap-5">
          <Link href="/about">About</Link>
          <Link href="/help">Help</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
