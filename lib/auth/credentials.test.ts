import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { users } from "../../db/schema";
import {
  authenticate,
  createCredential,
  getPasswordMaxLength,
  USER_ID_MAX_LENGTH,
  validatePassword,
  validateUserId,
} from "./credentials";

beforeEach(() => {
  db.delete(users).run();
});

afterEach(() => {
  delete process.env.SIGNON_PASSWORD_MAX_LENGTH;
});

function countCredentials(userId: string): number {
  return db.select().from(users).where(eq(users.userId, userId)).all().length;
}

describe("validateUserId", () => {
  it("rejects an empty user id as missing", () => {
    expect(validateUserId("")).toBe("missing");
  });

  it("rejects a user id longer than 25 characters", () => {
    expect(validateUserId("a".repeat(26))).toBe("user-id-too-long");
  });

  it("accepts a user id of exactly 25 characters", () => {
    expect(validateUserId("a".repeat(25))).toBeNull();
  });

  it("rejects a user id containing a percent sign", () => {
    expect(validateUserId("bob%1")).toBe("user-id-wildcard");
  });

  it("rejects a user id containing an asterisk", () => {
    expect(validateUserId("bob*")).toBe("user-id-wildcard");
  });

  it("exposes the 25-character limit as USER_ID_MAX_LENGTH", () => {
    expect(USER_ID_MAX_LENGTH).toBe(25);
  });
});

describe("validatePassword", () => {
  it("rejects an empty password as missing", () => {
    expect(validatePassword("")).toBe("missing");
  });

  it("rejects a password one character over the configured maximum", () => {
    expect(validatePassword("a".repeat(getPasswordMaxLength() + 1))).toBe("password-too-long");
  });

  it("accepts a password at the configured maximum", () => {
    expect(validatePassword("a".repeat(getPasswordMaxLength()))).toBeNull();
  });

  it("reads the maximum from SIGNON_PASSWORD_MAX_LENGTH, defaulting to 25", () => {
    delete process.env.SIGNON_PASSWORD_MAX_LENGTH;
    expect(getPasswordMaxLength()).toBe(25);

    process.env.SIGNON_PASSWORD_MAX_LENGTH = "8";
    expect(getPasswordMaxLength()).toBe(8);
  });
});

describe("createCredential", () => {
  it("[SWHR-C-0107] stores exactly one credential for a new user id", async () => {
    const result = await createCredential("carol", "Pass123");
    expect(result).toEqual({ ok: true });
    expect(countCredentials("carol")).toBe(1);
  });

  it("[SWHR-C-0108] rejects a duplicate user id and stores no second credential", async () => {
    await createCredential("alice", "Secret1");

    const result = await createCredential("alice", "Different1");

    expect(result).toEqual({ ok: false, error: "duplicate" });
    expect(countCredentials("alice")).toBe(1);
  });

  it("[SWHR-C-0109] rejects a 26-character user id and stores nothing", async () => {
    const userId = "a".repeat(26);
    const result = await createCredential(userId, "Pass123");

    expect(result).toEqual({ ok: false, error: "user-id-too-long" });
    expect(countCredentials(userId)).toBe(0);
  });

  it("[SWHR-C-0110] accepts a 25-character unused user id", async () => {
    const userId = "a".repeat(25);
    const result = await createCredential(userId, "Pass123");

    expect(result).toEqual({ ok: true });
    expect(countCredentials(userId)).toBe(1);
  });

  it("[SWHR-C-0111] rejects a user id containing a percent sign", async () => {
    const result = await createCredential("bob%1", "Pass123");

    expect(result).toEqual({ ok: false, error: "user-id-wildcard" });
    expect(countCredentials("bob%1")).toBe(0);
  });

  it("[SWHR-C-0112] rejects a user id containing an asterisk", async () => {
    const result = await createCredential("bob*", "Pass123");

    expect(result).toEqual({ ok: false, error: "user-id-wildcard" });
    expect(countCredentials("bob*")).toBe(0);
  });

  it("[SWHR-C-0113] rejects a password one character over the configured maximum", async () => {
    const max = getPasswordMaxLength();
    const result = await createCredential("dave", "a".repeat(max + 1));

    expect(result).toEqual({ ok: false, error: "password-too-long" });
    expect(countCredentials("dave")).toBe(0);
  });
});

describe("authenticate", () => {
  beforeEach(async () => {
    await createCredential("alice", "Secret1");
  });

  it("[SWHR-C-0114] succeeds with the correct password", async () => {
    await expect(authenticate("alice", "Secret1")).resolves.toBe(true);
  });

  it("[SWHR-C-0115] fails when the password differs only in case", async () => {
    await expect(authenticate("alice", "secret1")).resolves.toBe(false);
  });

  it("[SWHR-C-0116] fails for an unknown user id without raising", async () => {
    await expect(authenticate("ghost", "anything")).resolves.toBe(false);
  });
});
