import Link from "next/link";

const NAV = [
  { href: "/", label: "Jobs" },
  { href: "/events", label: "Events" },
  { href: "/employers", label: "Employers" },
  { href: "/sign-in", label: "Sign in" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-[18px]">
        <Link href="/" className="wide text-[16px] font-extrabold tracking-[0.06em]">
          WORK HAYS
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[15px]">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <a
            href="/post-a-job"
            className="bg-gold px-4 py-2.5 font-semibold text-white hover:bg-gold-dark hover:text-white"
          >
            Post a job, free
          </a>
        </nav>
      </div>
    </header>
  );
}
