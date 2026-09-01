import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "webagent_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type AdminSession = {
  email: string;
  expiresAt: number;
};

export function hashAdminPassword(password: string) {
  return `sha256:${createHash("sha256").update(password).digest("hex")}`;
}

function safeCompare(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
}

function getAuthSecret() {
  return process.env.AUTH_SECRET;
}

export function isAdminAuthConfigured() {
  return Boolean(
    process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD_HASH &&
      process.env.AUTH_SECRET,
  );
}

export function verifyAdminCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedEmail || !expectedHash) {
    return false;
  }

  return (
    safeCompare(email, expectedEmail) &&
    safeCompare(hashAdminPassword(password), expectedHash)
  );
}

function signPayload(payload: string) {
  const authSecret = getAuthSecret();

  if (!authSecret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return createHmac("sha256", authSecret).update(payload).digest("base64url");
}

export function createSignedAdminSession(email: string) {
  const session: AdminSession = {
    email,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function readSignedAdminSession(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature || !safeCompare(signature, signPayload(payload))) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AdminSession;

    if (session.expiresAt <= Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();

  return readSignedAdminSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function setAdminSession(email: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createSignedAdminSession(email), {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}
