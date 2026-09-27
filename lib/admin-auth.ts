import { jwtVerify, SignJWT } from "jose";

export const adminSessionCookieName = "luisfelipeiv_admin_session";

const sessionDurationInSeconds = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET environment variable.");
  }

  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${sessionDurationInSeconds}s`)
    .sign(getSessionSecret());
}

export async function hasValidAdminSession(token: string | undefined) {
  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });

    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const adminSessionCookieOptions = {
  httpOnly: true,
  maxAge: sessionDurationInSeconds,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
