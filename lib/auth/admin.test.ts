import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
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
let validPasswordHash: string;

describe("admin auth", () => {
  beforeAll(async () => {
    validPasswordHash = await hashAdminPassword("password");
  });

  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_PASSWORD_HASH = validPasswordHash;
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

  it("verifies valid credentials", async () => {
    await expect(
      verifyAdminCredentials("admin@example.com", "password"),
    ).resolves.toBe(true);
  });

  it("rejects invalid credentials", async () => {
    await expect(
      verifyAdminCredentials("admin@example.com", "wrong"),
    ).resolves.toBe(false);
  });

  it("rejects the legacy SHA-256 configuration", async () => {
    process.env.ADMIN_PASSWORD_HASH = `sha256:${"0".repeat(64)}`;

    expect(isAdminAuthConfigured()).toBe(false);
    await expect(
      verifyAdminCredentials("admin@example.com", "password"),
    ).resolves.toBe(false);
  });

  it("creates salted Argon2id hashes", async () => {
    const first = await hashAdminPassword("password");
    const second = await hashAdminPassword("password");

    expect(first).toMatch(/^\$argon2id\$/);
    expect(second).toMatch(/^\$argon2id\$/);
    expect(first).not.toBe(second);
  });

  it("creates and reads a signed session", () => {
    const signedSession = createSignedAdminSession("admin@example.com");

    expect(readSignedAdminSession(signedSession)).toMatchObject({
      email: "admin@example.com",
    });
  });
});
