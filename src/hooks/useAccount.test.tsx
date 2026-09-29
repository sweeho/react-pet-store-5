import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAccount } from "./useAccount";

function respond(status: number, body: unknown = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status }))),
  );
}

describe("useAccount", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the account from GET /api/account", async () => {
    respond(200, { userId: "j2ee" });
    const { result } = renderHook(() => useAccount());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.account).toEqual({ userId: "j2ee" });
  });

  it.each([401, 404])("treats %s as no account", async (status) => {
    respond(status);
    const { result } = renderHook(() => useAccount());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.account).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("reports other failures as an error", async () => {
    respond(500);
    const { result } = renderHook(() => useAccount());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
