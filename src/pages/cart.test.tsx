import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import CartPlaceholder from "./cart";

function renderCart(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <CartPlaceholder />
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
describe("CartPlaceholder", () => {
  it("renders the en_US screen content by default", () => {
    renderCart("/cart");
    expect(screen.getByRole("heading", { level: 1, name: "Cart" })).toBeInTheDocument();
    expect(screen.getByText("Your cart is coming soon.")).toBeInTheDocument();
  });

  it("[AC-1] renders the Japanese screen content for ?locale=ja_JP", () => {
    renderCart("/cart?locale=ja_JP");
    expect(screen.getByRole("heading", { level: 1, name: "カート" })).toBeInTheDocument();
    expect(screen.getByText("カート機能は近日公開予定です。")).toBeInTheDocument();
  });
});
