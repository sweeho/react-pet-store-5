import type { ApprovalEntry } from "../b2b/documents/orderApproval";
import type { Handler, Tx } from "../messaging/outbox";

export function applyApprovalBatch(tx: Tx, entries: ApprovalEntry[]): string[] {
  void tx;
  void entries;
  throw new Error("VortexNotImplemented");
}

export function createOrderApprovalHandler(): Handler {
  throw new Error("VortexNotImplemented");
}
