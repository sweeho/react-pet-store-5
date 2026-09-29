import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import OrderErrorPage from "./order-error";

describe("OrderErrorPage", () => {
  it("shows the empty-cart Order Error with links onward", () => {
    render(
      <MemoryRouter>
        <LocaleProvider
          fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
        >
          <OrderErrorPage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Order Error" })).toBeInTheDocument();
    expect(
      screen.getByText("Your shopping cart is empty, so the order could not be placed."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue shopping" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "View cart" })).toHaveAttribute("href", "/cart");
  });
});
