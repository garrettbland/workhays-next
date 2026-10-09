import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-16">
      <h1 className="condensed text-[40px]">Page not found.</h1>
      <p className="mt-4 text-[17px] text-body">The page you’re looking for doesn’t exist or has moved.</p>
      <Link href="/" className="mt-8 inline-block bg-ink px-6 py-3.5 font-semibold text-white hover:text-white">See current jobs</Link>
    </main>
  );
}
