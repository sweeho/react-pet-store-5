import { H3Event } from "nitro/h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../db/client";
import { roleAssignments, sessions, supplierInventory, users } from "../../../db/schema";
import { updateAuthSession } from "../../../lib/auth/session";
import * as inventory from "../../../lib/supplier/inventory";
import * as inventoryUpdate from "../../../lib/supplier/inventoryUpdate";
import getInventory from "./inventory.get";
import postInventory from "./inventory.post";

beforeEach(() => {
  db.delete(roleAssignments).run();
  db.delete(sessions).run();
  db.delete(supplierInventory).run();
  db.insert(supplierInventory)
    .values([
      { itemId: "EST-10", quantity: 1 },
      { itemId: "EST-2", quantity: 2 },
      { itemId: "EST-7", quantity: 40 },
      { itemId: "EST-8", quantity: 10 },
    ])
    .run();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function cookieFrom(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

async function signOn(admin: boolean): Promise<string> {
  const userId = admin ? "sup-admin" : "sup-plain";
  db.insert(users).values({ userId, passwordHash: "test-hash" }).onConflictDoNothing().run();
  if (admin) {
    db.insert(roleAssignments)
      .values({
        realm: "supplier",
        role: "administrator",
        principalType: "user",
        principal: userId,
      })
      .run();
  }
  const event = new H3Event(new Request("http://localhost/"));
  await updateAuthSession(event, "supplier", { userId, signedOn: true });
  return cookieFrom(event);
}

function get(cookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/supplier/inventory", {
      headers: cookie ? { cookie } : {},
    }),
  );
}

function post(body: unknown, cookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/supplier/inventory", {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const quantities = () =>
  Object.fromEntries(inventory.listStockRecords().map((r) => [r.itemId, r.quantity]));

describe("GET /api/supplier/inventory", () => {
  it("lists records in natural item-id order", async () => {
    const result = await getInventory(get(await signOn(true)));
    expect(result).toEqual({
      items: [
        { itemId: "EST-2", quantity: 2 },
        { itemId: "EST-7", quantity: 40 },
        { itemId: "EST-8", quantity: 10 },
        { itemId: "EST-10", quantity: 1 },
      ],
    });
  });

  it("answers 500 INVENTORY_UNAVAILABLE when the lookup throws", async () => {
    vi.spyOn(inventory, "listStockRecords").mockImplementation(() => {
      throw new Error("db down");
    });
    const event = get(await signOn(true));
    const result = await getInventory(event);
    expect(event.res.status).toBe(500);
    expect(result).toEqual({ error: "INVENTORY_UNAVAILABLE" });
  });

  it("answers 401 without a session and 403 without the role", async () => {
    await expect(getInventory(get())).rejects.toMatchObject({ status: 401 });
    await expect(getInventory(get(await signOn(false)))).rejects.toMatchObject({ status: 403 });
  });
});

describe("POST /api/supplier/inventory", () => {
  it("[SWHR-C-0397] skips negative EST-7 and applies EST-8", async () => {
    const event = post(
      {
        rows: [
          { itemId: "EST-7", update: true, quantity: "-5" },
          { itemId: "EST-8", update: true, quantity: "30" },
        ],
      },
      await signOn(true),
    );
    const result = await postInventory(event);
    expect(event.res.status).toBe(200);
    expect(result).toEqual({ updated: ["EST-8"] });
    expect(quantities()).toMatchObject({ "EST-7": 40, "EST-8": 30 });
  });

  it("answers 400 INVALID_BATCH for non-numeric and unknown rows and writes nothing", async () => {
    const event = post(
      {
        rows: [
          { itemId: "EST-7", update: true, quantity: "abc" },
          { itemId: "EST-99", update: true, quantity: "5" },
          { itemId: "EST-8", update: true, quantity: "30" },
        ],
      },
      await signOn(true),
    );
    const result = await postInventory(event);
    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: "INVALID_BATCH", invalid: ["EST-7"], unknown: ["EST-99"] });
    expect(quantities()).toMatchObject({ "EST-7": 40, "EST-8": 10 });
  });

  it("answers 400 INVALID_BATCH for a malformed body", async () => {
    const cookie = await signOn(true);
    for (const body of ['{"rows": 5}', "not json", { rows: [{ itemId: 1 }] }, {}]) {
      const event = post(body, cookie);
      const result = await postInventory(event);
      expect(event.res.status).toBe(400);
      expect(result).toEqual({ error: "INVALID_BATCH", invalid: [], unknown: [] });
    }
    expect(quantities()).toMatchObject({ "EST-7": 40, "EST-8": 10 });
  });

  it("answers 500 when the unit of work throws", async () => {
    vi.spyOn(inventoryUpdate, "updateInventory").mockImplementation(() => {
      throw new Error("boom");
    });
    const event = post(
      { rows: [{ itemId: "EST-8", update: true, quantity: "30" }] },
      await signOn(true),
    );
    await postInventory(event);
    expect(event.res.status).toBe(500);
    expect(quantities()).toMatchObject({ "EST-8": 10 });
  });

  it("answers 401 without a session and 403 without the role, writing nothing", async () => {
    const body = { rows: [{ itemId: "EST-8", update: true, quantity: "30" }] };
    await expect(postInventory(post(body))).rejects.toMatchObject({ status: 401 });
    await expect(postInventory(post(body, await signOn(false)))).rejects.toMatchObject({
      status: 403,
    });
    expect(quantities()).toMatchObject({ "EST-8": 10 });
  });
});
