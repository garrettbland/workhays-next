import { Suspense } from "react";
import Link from "next/link";
import { AdminNav, AdminNavLinks } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pb-20 pt-10">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[13px] text-muted">
          <span className="uppercase tracking-[0.08em]">Admin</span>
          <span className="flex gap-4">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/account">Account</Link>
            <form action="/sign-out" method="post"><button type="submit" className="hover:text-gold">Sign out</button></form>
          </span>
        </div>
        <Suspense fallback={<AdminNavLinks path={null} />}>
          <AdminNav />
        </Suspense>
      </header>
      {children}
    </main>
  );
}
