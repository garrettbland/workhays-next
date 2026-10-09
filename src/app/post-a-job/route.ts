import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";

/** Header "Post a job" button: dashboard if signed in, otherwise sign-up. */
export async function GET(request: NextRequest) {
  const user = await getUser();
  return NextResponse.redirect(new URL(user ? "/dashboard" : "/sign-up", request.nextUrl.origin));
}
