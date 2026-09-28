import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import CheckoutPlaceholder from "./checkout";

function renderCheckout(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <CheckoutPlaceholder />
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
describe("CheckoutPlaceholder", () => {
  it("renders the en_US screen content by default", () => {
    renderCheckout("/checkout");
    expect(screen.getByRole("heading", { level: 1, name: "Checkout" })).toBeInTheDocument();
  });

  it("[AC-1] renders the Chinese screen content for ?locale=zh_CN", () => {
    renderCheckout("/checkout?locale=zh_CN");
    expect(screen.getByRole("heading", { level: 1, name: "结账" })).toBeInTheDocument();
    expect(screen.getByText("结账功能即将推出。")).toBeInTheDocument();
  });
});
