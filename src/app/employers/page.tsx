import type { Metadata } from "next";
import Link from "next/link";
import { getEmployers, getLiveJobs } from "@/lib/data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Employers",
  description: "Businesses and organizations hiring in Hays and western Kansas.",
  alternates: { canonical: "/employers" },
};

export default async function EmployersPage() {
  const [employers, jobs] = await Promise.all([getEmployers(SITE.id), getLiveJobs(SITE.id)]);
  const counts = new Map<string, number>();
  for (const j of jobs) counts.set(j.employer_id, (counts.get(j.employer_id) ?? 0) + 1);

  const hiring = employers.filter((e) => counts.has(e.id)).sort((a, b) => counts.get(b.id)! - counts.get(a.id)!);
  const groups = new Map<string, { id: string; name: string }[]>();
  for (const e of employers) {
    const letter = /^[a-z]/i.test(e.name.trim()) ? e.name.trim()[0].toUpperCase() : "#";
    groups.set(letter, [...(groups.get(letter) ?? []), e]);
  }

  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-12">
      <h1 className="condensed text-[40px] sm:text-[52px]">Employers</h1>

      <section className="mt-10">
        <h2 className="border-b-[3px] border-ink pb-3 font-mono text-[13px] uppercase tracking-[0.08em]">Hiring now</h2>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-8">
          {hiring.map((e) => (
            <li key={e.id} className="border-b border-line">
              <Link href={`/employers/${e.id}`} className="flex items-baseline justify-between gap-4 py-3.5">
                <span className="font-bold">{e.name}</span>
                <span className="shrink-0 font-mono text-[12px] uppercase text-gold">
                  {counts.get(e.id)} {counts.get(e.id) === 1 ? "job" : "jobs"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="border-b-[3px] border-ink pb-3 font-mono text-[13px] uppercase tracking-[0.08em]">All employers A–Z</h2>
        <nav aria-label="Jump to letter" className="flex flex-wrap gap-3 border-b border-line py-3 font-mono text-[13px]">
          {[...groups.keys()].map((l) => (
            <a key={l} href={`#letter-${l}`}>{l}</a>
          ))}
        </nav>
        <div className="mt-6 columns-1 gap-8 sm:columns-2 lg:columns-3">
          {[...groups.entries()].map(([letter, list]) => (
            <div key={letter} id={`letter-${letter}`} className="mb-6 break-inside-avoid">
              <h3 className="condensed text-[24px]">{letter}</h3>
              <ul className="mt-2 space-y-1.5 text-[15px]">
                {list.map((e) => (
                  <li key={e.id}><Link href={`/employers/${e.id}`}>{e.name}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
