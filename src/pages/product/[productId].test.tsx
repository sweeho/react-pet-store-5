import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import type { ItemView, ProductView } from "../../../lib/catalog/queries";
import ProductPage from "./[productId]";

interface ProductPayload {
  product: ProductView;
  items: ItemView[];
}

const BULLDOG_EN: ProductPayload = {
  product: {
    productId: "BULLDOG",
    categoryId: "DOGS",
    name: "Bulldog",
    description: "Friendly, loyal family dog.",
    image: null,
    locale: "en_US",
  },
  items: [
    {
      itemId: "EST-6",
      productId: "BULLDOG",
      name: "Male Adult Bulldog",
      description: "Friendly dog from England",
      image: "bulldog.gif",
      listPrice: 1850,
      unitCost: 1850,
      locale: "en_US",
    },
  ],
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
    renderProduct("/product/BULLDOG", "en_US");

    expect(await screen.findByRole("heading", { level: 1, name: "Bulldog" })).toBeInTheDocument();
    expect(screen.getByText("Male Adult Bulldog")).toBeInTheDocument();
    expect(screen.getByText("$18.50")).toBeInTheDocument();
  });

  it("[AC-5] renders the Japanese content and the Japanese-format price with no conversion", async () => {
    renderProduct("/product/BULLDOG?locale=ja_JP", "en_US");

    expect(
      await screen.findByRole("heading", { level: 1, name: "ブルドッグ" }),
    ).toBeInTheDocument();
    expect(screen.getByText("オス成犬ブルドッグ")).toBeInTheDocument();
    expect(screen.getByText("￥2,000")).toBeInTheDocument();
  });

  it("[AC-3] shows the not-found frame, not English content, for a locale with no details", async () => {
    renderProduct("/product/POODLE?locale=zh_CN", "en_US");

    expect(await screen.findByText("未找到商品")).toBeInTheDocument();
    expect(screen.queryByText("Poodle")).not.toBeInTheDocument();
  });
});
