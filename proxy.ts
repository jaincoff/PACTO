import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/admin", "/supervisor", "/voluntario", "/idoso"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = !!request.cookies.get("access_token")?.value;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasToken) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/supervisor/:path*",
    "/voluntario/:path*",
    "/idoso/:path*",
  ],
};
