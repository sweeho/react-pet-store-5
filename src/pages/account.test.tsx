import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import AccountPlaceholder from "./account";

function renderAccount(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <AccountPlaceholder />
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
describe("AccountPlaceholder", () => {
  it("renders the en_US screen content by default", () => {
    renderAccount("/account");
    expect(screen.getByRole("heading", { level: 1, name: "Account" })).toBeInTheDocument();
  });

  it("[AC-1] renders the Japanese screen content for ?locale=ja_JP", () => {
    renderAccount("/account?locale=ja_JP");
    expect(screen.getByRole("heading", { level: 1, name: "アカウント" })).toBeInTheDocument();
  });
});
