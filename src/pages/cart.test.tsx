import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import CartPage from "./cart";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderCart(initialPath = "/cart") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <CartPage />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

const BULLDOG_LINE = {
  itemId: "EST-6",
  quantity: 2,
  item: {
    itemId: "EST-6",
    productId: "K9-BD-01",
    name: "Male Adult Bulldog",
    description: "Friendly dog from England",
    image: "dogs.svg",
    listPrice: 1850,
    unitCost: 1200,
    locale: "en_US",
  },
};

/**
 * UI / PAGE TEST
 *
 * The cart seam (design.md P9): GET /api/cart lines with item details and
 * quantities, through AsyncContent. `global.fetch` is stubbed the same way
 * ProductPage's test is — the page calls it directly, no injectable prop.
 */
describe("CartPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists each cart line's item name, quantity and formatted price", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ lines: [BULLDOG_LINE] }))),
    );
    renderCart();

    expect(await screen.findByText("Male Adult Bulldog")).toBeInTheDocument();
    expect(screen.getByText("Quantity: 2")).toBeInTheDocument();
    expect(screen.getByText("$18.50")).toBeInTheDocument();
  });

  it("shows the empty state when the cart has no lines", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ lines: [] }))),
    );
    renderCart();

    expect(await screen.findByText("Your cart is empty")).toBeInTheDocument();
  });

  it("renders the Japanese screen content for ?locale=ja_JP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ lines: [] }))),
    );
    renderCart("/cart?locale=ja_JP");

    expect(screen.getByRole("heading", { level: 1, name: "カート" })).toBeInTheDocument();
    expect(await screen.findByText("カートは空です")).toBeInTheDocument();
  });
});
