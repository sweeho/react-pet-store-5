import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import AdminLoginErrorPage from "./login-error";

/**
 * UI / PAGE TEST
 *
 * SWHR-R-0077: mockup-administrator-sign-in-error.html's heading,
 * description and link back to the sign-in form.
 */
describe("AdminLoginErrorPage", () => {
  it("shows the login error message with a link back to administrator sign-in", () => {
    render(
      <MemoryRouter>
        <AdminLoginErrorPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Login error" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "The user could not be authenticated. Please check your username and password and try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to administration sign-in" })).toHaveAttribute(
      "href",
      "/admin/signin",
    );
  });
});
