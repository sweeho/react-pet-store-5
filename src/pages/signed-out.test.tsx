import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import SignedOutPage from "./signed-out";

function renderPage(initialPath = "/signed-out") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <SignedOutPage />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/** UI / PAGE TEST — SWHR-R-0073: thanks the shopper and offers Sign in again. */
describe("SignedOutPage", () => {
  it("thanks the shopper and links to sign in again", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "You are signed out" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in again" })).toHaveAttribute(
      "href",
      "/signon-welcome",
    );
    expect(screen.getByRole("link", { name: "Keep browsing" })).toHaveAttribute("href", "/");
  });

  it("[SWHR-R-0073.01] renders in Japanese when the session locale is Japanese", () => {
    renderPage("/signed-out?locale=ja_JP");

    expect(screen.getByRole("heading", { name: "サインアウトしました" })).toBeInTheDocument();
  });
});
