import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import CategoryPage from "./[categoryId]";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const MENU_CATEGORIES = [
  { categoryId: "DOGS", name: "Dogs", description: null, image: null, locale: "en_US" },
  { categoryId: "CATS", name: "Cats", description: null, image: null, locale: "en_US" },
];

function stubFetch(categoryHandler: (url: URL) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      if (url.pathname === "/api/catalog/categories") {
        return Promise.resolve(jsonResponse({ categories: MENU_CATEGORIES }));
      }
      if (url.pathname === "/api/account") {
        // The Pets menu's My List panel asks who is signed on; anonymous here.
        return Promise.resolve(jsonResponse({}, 401));
      }
      return Promise.resolve(categoryHandler(url));
    }),
  );
}

function renderCategory(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <Routes>
          <Route path="/category/:categoryId" element={<CategoryPage />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

const BULLDOG = {
  productId: "K9-BD-01",
  categoryId: "DOGS",
  name: "Bulldog",
  description: "Friendly dog from England",
  image: null,
  locale: "en_US",
};
const CHIHUAHUA = {
  productId: "K9-CW-01",
  categoryId: "DOGS",
  name: "Chihuahua",
  description: "Great companion dog",
  image: null,
  locale: "en_US",
};

/**
 * UI / PAGE TEST
 *
 * Replaces the "coming soon" placeholder (SWHR-T-0060). Fetches
 * GET /api/catalog/categories/:categoryId, paged two at a time
 * (design.md P1, Q4), and never errors for an unknown category (SD6) — a
 * missing `category` in the response still renders an (empty) listing.
 */
describe("CategoryPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[SWHR-C-0173][SWHR-C-0186] renders the category name and a linked, described row per product, with a Next link and no Previous link", async () => {
    stubFetch(() =>
      jsonResponse({
        category: {
          categoryId: "DOGS",
          name: "Dogs",
          description: null,
          image: null,
          locale: "en_US",
        },
        items: [BULLDOG, CHIHUAHUA],
        paging: {
          start: 0,
          count: 2,
          hasNext: true,
          nextStart: 2,
          hasPrevious: false,
          previousStart: null,
        },
      }),
    );

    renderCategory("/category/DOGS");

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: /Bulldog/ })).not.toBeNull();
    });
    expect(screen.getByRole("heading", { level: 1, name: "Dogs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bulldog/ })).toHaveAttribute(
      "href",
      "/product/K9-BD-01",
    );
    expect(screen.getByText("Friendly dog from England")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Next/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Previous/ })).not.toBeInTheDocument();
  });

  it("shows the empty-state frame when the category has no products in this locale", async () => {
    stubFetch(() =>
      jsonResponse({
        category: {
          categoryId: "DOGS",
          name: "Dogs",
          description: null,
          image: null,
          locale: "en_US",
        },
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

    renderCategory("/category/DOGS");

    expect(await screen.findByText("No pets to show here")).toBeInTheDocument();
  });

  it("renders an empty listing for an unknown category, without an error", async () => {
    stubFetch(() =>
      jsonResponse({
        category: null,
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

    renderCategory("/category/UNICORNS");

    expect(await screen.findByText("No pets to show here")).toBeInTheDocument();
    expect(screen.queryByTestId("error-state")).not.toBeInTheDocument();
  });

  it("shows the catalog-unavailable error frame on a 503, and retries", async () => {
    const fetchCategory = vi
      .fn()
      .mockReturnValueOnce(jsonResponse({}, 503))
      .mockReturnValueOnce(
        jsonResponse({
          category: {
            categoryId: "DOGS",
            name: "Dogs",
            description: null,
            image: null,
            locale: "en_US",
          },
          items: [BULLDOG],
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
    stubFetch(fetchCategory);
    const user = userEvent.setup();

    renderCategory("/category/DOGS");

    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Try again/ }));

    expect(await screen.findByRole("heading", { level: 1, name: "Dogs" })).toBeInTheDocument();
  });

  it("requests locale, start and count as query parameters, defaulting start=0 count=2", async () => {
    let requestedUrl: URL | undefined;
    stubFetch((url) => {
      requestedUrl = url;
      return jsonResponse({
        category: {
          categoryId: "DOGS",
          name: "Dogs",
          description: null,
          image: null,
          locale: "en_US",
        },
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

    renderCategory("/category/DOGS?locale=ja_JP&start=2&count=2");

    await waitFor(() => expect(requestedUrl).toBeDefined());
    expect(requestedUrl?.searchParams.get("locale")).toBe("ja_JP");
    expect(requestedUrl?.searchParams.get("start")).toBe("2");
    expect(requestedUrl?.searchParams.get("count")).toBe("2");
  });
});
