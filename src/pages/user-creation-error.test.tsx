import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import UserCreationErrorPage from "./user-creation-error";

function renderPage(initialPath = "/user-creation-error") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <UserCreationErrorPage />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/** UI / PAGE TEST — SWHR-R-0057: asks the shopper to choose another user name. */
describe("UserCreationErrorPage", () => {
  it("shows the in-use message and a link back to the sign-in form to choose another name", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "User Creation Error" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "The user name you chose is already in use. Please go back and choose another user name.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose another user name" })).toHaveAttribute(
      "href",
      "/signin",
    );
  });

  it("renders the Japanese screen content for ?locale=ja_JP", () => {
    renderPage("/user-creation-error?locale=ja_JP");

    expect(screen.getByRole("heading", { name: "ユーザー作成エラー" })).toBeInTheDocument();
  });
});
