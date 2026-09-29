import { describe, expect, it } from "vitest";

import { WorkflowStepError, runStep } from "./errors";

class ConnectionError extends Error {}

describe("runStep", () => {
  it("[SWHR-C-0388] preserves the connection error as the root cause of the workflow-step error", async () => {
    const original = new ConnectionError("connection refused");
    const send = async () => {
      throw original;
    };

    const error = await runStep("send-invoice", send).then(
      () => undefined,
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(WorkflowStepError);
    expect((error as WorkflowStepError).step).toBe("send-invoice");
    expect((error as WorkflowStepError).cause).toBe(original);
  });

  it("wraps a synchronous throw the same way", () => {
    const original = new ConnectionError("down");
    let thrown: unknown;
    try {
      runStep("sync-step", () => {
        throw original;
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(WorkflowStepError);
    expect((thrown as WorkflowStepError).cause).toBe(original);
  });

  it("returns the step's result when it succeeds", async () => {
    expect(runStep("ok", () => 7)).toBe(7);
    await expect(runStep("ok-async", async () => 8)).resolves.toBe(8);
  });
});
