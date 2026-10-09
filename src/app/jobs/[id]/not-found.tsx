import Link from "next/link";

export default function JobNotFound() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-16">
      <h1 className="condensed text-[40px]">This job is no longer posted.</h1>
      <p className="mt-4 max-w-[560px] text-[17px] text-body">
        It may have been filled or expired. There are plenty of other openings in Hays and western Kansas.
      </p>
      <Link href="/" className="mt-8 inline-block bg-ink px-6 py-3.5 font-semibold text-white hover:text-white">
        See current jobs
      </Link>
    </main>
  );
}
