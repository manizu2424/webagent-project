import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createSignedAdminSession,
  hashAdminPassword,
  isAdminAuthConfigured,
  readSignedAdminSession,
  verifyAdminCredentials,
} from "./admin";

const originalEnv = {
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  AUTH_SECRET: process.env.AUTH_SECRET,
};

describe("admin auth", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_PASSWORD_HASH = hashAdminPassword("password");
    process.env.AUTH_SECRET = "auth-secret";
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key as keyof typeof originalEnv];
      } else {
        process.env[key as keyof typeof originalEnv] = value;
      }
    }
  });

  it("detects configured admin auth", () => {
    expect(isAdminAuthConfigured()).toBe(true);
  });

  it("verifies valid credentials", () => {
    expect(verifyAdminCredentials("admin@example.com", "password")).toBe(true);
  });

  it("rejects invalid credentials", () => {
    expect(verifyAdminCredentials("admin@example.com", "wrong")).toBe(false);
  });

  it("creates and reads a signed session", () => {
    const signedSession = createSignedAdminSession("admin@example.com");

    expect(readSignedAdminSession(signedSession)).toMatchObject({
      email: "admin@example.com",
    });
  });
});
