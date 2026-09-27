import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { adminSessionCookieName, hasValidAdminSession } from "@/lib/admin-auth";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(adminSessionCookieName)?.value;

  if (await hasValidAdminSession(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: "/admin/:path*",
};
