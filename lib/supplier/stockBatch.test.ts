import { describe, expect, it } from "vitest";
import { planStockBatch } from "./stockBatch";

const known = new Set(["EST-3", "EST-4", "EST-5", "EST-6", "EST-7"]);
const row = (itemId: string, update: boolean, quantity: string) => ({ itemId, update, quantity });

describe("planStockBatch", () => {
  it("[SWHR-C-0393] selected EST-3 with 25 is set to 25", () => {
    expect(planStockBatch([row("EST-3", true, "25")], known)).toEqual({
      ok: true,
      updates: [{ itemId: "EST-3", quantity: 25 }],
    });
  });

  it("[SWHR-C-0394] unselected EST-4 with 100 stays 40", () => {
    expect(planStockBatch([row("EST-4", false, "100")], known)).toEqual({ ok: true, updates: [] });
  });

  it("[SWHR-C-0395] selected EST-5 with blank quantity stays 40", () => {
    expect(planStockBatch([row("EST-5", true, "  ")], known)).toEqual({ ok: true, updates: [] });
  });

  it("[SWHR-C-0396] selected EST-6 with 0 is set to 0", () => {
    expect(planStockBatch([row("EST-6", true, "0")], known)).toEqual({
      ok: true,
      updates: [{ itemId: "EST-6", quantity: 0 }],
    });
  });

  it("skips a negative row while applying another in the same batch", () => {
    expect(planStockBatch([row("EST-3", true, "-5"), row("EST-4", true, "30")], known)).toEqual({
      ok: true,
      updates: [{ itemId: "EST-4", quantity: 30 }],
    });
  });

  it("rejects non-numeric and fractional quantities as invalid", () => {
    expect(
      planStockBatch(
        [row("EST-3", true, "abc"), row("EST-4", true, "12.5"), row("EST-5", true, "7")],
        known,
      ),
    ).toEqual({
      ok: false,
      invalid: ["EST-3", "EST-4"],
      unknown: [],
    });
  });

  it("rejects an unknown ticked item", () => {
    expect(planStockBatch([row("NOPE", true, "5"), row("EST-3", true, "1")], known)).toEqual({
      ok: false,
      invalid: [],
      unknown: ["NOPE"],
    });
  });

  it("never checks an unticked row", () => {
    expect(planStockBatch([row("NOPE", false, "abc")], known)).toEqual({ ok: true, updates: [] });
  });

  it("trims surrounding spaces", () => {
    expect(planStockBatch([row("EST-3", true, " 12 ")], known)).toEqual({
      ok: true,
      updates: [{ itemId: "EST-3", quantity: 12 }],
    });
  });
});
