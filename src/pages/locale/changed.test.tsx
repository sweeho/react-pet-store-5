import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import LocaleChanged from "./changed";

function renderChanged(locale: string) {
  return render(
    <MemoryRouter>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale, cartLocale: locale })}>
        <LocaleChanged />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * [AC-2] the confirmation screen shows the locale now in effect
 * (SWHR-R-0023.02), in that locale's own translated content (D3).
 */
describe("LocaleChanged", () => {
  it("shows the locale now in effect, translated into itself", async () => {
    renderChanged("zh_CN");

    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: "语言已更改" })).toBeInTheDocument(),
    );
    expect(screen.getByText("zh_CN")).toBeInTheDocument();
    expect(screen.getByText("简体中文")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回首页" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "重新选择语言" })).toHaveAttribute("href", "/locale");
  });
});
