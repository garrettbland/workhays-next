"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-16">
      <h1 className="condensed text-[40px]">Something went wrong.</h1>
      <p className="mt-4 text-[17px] text-body">Please try again. If it keeps happening, let us know.</p>
      <button type="button" onClick={reset} className="mt-8 bg-ink px-6 py-3.5 font-semibold text-white">Try again</button>
    </main>
  );
}
