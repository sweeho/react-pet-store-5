import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCartCount } from "./useCartCount";

function Probe() {
  const count = useCartCount();
  return <span data-testid="count">{count === null ? "none" : String(count)}</span>;
}

function stubCount(counts: number[]) {
  const queue = [...counts];
  const fetchMock = vi.fn(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({ lines: [], count: queue.length > 1 ? queue.shift() : queue[0] }),
        { headers: { "content-type": "application/json" } },
      ),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/**
 * UI / HOOK TEST
 *
 * The header Cart count (design.md P8): GET /api/cart `count`, refreshed on
 * the `cart:changed` window event.
 */
describe("useCartCount", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the count from GET /api/cart", async () => {
    stubCount([3]);
    render(<Probe />);

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("3"));
  });

  it("refetches when cart:changed is dispatched", async () => {
    stubCount([2, 3]);
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("2"));

    act(() => {
      window.dispatchEvent(new Event("cart:changed"));
    });

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("3"));
  });

  it("stays null when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("{}", { status: 500 }))),
    );
    render(<Probe />);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.getByTestId("count")).toHaveTextContent("none");
  });
});
