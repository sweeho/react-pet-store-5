import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import SearchPlaceholder from "./search";

function renderSearch(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <SearchPlaceholder />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * [AC-1] every page renders content authored for the requested locale
 * (SWHR-R-0005.01), exercised here through `?locale=` (P3, SD-10).
 */
describe("SearchPlaceholder", () => {
  it("renders the en_US screen content by default", () => {
    renderSearch("/search");
    expect(screen.getByRole("heading", { level: 1, name: "Search" })).toBeInTheDocument();
  });

  it("[AC-1] renders the Japanese screen content for ?locale=ja_JP", () => {
    renderSearch("/search?locale=ja_JP");
    expect(screen.getByRole("heading", { level: 1, name: "検索" })).toBeInTheDocument();
  });

  it("[SWHR-C-0106] states the keyword in the heading when the header search routes here", () => {
    renderSearch("/search?keywords=dog");
    expect(
      screen.getByRole("heading", { level: 1, name: 'Search results for "dog"' }),
    ).toBeInTheDocument();
  });
});
