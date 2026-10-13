"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

/** "Dashboard" when a Supabase session cookie exists, otherwise "Sign in". Keeps the header static/cached. */
export function AccountLink() {
  const signedIn = useSyncExternalStore(
    () => () => {},
    () => /(?:^|; )sb-[^=]+-auth-token(?:\.0)?=/.test(document.cookie),
    () => false,
  );
  return <Link href={signedIn ? "/dashboard" : "/sign-in"}>{signedIn ? "Dashboard" : "Sign in"}</Link>;
}
