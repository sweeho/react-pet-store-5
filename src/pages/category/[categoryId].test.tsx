import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import CategoryPlaceholder from "./[categoryId]";

function renderCategory(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <Routes>
          <Route path="/category/:categoryId" element={<CategoryPlaceholder />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * [AC-1] every page renders content authored for the requested locale
 * (SWHR-R-0005.01); [AC-3] a `?locale=` override takes effect for this
 * render without touching the session (P3, SD-10).
 */
describe("CategoryPlaceholder", () => {
  it("renders the category label and the en_US coming-soon copy by default", () => {
    renderCategory("/category/DOGS");
    expect(screen.getByRole("heading", { level: 1, name: "Dogs" })).toBeInTheDocument();
    expect(screen.getByText("Browsing this category is coming soon.")).toBeInTheDocument();
  });

  it("[AC-3] a request-level ?locale= renders the Japanese coming-soon copy for this render only", () => {
    renderCategory("/category/DOGS?locale=ja_JP");
    expect(screen.getByText("このカテゴリーの閲覧機能は近日公開予定です。")).toBeInTheDocument();
  });

  it("falls back to the localized fallback title for an unknown category id", () => {
    renderCategory("/category/UNKNOWN?locale=zh_CN");
    expect(screen.getByRole("heading", { level: 1, name: "分类" })).toBeInTheDocument();
  });
});
