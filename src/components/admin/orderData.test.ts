import { describe, expect, it } from "vitest";

import { commitBatches, isValidReportDate, parseOrderSummary, validGroups } from "./orderData";

describe("orderData helpers", () => {
  it("[SWHR-C-0293] reads an unrecognised status value as absent", () => {
    const summary = parseOrderSummary({
      orderId: "1001",
      userId: "u1",
      date: "2/3/2002",
      amount: "612.50",
      status: "SHIPPED",
    });
    expect(summary.status).toBeNull();
    expect(summary.orderId).toBe("1001");
  });

  it("keeps the four known statuses", () => {
    for (const status of ["PENDING", "APPROVED", "DENIED", "COMPLETED"]) {
      expect(
        parseOrderSummary({ orderId: "1", userId: "u", date: "", amount: "", status }).status,
      ).toBe(status);
    }
  });

  it("[SWHR-C-0322] drops groups without a name and with bad values", () => {
    const groups = validGroups([
      { name: "", value: "10.00" },
      { name: "  ", value: "10.00" },
      { name: "Birds", value: "-1.00" },
      { name: "Cats", value: "abc" },
      { name: "Fish", value: "60.00" },
    ]);
    expect(groups.map((g) => g.name)).toEqual(["Fish"]);
    expect(groups[0].amount).toBe(60);
  });

  it("accepts only strict MM/dd/yyyy dates", () => {
    expect(isValidReportDate("01/01/2001")).toBe(true);
    expect(isValidReportDate("12/31/2002")).toBe(true);
    expect(isValidReportDate("2001-01-01")).toBe(false);
    expect(isValidReportDate("1/1/2001")).toBe(false);
    expect(isValidReportDate("02/30/2002")).toBe(false);
    expect(isValidReportDate("")).toBe(false);
  });

  it("builds an approval batch then a denial batch and skips empty ones", () => {
    expect(commitBatches({ "1003": "DENIED", "1001": "APPROVED", "1002": "APPROVED" })).toEqual([
      { status: "APPROVED", orderIds: ["1001", "1002"] },
      { status: "DENIED", orderIds: ["1003"] },
    ]);
    expect(commitBatches({ "1": "DENIED" })).toEqual([{ status: "DENIED", orderIds: ["1"] }]);
    expect(commitBatches({})).toEqual([]);
  });
});
