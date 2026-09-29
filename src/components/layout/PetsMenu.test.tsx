import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import PetsMenu from "./PetsMenu";

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

function renderPetsMenu(activeCategoryId?: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(jsonResponse({ categories: CATEGORIES }))),
  );

  return render(
    <MemoryRouter>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <PetsMenu activeCategoryId={activeCategoryId} />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/**
 * UI / COMPONENT TEST
 *
 * The side "Pets" panel (design.md P5, SWHR-R-0104): lists the categories
 * GET /api/catalog/categories returns for the session locale, ordered as
 * returned, each linking to its category page.
 */
describe("PetsMenu", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists the five categories from the API, each linking to its category page", async () => {
    renderPetsMenu();

    const nav = await screen.findByRole("navigation", { name: "Pets" });
    for (const category of CATEGORIES) {
      expect(within(nav).getByRole("link", { name: category.name })).toHaveAttribute(
        "href",
        `/category/${category.categoryId}`,
      );
    }
  });

  it("marks the active category current, and no other", async () => {
    renderPetsMenu("CATS");

    const nav = await screen.findByRole("navigation", { name: "Pets" });
    expect(within(nav).getByRole("link", { name: "Cats" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Dogs" })).not.toHaveAttribute("aria-current");
  });
});
