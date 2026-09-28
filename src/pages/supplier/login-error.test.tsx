import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import SupplierLoginErrorPage from "./login-error";

/**
 * UI / PAGE TEST
 *
 * SWHR-R-0077: mockup-supplier-sign-in-error.html's heading, description
 * and link back to the sign-in form.
 */
describe("SupplierLoginErrorPage", () => {
  it("shows the login error message with a link back to supplier sign-in", () => {
    render(
      <MemoryRouter>
        <SupplierLoginErrorPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Login error" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "The user could not be authenticated. Please check your username and password and try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to supplier sign-in" })).toHaveAttribute(
      "href",
      "/supplier/signin",
    );
  });
});
