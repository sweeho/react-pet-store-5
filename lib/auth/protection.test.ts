import { H3Event } from "nitro/h3";
import { describe, expect, it, vi } from "vitest";

import { db } from "../../db/client";
import { users } from "../../db/schema";
import { updateAuthSession } from "./session";
import {
  ACCOUNT_CHANGE_PATH,
  checkGate,
  getProtectionConfig,
  isProtectedPath,
  loadProtectionConfig,
  requireSignOn,
  type ProtectionConfig,
} from "./protection";

function event(): H3Event {
  return new H3Event(new Request("http://localhost/"));
}

// sessions.userId references users.userId (FK now enforced). Two cases
// below sign "alice" on with no cleanup between them, so this must tolerate
// being called more than once.
function ensureUser(userId: string): void {
  db.insert(users).values({ userId, passwordHash: "test-hash" }).onConflictDoNothing().run();
}

const CONFIG: ProtectionConfig = {
  signOnPage: "/signin",
  signOnErrorPage: "/signin-error",
  protectedPages: [{ name: "customer.screen", path: "/account", roles: [] }],
};

describe("loadProtectionConfig", () => {
  it("parses the sign-on pages and the protected-page list", () => {
    const config = loadProtectionConfig({
      signOnPage: "/signin",
      signOnErrorPage: "/signin-error",
      protectedPages: [{ name: "customer.screen", path: "/account", roles: ["gold"] }],
    });

    expect(config).toEqual({
      signOnPage: "/signin",
      signOnErrorPage: "/signin-error",
      protectedPages: [{ name: "customer.screen", path: "/account", roles: ["gold"] }],
    });
  });

  it("[SWHR-C-0127] keeps the first path for a duplicate name and logs a warning", () => {
    const warn = vi.fn();

    const config = loadProtectionConfig(
      {
        signOnPage: "/signin",
        signOnErrorPage: "/signin-error",
        protectedPages: [
          { name: "Customer Screen", path: "/a" },
          { name: "Customer Screen", path: "/b" },
        ],
      },
      warn,
    );

    expect(isProtectedPath(config, "/a")).toBe(true);
    expect(isProtectedPath(config, "/b")).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("Customer Screen");
  });

  it("defaults roles to an empty array when not configured", () => {
    const config = loadProtectionConfig({
      signOnPage: "/signin",
      signOnErrorPage: "/signin-error",
      protectedPages: [{ name: "customer.screen", path: "/account" }],
    });

    expect(config.protectedPages[0].roles).toEqual([]);
  });
});

describe("isProtectedPath", () => {
  it("[SWHR-C-0125] matches regardless of a trailing query string", () => {
    expect(isProtectedPath(CONFIG, "/account?tab=orders")).toBe(true);
  });

  it("[SWHR-C-0126] does not match a path that only starts with a protected one", () => {
    expect(isProtectedPath(CONFIG, "/accountinfo")).toBe(false);
  });

  it("does not match an unconfigured path", () => {
    expect(isProtectedPath(CONFIG, "/cart")).toBe(false);
  });
});

describe("checkGate", () => {
  it("allows an unprotected path with no session lookup", async () => {
    await expect(checkGate(event(), "/cart", CONFIG)).resolves.toEqual({ allowed: true });
  });

  it("[SWHR-R-0065] gates an anonymous request for a protected path and records the return page", async () => {
    const request = event();

    const result = await checkGate(request, "/account", CONFIG);

    expect(result).toEqual({ allowed: false, redirect: "/signin" });
  });

  it("[SWHR-C-0128] serves a protected page to a signed-on shopper regardless of its configured roles", async () => {
    const goldConfig: ProtectionConfig = {
      signOnPage: "/signin",
      signOnErrorPage: "/signin-error",
      protectedPages: [{ name: "customer.screen", path: "/account", roles: ["gold"] }],
    };
    const request = event();
    ensureUser("alice");
    await updateAuthSession(request, "storefront", { userId: "alice", signedOn: true });

    await expect(checkGate(request, "/account", goldConfig)).resolves.toEqual({ allowed: true });
  });

  it("exports the account-change path used by customer-account (P5)", () => {
    expect(ACCOUNT_CHANGE_PATH).toBe("/account-edit");
  });
});

describe("requireSignOn", () => {
  it("returns the session for a signed-on request", async () => {
    const request = event();
    ensureUser("alice");
    await updateAuthSession(request, "storefront", { userId: "alice", signedOn: true });

    await expect(requireSignOn(request)).resolves.toMatchObject({
      userId: "alice",
      signedOn: true,
    });
  });

  it("rejects with 401 for an anonymous request", async () => {
    await expect(requireSignOn(event())).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe("getProtectionConfig", () => {
  it("reads the shipped configs/signon-config.json", () => {
    const config = getProtectionConfig();

    expect(config.signOnPage).toBe("/signin");
    expect(config.protectedPages.map((page) => page.path)).toEqual(
      expect.arrayContaining(["/account", ACCOUNT_CHANGE_PATH, "/checkout", "/signon-welcome"]),
    );
  });
});
