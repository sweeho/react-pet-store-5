import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { PET_CATEGORIES, PRIMARY_AREAS } from "@/constants/navigation";
import { LocaleProvider } from "@/i18n/LocaleProvider";

import Home from "./index";

/**
 * UI / PAGE TEST — [SWHR-C-0003]
 *
 * Renders the landing page at '/' in a MemoryRouter and asserts it links to
 * every primary area and every pet category, using the shared
 * src/constants/navigation.ts list so this test and the page can never drift.
 * `fetchLocale` is stubbed so the page renders synchronously in en_US
 * without a real network round trip (Home reads its copy via useScreen()).
 */
function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <Home />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe("Home page", () => {
  it("renders the hero heading", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: "Find your next pet" }),
    ).toBeInTheDocument();
  });

  it("[SWHR-C-0003] links to every primary area", () => {
    renderHome();

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));

    for (const area of PRIMARY_AREAS) {
      expect(hrefs).toContain(area.href);
    }
  });

  it("[SWHR-C-0003] links to every pet category", () => {
    renderHome();

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));

    for (const category of PET_CATEGORIES) {
      expect(hrefs).toContain(category.href);
    }
  });
});
