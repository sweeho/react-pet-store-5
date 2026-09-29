import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  productId: "K9-BD-01",
  categoryId: "DOGS",
  productName: "Bulldog",
  name: "Male Adult Bulldog",
  attribute: "Male Adult",
  quantity: 2,
  unitCost: 1850,
  lineTotal: 3700,
};

const ANGELFISH_LINE = {
  itemId: "EST-1",
  productId: "FI-SW-01",
  categoryId: "FISH",
  productName: "Angelfish",
  name: "Large Angelfish",
  attribute: "Large",
  quantity: 1,
  unitCost: 1650,
  lineTotal: 1650,
};

type Line = typeof BULLDOG_LINE;

function cartView(lines: Line[]) {
  return {
    lines,
    count: lines.length,
    subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    locale: "en_US",
  };
}

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

  it("[SWHR-C-0232] an empty cart shows the empty message and no rows or controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(cartView([])))),
    );
    renderCart();

    expect(await screen.findByText("Your Shopping Cart is Empty.")).toBeInTheDocument();
    expect(screen.queryByRole("row")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update Cart" })).not.toBeInTheDocument();
    expect(screen.queryByText("Subtotal")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Check Out/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });

  it("[SWHR-C-0233] a cart with EST-6 x2 and EST-1 x1 shows rows, total $53.50 and controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(cartView([BULLDOG_LINE, ANGELFISH_LINE])))),
    );
    renderCart();

    const bulldog = await screen.findByRole("link", { name: "Male Adult Bulldog" });
    expect(bulldog).toHaveAttribute("href", "/item/EST-6");
    expect(screen.getByRole("link", { name: "Large Angelfish" })).toHaveAttribute(
      "href",
      "/item/EST-1",
    );
    expect(screen.getAllByRole("button", { name: /Remove/ })).toHaveLength(2);
    expect(screen.getByLabelText("Quantity for Male Adult Bulldog")).toHaveValue("2");
    expect(screen.getByLabelText("Quantity for Large Angelfish")).toHaveValue("1");
    expect(screen.getByText("$18.50")).toBeInTheDocument();
    expect(screen.getByText("$16.50")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Cart" })).toBeInTheDocument();
    expect(screen.getByText("$53.50")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Check Out/ })).toHaveAttribute("href", "/checkout");
  });

  it("Remove sends DELETE for the item and re-renders from the returned cart", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        return Promise.resolve(jsonResponse(cartView([ANGELFISH_LINE])));
      }
      return Promise.resolve(jsonResponse(cartView([BULLDOG_LINE, ANGELFISH_LINE])));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderCart();

    await userEvent.click(
      (await screen.findAllByRole("button", { name: /Remove/ }))[0] as HTMLElement,
    );

    await waitFor(() => expect(screen.queryByText("Male Adult Bulldog")).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/cart/items/EST-6", { method: "DELETE" });
    expect(screen.getByText("Large Angelfish")).toBeInTheDocument();
  });

  it("Update Cart sends every raw quantity in one PATCH and re-renders", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        return Promise.resolve(jsonResponse(cartView([{ ...BULLDOG_LINE, quantity: 5 }])));
      }
      return Promise.resolve(jsonResponse(cartView([BULLDOG_LINE, ANGELFISH_LINE])));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderCart();

    const bulldogQty = await screen.findByLabelText("Quantity for Male Adult Bulldog");
    await userEvent.clear(bulldogQty);
    await userEvent.type(bulldogQty, "5");
    const angelfishQty = screen.getByLabelText("Quantity for Large Angelfish");
    await userEvent.clear(angelfishQty);
    await userEvent.type(angelfishQty, "abc");
    await userEvent.click(screen.getByRole("button", { name: "Update Cart" }));

    await waitFor(() => expect(screen.queryByText("Large Angelfish")).not.toBeInTheDocument());
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH");
    expect(patch?.[0]).toBe("/api/cart");
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({
      quantities: { "EST-6": "5", "EST-1": "abc" },
    });
    expect(screen.getByLabelText("Quantity for Male Adult Bulldog")).toHaveValue("5");
  });

  it("renders the Japanese screen content for ?locale=ja_JP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(cartView([])))),
    );
    renderCart("/cart?locale=ja_JP");

    expect(screen.getByRole("heading", { level: 1, name: "カート" })).toBeInTheDocument();
    expect(await screen.findByText("カートは空です")).toBeInTheDocument();
  });

  function stubCartAndAccount(accountStatus: number, profile?: object) {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).startsWith("/api/account")
            ? jsonResponse(profile ? { userId: "j2ee", profile } : {}, accountStatus)
            : jsonResponse(cartView([])),
        ),
      ),
    );
  }

  it("[SWHR-C-0229] shows the dogs pet-tips banner when the favourite category is empty", async () => {
    stubCartAndAccount(200, {
      favoriteCategory: "",
      bannerPreference: true,
      myListPreference: false,
    });
    renderCart();

    await waitFor(() => expect(screen.queryByTestId("pet-tips-banner")).not.toBeNull());
    const banner = screen.getByTestId("pet-tips-banner");
    expect(banner).toHaveAttribute("data-category", "dogs");
  });

  it("shows no pet-tips banner to an anonymous visitor", async () => {
    stubCartAndAccount(401);
    renderCart();

    expect(await screen.findByText("Your Shopping Cart is Empty.")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByTestId("pet-tips-banner")).not.toBeInTheDocument();
  });
});
