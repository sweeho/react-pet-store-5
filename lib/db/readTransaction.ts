import { db } from "../../db/client";
import type { Executor } from "../account/types";

type Outcome<T> = { ok: true; value: T } | { ok: false; error: unknown };

/**
 * Runs a read inside one transaction so it sees a single snapshot. A page
 * must still be delivered when no transaction can begin or the commit fails
 * (SWHR-R-0164, design.md SD-5), so those cases fall back to the plain
 * connection or keep the result. An error thrown by `fn` itself propagates.
 */
export function withReadTransaction<T>(fn: (tx: Executor) => T): T {
  let outcome: Outcome<T> | undefined;
  try {
    db.transaction((tx) => {
      try {
        outcome = { ok: true, value: fn(tx) };
      } catch (error) {
        outcome = { ok: false, error };
        throw error;
      }
    });
  } catch {
    // Begin or commit failed, or fn threw (handled below).
  }
  if (!outcome) return fn(db);
  if (!outcome.ok) throw outcome.error;
  return outcome.value;
}
