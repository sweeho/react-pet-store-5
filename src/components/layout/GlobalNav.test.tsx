import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignOnSessionProvider } from "@/hooks/useSignOnSession";
import { LocaleProvider } from "@/i18n/LocaleProvider";

import GlobalNav from "./GlobalNav";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// GlobalNav's mobile "Pets" section fetches the live category list and its
// header fetches the session (design.md P5, SWHR-T-0046) — stubbed the same
// way SiteLayout.test.tsx does, minimal here since neither test below reads
// the Pets or sign-on sections.
function stubFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/session")) {
        return Promise.resolve(jsonResponse({ signedOn: false, userId: null }));
      }
      if (url.includes("/api/catalog/categories")) {
        return Promise.resolve(jsonResponse({ categories: [] }));
      }
      return Promise.resolve(jsonResponse({ message: "not found" }, 404));
    }),
  );
}

/**
 * UI / COMPONENT TEST
 *
 * Renders GlobalNav alone, with the session locale forced via
 * LocaleProvider's injectable `fetchLocale` (mirrors SiteLayout.test.tsx),
 * to pin the storefront-area labels design.md §D1 resolves from the
 * `shell` screen by area id instead of the removed PRIMARY_AREAS.label.
 */
function renderGlobalNav(locale: string) {
  stubFetch();
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale, cartLocale: locale })}>
        <SignOnSessionProvider>
          <GlobalNav />
        </SignOnSessionProvider>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe("GlobalNav", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[SWHR-C-0437] renders ja_JP storefront labels from the shell screen", async () => {
    const user = userEvent.setup();
    renderGlobalNav("ja_JP");

    // queryByRole (not getByRole/findByRole) throughout, checked with
    // `.not.toBeNull()`: a query that finds nothing must fail as a normal
    // `expect` assertion. Both getByRole's thrown TestingLibraryElementError
    // AND jest-dom's toBeInTheDocument() (which throws a bare TypeError when
    // given null outside `.not`) read as an uncaught error rather than a
    // test failure to the platform's red/green test-result reader.
    let menuButton: HTMLElement | null = null;
    await waitFor(() => {
      menuButton = screen.queryByRole("button", { name: "メニューを開く" });
      expect(menuButton).not.toBeNull();
    });
    await user.click(menuButton!);

    const dialog = screen.getByRole("dialog");
    const expected: [string, string][] = [
      ["検索", "/search"],
      ["カート", "/cart"],
      ["購入手続き", "/checkout"],
      ["アカウント", "/account"],
      ["管理", "/admin"],
      ["サプライヤー", "/supplier"],
    ];
    for (const [name, href] of expected) {
      const link = within(dialog).queryByRole("link", { name });
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute("href", href);
    }
  });

  it("[SWHR-C-0439] renders zh_CN search and checkout labels", async () => {
    renderGlobalNav("zh_CN");

    let searchLink: HTMLElement | null = null;
    await waitFor(() => {
      searchLink = screen.queryByRole("link", { name: "搜索" });
      expect(searchLink).not.toBeNull();
    });
    expect(searchLink!).toHaveAttribute("href", "/search");

    const checkoutLink = screen.queryByRole("link", { name: "结账" });
    expect(checkoutLink).not.toBeNull();
    expect(checkoutLink).toHaveAttribute("href", "/checkout");
  });
});
