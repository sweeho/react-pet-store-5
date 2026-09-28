import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import SignInErrorPage from "./signin-error";

function renderPage(initialPath = "/signin-error") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <SignInErrorPage />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * [SWHR-C-0103's non-e2e half] SWHR-R-0054: the not-found message, an
 * invitation to try again (back to the sign-in form) and a way back home —
 * the e2e half (SWHR-C-0103) belongs to SWHR-T-0048.
 */
describe("SignInErrorPage", () => {
  it("shows the not-found message and a Try again link back to the sign-in form", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Sign-in Error" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "The user name and password you entered were not found in our records. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/signin");
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });

  it("renders the Chinese screen content for ?locale=zh_CN", () => {
    renderPage("/signin-error?locale=zh_CN");

    expect(screen.getByRole("heading", { name: "登录错误" })).toBeInTheDocument();
  });
});
