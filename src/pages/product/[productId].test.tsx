import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import type { PageInfo } from "../../../lib/catalog/paging";
import type { ItemView, ProductView } from "../../../lib/catalog/queries";
import ProductPage from "./[productId]";

interface ProductPayload {
  product: ProductView;
  items: ItemView[];
  paging: PageInfo;
}

const NO_PAGING: PageInfo = {
  start: 0,
  count: 2,
  hasNext: false,
  nextStart: null,
  hasPrevious: false,
  previousStart: null,
};

const MENU_CATEGORIES = [
  { categoryId: "DOGS", name: "Dogs", description: null, image: null, locale: "en_US" },
];

const BULLDOG_EN: ProductPayload = {
  product: {
    productId: "K9-BD-01",
    categoryId: "DOGS",
    name: "Bulldog",
    description: "Friendly, loyal family dog.",
    image: null,
    locale: "en_US",
  },
  items: [
    {
      itemId: "EST-6",
      productId: "K9-BD-01",
      categoryId: "DOGS",
      productName: "Bulldog",
      name: "Male Adult Bulldog",
      description: "Friendly dog from England",
      image: "dogs.svg",
      attributes: ["Male Adult", null, null, null, null],
      listPrice: 1850,
      unitCost: 1200,
      locale: "en_US",
    },
  ],
  paging: NO_PAGING,
};

const BULLDOG_JA: ProductPayload = {
  product: { ...BULLDOG_EN.product, name: "ブルドッグ", locale: "ja_JP" },
  items: [
    {
      ...BULLDOG_EN.items[0],
      name: "オス成犬ブルドッグ",
      listPrice: 2000,
      locale: "ja_JP",
    },
  ],
  paging: NO_PAGING,
};

const FEMALE_PUPPY_BULLDOG: ItemView = {
  itemId: "EST-7",
  productId: "K9-BD-01",
  categoryId: "DOGS",
  productName: "Bulldog",
  name: "Female Puppy Bulldog",
  description: "Friendly dog from England.",
  image: "dogs.svg",
  attributes: ["Female Puppy", null, null, null, null],
  listPrice: 1850,
  unitCost: 1200,
  locale: "en_US",
};

const BULLDOG_TWO_ITEMS: ProductPayload = {
  product: BULLDOG_EN.product,
  items: [BULLDOG_EN.items[0], FEMALE_PUPPY_BULLDOG],
  paging: NO_PAGING,
};

const BULLDOG_PAGE_1_OF_2: ProductPayload = {
  product: BULLDOG_EN.product,
  items: [BULLDOG_EN.items[0]],
  paging: {
    start: 0,
    count: 1,
    hasNext: true,
    nextStart: 1,
    hasPrevious: false,
    previousStart: null,
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderProduct(initialPath: string, locale: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale, cartLocale: locale })}>
        <Routes>
          <Route path="/product/:productId" element={<ProductPage />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * `global.fetch` is stubbed per test (the page calls it directly — there's
 * no injectable prop the way LocaleProvider offers one, since pages are
 * rendered by the router with no props). AC-1 (product-page language
 * switch) is proven end-to-end in e2e/product-locale.spec.ts; this test
 * covers the per-locale fetch, the price format, and the not-found state.
 */
describe("ProductPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/catalog/categories")) {
          return Promise.resolve(jsonResponse({ categories: MENU_CATEGORIES }));
        }
        if (url.includes("locale=ja_JP")) {
          return Promise.resolve(jsonResponse(BULLDOG_JA));
        }
        if (url.includes("locale=en_US")) {
          return Promise.resolve(jsonResponse(BULLDOG_EN));
        }
        return Promise.resolve(jsonResponse({ message: "not found" }, 404));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[AC-2] renders the product name, item name and formatted en_US price", async () => {
    renderProduct("/product/K9-BD-01", "en_US");

    expect(await screen.findByRole("heading", { level: 1, name: "Bulldog" })).toBeInTheDocument();
    expect(screen.getByText("Male Adult Bulldog")).toBeInTheDocument();
    expect(screen.getByText("$18.50")).toBeInTheDocument();
  });

  it("[AC-5] renders the Japanese content and the Japanese-format price with no conversion", async () => {
    renderProduct("/product/K9-BD-01?locale=ja_JP", "en_US");

    expect(
      await screen.findByRole("heading", { level: 1, name: "ブルドッグ" }),
    ).toBeInTheDocument();
    expect(screen.getByText("オス成犬ブルドッグ")).toBeInTheDocument();
    expect(screen.getByText("￥2,000")).toBeInTheDocument();
  });

  it("[AC-3] shows the not-found frame, not English content, for a locale with no details", async () => {
    renderProduct("/product/K9-PO-02?locale=zh_CN", "en_US");

    expect(await screen.findByText("未找到商品")).toBeInTheDocument();
    expect(screen.queryByText("Poodle")).not.toBeInTheDocument();
  });

  it("posts the item id to /api/cart/items and shows a confirmation when Add to Cart is activated", async () => {
    const user = userEvent.setup();
    renderProduct("/product/K9-BD-01", "en_US");

    const addButton = await screen.findByRole("button", { name: "Add to Cart" });
    await user.click(addButton);

    const fetchMock = vi.mocked(fetch);
    const cartCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes("/api/cart/items"),
    );
    expect(cartCalls).toHaveLength(1);
    const [, init] = cartCalls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ itemId: "EST-6" });
    expect(await screen.findByText("Added to cart")).toBeInTheDocument();
  });

  it("[SWHR-C-0188] each row shows the item's title linked to its detail page, its description, list price and Add to Cart", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/catalog/categories")) {
          return Promise.resolve(jsonResponse({ categories: MENU_CATEGORIES }));
        }
        return Promise.resolve(jsonResponse(BULLDOG_TWO_ITEMS));
      }),
    );

    renderProduct("/product/K9-BD-01", "en_US");
    await screen.findByRole("heading", { level: 1, name: "Bulldog" });

    const maleLink = screen.getByRole("link", { name: /Male Adult Bulldog/ });
    expect(maleLink).toHaveAttribute("href", "/item/EST-6");
    const maleRow = maleLink.closest("li");
    expect(maleRow).not.toBeNull();
    expect(within(maleRow!).getByText("Friendly dog from England.")).toBeInTheDocument();
    expect(within(maleRow!).getByText("$18.50")).toBeInTheDocument();
    expect(within(maleRow!).getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();

    const femaleLink = screen.getByRole("link", { name: /Female Puppy Bulldog/ });
    expect(femaleLink).toHaveAttribute("href", "/item/EST-7");
    const femaleRow = femaleLink.closest("li");
    expect(femaleRow).not.toBeNull();
    expect(within(femaleRow!).getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();
  });

  it("shows a Next link when the product has more items than one page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/catalog/categories")) {
          return Promise.resolve(jsonResponse({ categories: MENU_CATEGORIES }));
        }
        return Promise.resolve(jsonResponse(BULLDOG_PAGE_1_OF_2));
      }),
    );

    renderProduct("/product/K9-BD-01", "en_US");
    await screen.findByRole("heading", { level: 1, name: "Bulldog" });

    expect(screen.getByRole("link", { name: /Next/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Previous/ })).not.toBeInTheDocument();
  });
});
