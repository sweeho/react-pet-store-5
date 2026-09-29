/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs, replaced by the implementation */
import type { Executor } from "../account/types";
import type { Tx } from "../messaging/outbox";

export interface StockRecord {
  itemId: string;
  quantity: number;
}

export function listStockRecords(_executor?: Executor): StockRecord[] {
  throw new Error("VortexNotImplemented");
}

export function getStockRecord(_itemId: string, _executor?: Executor): StockRecord | null {
  throw new Error("VortexNotImplemented");
}

export function createStockRecord(_tx: Tx, _record: StockRecord): void {
  throw new Error("VortexNotImplemented");
}
