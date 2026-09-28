import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("verifies the exact password against its own hash", async () => {
    const hash = await hashPassword("Secret1");
    await expect(verifyPassword("Secret1", hash)).resolves.toBe(true);
  });

  it("rejects a password that differs only in case", async () => {
    const hash = await hashPassword("Secret1");
    await expect(verifyPassword("secret1", hash)).resolves.toBe(false);
  });

  it("verifies a hash produced by Bun.password.hashSync, the seed algorithm (design.md P2)", async () => {
    const hash = Bun.password.hashSync("jps_admin");
    await expect(verifyPassword("jps_admin", hash)).resolves.toBe(true);
  });
});
