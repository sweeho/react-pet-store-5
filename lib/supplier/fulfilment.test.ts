import { describe, expect, it } from "vitest";

import type { SupplierOrderLineItem } from "../b2b/exchange/supplierOrders";
import { fulfil } from "./fulfilment";

function line(
  itemId: string,
  lineNum: number,
  quantity: number,
  quantityShipped = 0,
): SupplierOrderLineItem {
  return {
    categoryId: "FISH",
    productId: "FI-1",
    itemId,
    lineNum,
    quantity,
    unitPrice: 1000,
    quantityShipped,
  };
}

describe("fulfil", () => {
  it("[SWHR-C-0379] a line of 5 with 3 on hand ships nothing and keeps stock 3", () => {
    const result = fulfil([line("EST-1", 1, 5)], { "EST-1": 3 });

    expect(result.shipped).toEqual([]);
    expect(result.stock["EST-1"]).toBe(3);
    expect(result.completed).toBe(false);
  });

  it("[SWHR-C-0380] a line of 5 with 8 on hand ships 5 and leaves stock 3", () => {
    const result = fulfil([line("EST-1", 1, 5)], { "EST-1": 8 });

    expect(result.shipped.map((l) => [l.itemId, l.quantity])).toEqual([["EST-1", 5]]);
    expect(result.stock["EST-1"]).toBe(3);
    expect(result.completed).toBe(true);
  });

  it("[SWHR-C-0381] a line for EST-99 without a stock record is skipped without error", () => {
    const result = fulfil([line("EST-99", 1, 1)], { "EST-1": 10 });

    expect(result.shipped).toEqual([]);
    expect(result.completed).toBe(false);
    expect(result.stock).toEqual({ "EST-1": 10 });
  });

  it("[SWHR-C-0382] EST-1 in stock ships, EST-6 out of stock does not, order stays pending", () => {
    const result = fulfil([line("EST-1", 1, 2), line("EST-6", 2, 1)], { "EST-1": 4, "EST-6": 0 });

    expect(result.shipped.map((l) => l.itemId)).toEqual(["EST-1"]);
    expect(result.stock["EST-1"]).toBe(2);
    expect(result.completed).toBe(false);
  });

  it("[SWHR-C-0383] a re-attempt after the EST-6 restock ships only EST-6 and completes", () => {
    const result = fulfil([line("EST-1", 1, 2, 2), line("EST-6", 2, 1)], {
      "EST-1": 2,
      "EST-6": 5,
    });

    expect(result.shipped.map((l) => l.itemId)).toEqual(["EST-6"]);
    expect(result.stock["EST-1"]).toBe(2);
    expect(result.stock["EST-6"]).toBe(4);
    expect(result.completed).toBe(true);
  });

  it("evaluates lines in ascending line number so an earlier line takes shared stock first", () => {
    const result = fulfil([line("EST-1", 2, 3), line("EST-1", 1, 3)], { "EST-1": 4 });

    expect(result.shipped.map((l) => l.lineNum)).toEqual([1]);
    expect(result.stock["EST-1"]).toBe(1);
  });
});
