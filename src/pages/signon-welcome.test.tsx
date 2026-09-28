import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { SignOnSessionProvider } from "@/hooks/useSignOnSession";
import { LocaleProvider } from "@/i18n/LocaleProvider";

import SignOnWelcomePage from "./signon-welcome";

function renderPage(userId: string | null, initialPath = "/signon-welcome") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <SignOnSessionProvider
          fetchSession={() => Promise.resolve({ signedOn: userId !== null, userId })}
        >
          <SignOnWelcomePage />
        </SignOnSessionProvider>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/** UI / PAGE TEST — the page a successful sign-on lands on (design.md SD-6). */
describe("SignOnWelcomePage", () => {
  it("greets the signed-on user by id and links onward", async () => {
    renderPage("alice");

    await waitFor(() => expect(screen.getByText("You're signed in as alice.")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Continue shopping" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "View account" })).toHaveAttribute("href", "/account");
  });

  it("renders the Chinese screen content for ?locale=zh_CN", () => {
    renderPage("bob", "/signon-welcome?locale=zh_CN");

    expect(screen.getByRole("heading", { name: "欢迎回来" })).toBeInTheDocument();
  });
});
