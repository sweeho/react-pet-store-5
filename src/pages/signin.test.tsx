import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import SignInPlaceholder from "./signin";

function renderSignIn(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <SignInPlaceholder />
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
describe("SignInPlaceholder", () => {
  it("renders the en_US screen content by default", () => {
    renderSignIn("/signin");
    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
  });

  it("[AC-1] renders the Chinese screen content for ?locale=zh_CN", () => {
    renderSignIn("/signin?locale=zh_CN");
    expect(screen.getByRole("heading", { level: 1, name: "登录" })).toBeInTheDocument();
  });
});
