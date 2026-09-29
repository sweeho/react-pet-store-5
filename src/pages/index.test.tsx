import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PRIMARY_AREAS } from "@/constants/navigation";
import { LocaleProvider } from "@/i18n/LocaleProvider";

import Home from "./index";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
}

const CATEGORIES = [
  { categoryId: "BIRDS", name: "Birds", description: null, image: null, locale: "en_US" },
  { categoryId: "CATS", name: "Cats", description: null, image: null, locale: "en_US" },
  { categoryId: "DOGS", name: "Dogs", description: null, image: null, locale: "en_US" },
  { categoryId: "FISH", name: "Fish", description: null, image: null, locale: "en_US" },
  { categoryId: "REPTILES", name: "Reptiles", description: null, image: null, locale: "en_US" },
];

/**
 * UI / PAGE TEST — [SWHR-C-0003] (earlier ticket) and [SWHR-C-0182]
 *
 * Renders the landing page at '/' in a MemoryRouter. The picture map is fed
 * by GET /api/catalog/categories (design.md P5) rather than the static
 * PET_CATEGORIES list, so every test stubs it; `fetchLocale` is stubbed so
 * the page renders synchronously in en_US without a real network round trip
 * for locale.
 */
function renderHome() {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(jsonResponse({ categories: CATEGORIES }))),
  );

  return render(
    <MemoryRouter initialEntries={["/"]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <Home />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe("Home page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the hero heading", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: "Find your next pet" }),
    ).toBeInTheDocument();
  });

  it("[SWHR-C-0003] links to every primary area", async () => {
    renderHome();
    await screen.findByRole("group", { name: "Choose a pet to start" });

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    for (const area of PRIMARY_AREAS) {
      expect(hrefs).toContain(area.href);
    }
  });

  it("[SWHR-C-0003] links to every pet category", async () => {
    renderHome();
    const map = await screen.findByRole("group", { name: "Choose a pet to start" });

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    for (const category of CATEGORIES) {
      expect(hrefs).toContain(`/category/${category.categoryId}`);
    }
    expect(within(map).getAllByRole("link")).toHaveLength(5);
  });

  it("[SWHR-C-0182] the picture map offers exactly five regions: Birds, Cats, Dogs, Fish and Reptiles", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.queryByRole("group", { name: "Choose a pet to start" })).not.toBeNull();
    });
    const map = screen.getByRole("group", { name: "Choose a pet to start" });
    const links = within(map).getAllByRole("link");

    expect(links).toHaveLength(5);
    expect(links.map((link) => link.getAttribute("href")).sort()).toEqual(
      [
        "/category/BIRDS",
        "/category/CATS",
        "/category/DOGS",
        "/category/FISH",
        "/category/REPTILES",
      ].sort(),
    );
  });

  it("omits a region for a category the API doesn't return in this locale", async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({ categories: CATEGORIES.filter((c) => c.categoryId !== "REPTILES") }),
        ),
      ),
    );

    render(
      <MemoryRouter initialEntries={["/"]}>
        <LocaleProvider
          fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
        >
          <Home />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const map = await screen.findByRole("group", { name: "Choose a pet to start" });
    await waitFor(() => expect(within(map).getAllByRole("link")).toHaveLength(4));
    expect(within(map).queryByRole("link", { name: /Reptiles/ })).not.toBeInTheDocument();
  });
});
