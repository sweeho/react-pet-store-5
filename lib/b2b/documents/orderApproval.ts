import type { ReadOptions } from "./purchaseOrder";

export type ApprovalStatus = "APPROVED" | "DENIED";

export interface ApprovalEntry {
  orderId: string;
  status: ApprovalStatus;
}

export const ORDER_APPROVAL_PUBLIC_ID =
  "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD OrderApproval 1.1//EN";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- red-phase stub
export function writeOrderApproval(_entries: ApprovalEntry[]): string {
  throw new Error("VortexNotImplemented");
}

/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stub */
export async function readOrderApproval(
  _xml: string,
  _opts?: ReadOptions,
): Promise<ApprovalEntry[]> {
  throw new Error("VortexNotImplemented");
}
