import { eq, sql } from "drizzle-orm";

import { db } from "../../db/client";
import { counters } from "../../db/schema";
import type { Executor } from "../account/types";

export const ORDER_ID_PREFIX = "1001";

export class CounterCreationError extends Error {}

function issue(prefix: string, tx: Executor): string {
  try {
    tx.insert(counters).values({ name: prefix, value: 0 }).onConflictDoNothing().run();
  } catch (cause) {
    throw new CounterCreationError(`Could not create the identifier counter for "${prefix}"`, {
      cause,
    });
  }

  const row = tx
    .update(counters)
    .set({ value: sql`${counters.value} + 1` })
    .where(eq(counters.name, prefix))
    .returning({ value: counters.value })
    .get();
  return `${prefix}${row.value}`;
}

/**
 * Issues the next identifier for `prefix` from its counter (created at 0),
 * with no padding. With `tx` it joins the caller's transaction, so a rollback
 * undoes the increment; otherwise it runs in its own immediate transaction.
 */
export function nextId(prefix: string, tx?: Executor): string {
  if (tx) return issue(prefix, tx);
  return db.transaction((inner) => issue(prefix, inner), { behavior: "immediate" });
}
