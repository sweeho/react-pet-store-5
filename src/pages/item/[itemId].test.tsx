import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import ItemPage from "./[itemId]";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const MENU_CATEGORIES = [
  { categoryId: "DOGS", name: "Dogs", description: null, image: null, locale: "en_US" },
];

const EST6 = {
  itemId: "EST-6",
  productId: "K9-BD-01",
  categoryId: "DOGS",
  productName: "Bulldog",
  name: "Male Adult Bulldog",
  description: "Friendly dog from England.",
  image: "dogs.svg",
  attributes: ["Male Adult", null, null, null, null],
  listPrice: 1850,
  unitCost: 1200,
  locale: "en_US",
};

function stubFetch(itemHandler: (url: URL) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      if (url.pathname === "/api/catalog/categories") {
        return Promise.resolve(jsonResponse({ categories: MENU_CATEGORIES }));
      }
      return Promise.resolve(itemHandler(url));
    }),
  );
}

function renderItem(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <Routes>
          <Route path="/item/:itemId" element={<ItemPage />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * New page (SWHR-T-0060, SWHR-R-0103): title reads the item's display
 * name, the image renders from /images/<image>, both List Price and Your
 * Price are shown (Q7), and Add to Cart is offered.
 */
describe("ItemPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the title, image, description, list price, your price and Add to Cart", async () => {
    stubFetch(() => jsonResponse({ item: EST6 }));

    renderItem("/item/EST-6");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Male Adult Bulldog" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Male Adult Bulldog" })).toHaveAttribute(
      "src",
      "/images/dogs.svg",
    );
    expect(screen.getByText("Friendly dog from England.")).toBeInTheDocument();
    expect(screen.getByText("List Price")).toBeInTheDocument();
    expect(screen.getByText("$18.50")).toBeInTheDocument();
    expect(screen.getByText("Your Price")).toBeInTheDocument();
    expect(screen.getByText("$12.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();
  });

  it("shows the not-found frame for an item missing in this locale, without a partial page", async () => {
    stubFetch(() => jsonResponse({ message: "not found" }, 404));

    renderItem("/item/EST-15?locale=ja_JP");

    expect(await screen.findByRole("alert")).toHaveTextContent("Item not found");
  });

  it("POSTs the itemId to /api/cart/items when Add to Cart is activated", async () => {
    const cartPost = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      () => Promise.resolve(jsonResponse({ lines: [] })),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input), "http://localhost");
        if (url.pathname === "/api/catalog/categories") {
          return Promise.resolve(jsonResponse({ categories: MENU_CATEGORIES }));
        }
        if (url.pathname === "/api/cart/items") {
          return cartPost(input, init);
        }
        return Promise.resolve(jsonResponse({ item: EST6 }));
      }),
    );
    const user = userEvent.setup();

    renderItem("/item/EST-6");
    await screen.findByRole("heading", { level: 1, name: "Male Adult Bulldog" });

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(cartPost).toHaveBeenCalledTimes(1);
    const [, init] = cartPost.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ itemId: "EST-6" });
  });

  it("requests the effective locale as a query parameter", async () => {
    let requestedUrl: URL | undefined;
    stubFetch((url) => {
      requestedUrl = url;
      return jsonResponse({ item: EST6 });
    });

    renderItem("/item/EST-6?locale=ja_JP");

    await waitFor(() => expect(requestedUrl).toBeDefined());
    expect(requestedUrl?.searchParams.get("locale")).toBe("ja_JP");
  });
});
