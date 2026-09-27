import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  adminSessionCookieName,
  adminSessionCookieOptions,
  createAdminSessionToken,
} from "@/lib/admin-auth";

function passwordsMatch(password: string, expectedPassword: string) {
  const submittedHash = createHash("sha256").update(password).digest();
  const expectedHash = createHash("sha256").update(expectedPassword).digest();

  return timingSafeEqual(submittedHash, expectedHash);
}

function getRedirectPath(value: FormDataEntryValue | null) {
  if (
    typeof value === "string" &&
    (value === "/admin" || value.startsWith("/admin/"))
  ) {
    return value;
  }

  return "/admin/dedicatorias";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formData.get("password");
  const nextPath = getRedirectPath(formData.get("next"));
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (
    typeof password !== "string" ||
    !expectedPassword ||
    !passwordsMatch(password, expectedPassword)
  ) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("error", "invalid-credentials");
    loginUrl.searchParams.set("next", nextPath);

    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), {
    status: 303,
  });
  const token = await createAdminSessionToken();

  response.cookies.set(
    adminSessionCookieName,
    token,
    adminSessionCookieOptions,
  );

  return response;
}
