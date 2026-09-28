import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { PET_CATEGORIES, PRIMARY_AREAS } from "@/constants/navigation";

import Home from "./index";

/**
 * UI / PAGE TEST — [SWHR-C-0003]
 *
 * Renders the landing page at '/' in a MemoryRouter and asserts it links to
 * every primary area and every pet category, using the shared
 * src/constants/navigation.ts list so this test and the page can never drift.
 */
describe("Home page", () => {
  it("renders the hero heading", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Home />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Find your next pet" }),
    ).toBeInTheDocument();
  });

  it("[SWHR-C-0003] links to every primary area", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Home />
      </MemoryRouter>,
    );

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));

    for (const area of PRIMARY_AREAS) {
      expect(hrefs).toContain(area.href);
    }
  });

  it("[SWHR-C-0003] links to every pet category", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Home />
      </MemoryRouter>,
    );

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));

    for (const category of PET_CATEGORIES) {
      expect(hrefs).toContain(category.href);
    }
  });
});
