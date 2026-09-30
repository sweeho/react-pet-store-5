import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { outboxDeliveries, outboxMessages } from "../../db/schema";
import { dispatchPending } from "./dispatcher";
import { NonRetryableError } from "./errors";
import { enqueue, registerConsumer, type Tx } from "./outbox";

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
});

afterEach(() => {
  delete process.env.OUTBOX_MAX_ATTEMPTS;
});

// supplier.purchase-order's one fixed subscriber (design.md P4) — enqueue
// always creates the delivery row under this exact consumer name, so a
// test's registerConsumer call must target it too, or the two never meet.
const SUPPLIER_INTAKE = "supplier-intake";

function soleDelivery(consumer: string) {
  return db.select().from(outboxDeliveries).where(eq(outboxDeliveries.consumer, consumer)).get()!;
}

describe("dispatchPending", () => {
  it("delivers a due message and marks it delivered", async () => {
    const received: string[] = [];
    registerConsumer("supplier.purchase-order", SUPPLIER_INTAKE, async (payload) => () => {
      received.push(payload);
    });
    db.transaction((tx) => enqueue(tx, "supplier.purchase-order", "hello"));

    const result = await dispatchPending();

    expect(result).toEqual({ delivered: 1, failed: 0 });
    expect(received).toEqual(["hello"]);
  });

  it("leaves a delivery pending when no consumer is registered for it", async () => {
    db.transaction((tx) => enqueue(tx, "opc.invoice", "no-one-home"));
    // No registerConsumer call for this test's channel/consumer pair.

    const result = await dispatchPending();

    expect(result).toEqual({ delivered: 0, failed: 0 });
    const rows = db.select().from(outboxDeliveries).all();
    expect(rows.every((r) => r.status === "pending")).toBe(true);
  });

  it("does not dispatch a delivery whose nextAttemptAt is in the future", async () => {
    registerConsumer("supplier.purchase-order", SUPPLIER_INTAKE, async () => () => {});
    db.transaction((tx) => enqueue(tx, "supplier.purchase-order", "later"));

    const past = new Date(Date.now() - 60_000);
    const result = await dispatchPending({ now: past });

    expect(result).toEqual({ delivered: 0, failed: 0 });
  });

  it("rolls back the commit's writes and never marks delivered when the commit throws", async () => {
    registerConsumer("supplier.purchase-order", SUPPLIER_INTAKE, async () => (tx: Tx) => {
      tx.insert(outboxMessages)
        .values({ id: "side-effect", channel: "opc.invoice", payload: "x", createdAt: new Date() })
        .run();
      throw new Error("commit failed");
    });
    db.transaction((tx) => enqueue(tx, "supplier.purchase-order", "rollback-me"));

    const result = await dispatchPending();

    expect(result).toEqual({ delivered: 0, failed: 1 });
    expect(
      db.select().from(outboxMessages).where(eq(outboxMessages.id, "side-effect")).get(),
    ).toBeUndefined();
    const delivery = soleDelivery(SUPPLIER_INTAKE);
    expect(delivery.status).toBe("pending");
    expect(delivery.attempts).toBe(1);
    expect(delivery.lastError).toBe("commit failed");
  });

  it("marks a delivery dead once OUTBOX_MAX_ATTEMPTS is reached", async () => {
    process.env.OUTBOX_MAX_ATTEMPTS = "2";
    registerConsumer("supplier.purchase-order", SUPPLIER_INTAKE, async () => () => {
      throw new Error("always fails");
    });
    db.transaction((tx) => enqueue(tx, "supplier.purchase-order", "doomed"));

    // nextAttemptAt defaults to "now" at enqueue time, so each retry probe
    // must move further into the future than the enqueue moment, not from
    // the epoch — otherwise it's never due and attempts never increments.
    const start = Date.now();
    await dispatchPending({ now: new Date(start + 1) });
    expect(soleDelivery(SUPPLIER_INTAKE)).toMatchObject({ status: "pending", attempts: 1 });

    await dispatchPending({ now: new Date(start + 10_000_000) });
    expect(soleDelivery(SUPPLIER_INTAKE)).toMatchObject({ status: "dead", attempts: 2 });
  });

  it("a prepare-phase throw fails the delivery without ever opening a transaction", async () => {
    registerConsumer("supplier.purchase-order", SUPPLIER_INTAKE, async () => {
      throw new Error("prepare failed");
    });
    db.transaction((tx) => enqueue(tx, "supplier.purchase-order", "bad"));

    const result = await dispatchPending();

    expect(result).toEqual({ delivered: 0, failed: 1 });
    expect(soleDelivery(SUPPLIER_INTAKE)).toMatchObject({
      status: "pending",
      attempts: 1,
      lastError: "prepare failed",
    });
  });
});

describe("dispatchPending non-retryable failures and channel filters", () => {
  it("marks a delivery dead on its first attempt when the handler throws NonRetryableError, and never reruns it", async () => {
    let runs = 0;
    registerConsumer("supplier.purchase-order", SUPPLIER_INTAKE, async () => {
      runs++;
      throw new NonRetryableError("malformed");
    });
    db.transaction((tx) => enqueue(tx, "supplier.purchase-order", "x"));

    const first = await dispatchPending();
    const later = await dispatchPending({ now: new Date(Date.now() + 3_600_000) });

    expect(first).toEqual({ delivered: 0, failed: 1 });
    expect(later).toEqual({ delivered: 0, failed: 0 });
    expect(runs).toBe(1);
    const row = soleDelivery(SUPPLIER_INTAKE);
    expect(row.status).toBe("dead");
    expect(row.attempts).toBe(1);
    expect(row.lastError).toBe("malformed");
  });

  it("still reschedules an ordinary handler failure", async () => {
    registerConsumer("supplier.purchase-order", SUPPLIER_INTAKE, async () => {
      throw new Error("flaky");
    });
    db.transaction((tx) => enqueue(tx, "supplier.purchase-order", "x"));

    await dispatchPending();

    const row = soleDelivery(SUPPLIER_INTAKE);
    expect(row.status).toBe("pending");
    expect(row.attempts).toBe(1);
  });

  it("only and except select deliveries by channel", async () => {
    const ran: string[] = [];
    registerConsumer("supplier.purchase-order", SUPPLIER_INTAKE, async () => () => {
      ran.push("supplier");
    });
    registerConsumer("opc.order-approval", "order-approval", async () => () => {
      ran.push("approval");
    });
    db.transaction((tx) => {
      enqueue(tx, "supplier.purchase-order", "a");
      enqueue(tx, "opc.order-approval", "b");
    });

    await dispatchPending({ only: ["opc.order-approval"] });
    expect(ran).toEqual(["approval"]);

    await dispatchPending({ except: ["supplier.purchase-order"] });
    expect(ran).toEqual(["approval"]);

    await dispatchPending({ except: ["opc.order-approval"] });
    expect(ran).toEqual(["approval", "supplier"]);
  });
});
