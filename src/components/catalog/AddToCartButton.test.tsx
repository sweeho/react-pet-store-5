import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import AddToCartButton from "./AddToCartButton";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
}

/**
 * UI / COMPONENT TEST
 *
 * The one shared Add to Cart control (design.md PLAN step 8): POSTs
 * `{ itemId }` to /api/cart/items — never gated, no sign-on required
 * (SWHR-R-0070) — and shows the added label once the request resolves.
 */
describe("AddToCartButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs the itemId to /api/cart/items and shows the added label", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      () => Promise.resolve(jsonResponse({ lines: [] })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<AddToCartButton itemId="EST-6" label="Add to Cart" addedLabel="Added to cart" />);

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/cart/items");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ itemId: "EST-6" });

    expect(await screen.findByText("Added to cart")).toBeInTheDocument();
  });

  it("announces cart:changed after a successful add", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ lines: [] }))),
    );
    const listener = vi.fn();
    window.addEventListener("cart:changed", listener);
    const user = userEvent.setup();

    render(<AddToCartButton itemId="EST-6" label="Add to Cart" addedLabel="Added to cart" />);
    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    await screen.findByText("Added to cart");
    window.removeEventListener("cart:changed", listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
