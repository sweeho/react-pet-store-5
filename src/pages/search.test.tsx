import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import SearchPage from "./search";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const MENU_CATEGORIES = [
  { categoryId: "DOGS", name: "Dogs", description: null, image: null, locale: "en_US" },
];

function stubFetch(searchHandler: (url: URL) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      if (url.pathname === "/api/catalog/categories") {
        return Promise.resolve(jsonResponse({ categories: MENU_CATEGORIES }));
      }
      return Promise.resolve(searchHandler(url));
    }),
  );
}

function renderSearch(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <SearchPage />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

const BULLDOG_ITEM = {
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

/**
 * UI / PAGE TEST
 *
 * Replaces the "coming soon" placeholder (SWHR-T-0060). Fetches
 * GET /api/catalog/search?keywords=, showing the unit cost per row (Q7) and
 * "No results were found for your search." for no match or a blank field
 * (SWHR-R-0107).
 */
describe("SearchPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows 'Items matching any of: bulldog' and one row per matching item", async () => {
    stubFetch(() =>
      jsonResponse({
        keywords: ["bulldog"],
        items: [BULLDOG_ITEM],
        paging: {
          start: 0,
          count: 2,
          hasNext: false,
          nextStart: null,
          hasPrevious: false,
          previousStart: null,
        },
      }),
    );

    renderSearch("/search?keywords=bulldog");

    expect(await screen.findByText(/Items matching any of:/)).toHaveTextContent(
      "Items matching any of: bulldog",
    );
    const row = screen.getByRole("link", { name: /Male Adult Bulldog/ });
    expect(row).toHaveAttribute("href", "/item/EST-6");
    expect(screen.getByText("Friendly dog from England.")).toBeInTheDocument();
    expect(screen.getByText("$12.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();
  });

  it("[SWHR-C-0106] shows the no-results message when nothing matches", async () => {
    stubFetch(() =>
      jsonResponse({
        keywords: ["zebra"],
        items: [],
        paging: {
          start: 0,
          count: 2,
          hasNext: false,
          nextStart: null,
          hasPrevious: false,
          previousStart: null,
        },
      }),
    );

    renderSearch("/search?keywords=zebra");

    expect(await screen.findByText("No results were found for your search.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Add to Cart/ })).not.toBeInTheDocument();
  });

  it("shows the no-results message for an empty keyword field", async () => {
    stubFetch(() =>
      jsonResponse({
        keywords: [],
        items: [],
        paging: {
          start: 0,
          count: 2,
          hasNext: false,
          nextStart: null,
          hasPrevious: false,
          previousStart: null,
        },
      }),
    );

    renderSearch("/search");

    expect(await screen.findByText("No results were found for your search.")).toBeInTheDocument();
  });

  it("[AC-1] renders the Japanese heading for ?locale=ja_JP", async () => {
    stubFetch(() =>
      jsonResponse({
        keywords: [],
        items: [],
        paging: {
          start: 0,
          count: 2,
          hasNext: false,
          nextStart: null,
          hasPrevious: false,
          previousStart: null,
        },
      }),
    );

    renderSearch("/search?locale=ja_JP");

    expect(await screen.findByRole("heading", { level: 1, name: "検索結果" })).toBeInTheDocument();
  });

  it("requests locale, start and count as query parameters, defaulting start=0 count=2", async () => {
    let requestedUrl: URL | undefined;
    stubFetch((url) => {
      requestedUrl = url;
      return jsonResponse({
        keywords: ["bulldog"],
        items: [],
        paging: {
          start: 0,
          count: 2,
          hasNext: false,
          nextStart: null,
          hasPrevious: false,
          previousStart: null,
        },
      });
    });

    renderSearch("/search?keywords=bulldog&start=2&count=2");

    await waitFor(() => expect(requestedUrl).toBeDefined());
    expect(requestedUrl?.searchParams.get("keywords")).toBe("bulldog");
    expect(requestedUrl?.searchParams.get("start")).toBe("2");
    expect(requestedUrl?.searchParams.get("count")).toBe("2");
  });
});
