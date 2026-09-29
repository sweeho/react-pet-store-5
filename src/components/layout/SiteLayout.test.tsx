import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PET_CATEGORIES, PRIMARY_AREAS } from "@/constants/navigation";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import Home from "@/pages/index";

import SiteLayout from "./SiteLayout";

interface SessionState {
  signedOn: boolean;
  userId: string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const MENU_CATEGORIES = [
  { categoryId: "BIRDS", name: "Birds", description: null, image: null, locale: "en_US" },
  { categoryId: "CATS", name: "Cats", description: null, image: null, locale: "en_US" },
  { categoryId: "DOGS", name: "Dogs", description: null, image: null, locale: "en_US" },
  { categoryId: "FISH", name: "Fish", description: null, image: null, locale: "en_US" },
  { categoryId: "REPTILES", name: "Reptiles", description: null, image: null, locale: "en_US" },
];

// SiteLayout hardwires SignOnSessionProvider (no injectable prop — pages and
// the shell are rendered with no props of their own, same reasoning as
// ProductPage's test), so the seam under test is `fetch`, stubbed per test.
// GlobalNav's mobile "Pets" section also fetches the live category list
// (design.md P5), so every test stubs that endpoint too.
function stubSignOnFetch(session: SessionState = { signedOn: false, userId: null }) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/session")) {
        return Promise.resolve(jsonResponse(session));
      }
      if (url.includes("/api/signoff") && init?.method === "POST") {
        return Promise.resolve(jsonResponse({ redirect: "/signed-out" }));
      }
      if (url.includes("/api/catalog/categories")) {
        return Promise.resolve(jsonResponse({ categories: MENU_CATEGORIES }));
      }
      return Promise.resolve(jsonResponse({ message: "not found" }, 404));
    }),
  );
}

/**
 * UI / COMPONENT TEST
 *
 * Renders the shared shell around a routed child in a MemoryRouter, mirroring
 * how src/main.tsx mounts it in production (SiteLayout wraps the routed
 * pages, not the other way round). `fetchLocale` is stubbed so the shell
 * renders synchronously in en_US without a real network round trip
 * (SiteHeader/GlobalNav/SiteFooter all read their copy via useScreen()).
 */
function renderShell(initialPath: string, session?: SessionState) {
  stubSignOnFetch(session);
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider
        fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
        postLocale={(id) => Promise.resolve({ ok: true, locale: id })}
      >
        <SiteLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<div>page body</div>} />
          </Routes>
        </SiteLayout>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe("SiteLayout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[SWHR-C-0007] renders header, Global nav and footer exactly once, with the page content inside main, in that DOM order", () => {
    renderShell("/cart");

    const header = screen.getByRole("banner");
    const nav = screen.getByRole("navigation", { name: "Global" });
    const main = screen.getByRole("main");
    const footer = screen.getByRole("contentinfo");

    expect(within(main).getByText("page body")).toBeInTheDocument();

    expect(header.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(header.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("[SWHR-C-0005] clicking the Global nav's Home link from a non-root route renders the landing page", async () => {
    const user = userEvent.setup();
    renderShell("/cart");

    const nav = screen.getByRole("navigation", { name: "Global" });
    const homeLink = within(nav).getByRole("link", { name: "Pet Store home" });
    expect(homeLink).toHaveAttribute("href", "/");

    await user.click(homeLink);

    expect(
      screen.getByRole("heading", { level: 1, name: /Find your next pet/i }),
    ).toBeInTheDocument();
  });

  it("the Global nav contains a link with href '/' and one link per non-catalog PRIMARY_AREAS entry", () => {
    renderShell("/cart");

    const nav = screen.getByRole("navigation", { name: "Global" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("/");
    // SIGNIN is excluded: SD-6 gives the header's Sign in link a
    // session-dependent target (/signon-welcome, not PRIMARY_AREAS'
    // /signin) and a Sign out state with no href at all — covered below.
    // The pet-category entries are excluded too: SWHR-T-0060 moves category
    // navigation out of the Global nav's desktop row entirely, into the
    // per-page Pets panel and the mobile drawer's "Pets" section (both fed
    // by the live category list, not this static one) — see below.
    for (const area of PRIMARY_AREAS.filter(
      (a) => a.id !== "SIGNIN" && !PET_CATEGORIES.some((category) => category.id === a.id),
    )) {
      expect(hrefs).toContain(area.href);
    }
    for (const category of PET_CATEGORIES) {
      expect(hrefs).not.toContain(category.href);
    }
  });

  it("the mobile drawer's 'Pets' section lists the live categories, not the static PET_CATEGORIES labels", async () => {
    const user = userEvent.setup();
    renderShell("/cart");

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog");

    for (const category of MENU_CATEGORIES) {
      expect(await within(dialog).findByRole("link", { name: category.name })).toHaveAttribute(
        "href",
        `/category/${category.categoryId}`,
      );
    }
    expect(within(dialog).getByText("Pets")).toBeInTheDocument();
  });

  it("[SWHR-C-0104] anonymous shopper: header shows logo, search, Account, Cart and Sign in (to /signon-welcome, SD-6), no Sign out", async () => {
    renderShell("/cart", { signedOn: false, userId: null });

    const nav = screen.getByRole("navigation", { name: "Global" });
    await waitFor(() =>
      expect(within(nav).getByRole("link", { name: /Sign in/ })).toBeInTheDocument(),
    );

    expect(within(nav).getByRole("link", { name: "Pet Store home" })).toBeInTheDocument();
    expect(within(nav).getByRole("searchbox")).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: /Account/ })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: /Cart/ })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: /Sign in/ })).toHaveAttribute(
      "href",
      "/signon-welcome",
    );
    expect(within(nav).queryByText("Sign out")).not.toBeInTheDocument();
  });

  it("[SWHR-C-0105] signed-on shopper: header shows Sign out in place of Sign in", async () => {
    renderShell("/cart", { signedOn: true, userId: "alice" });

    const nav = screen.getByRole("navigation", { name: "Global" });
    await waitFor(() =>
      expect(within(nav).getByRole("button", { name: "Sign out" })).toBeInTheDocument(),
    );
    expect(within(nav).queryByRole("link", { name: /Sign in/ })).not.toBeInTheDocument();
  });

  it("opens the mobile menu panel and closes it again", async () => {
    const user = userEvent.setup();
    renderShell("/cart");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = screen.getByRole("dialog");
    expect(await within(dialog).findByRole("link", { name: "Birds" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("[AC-2] offers English, Japanese and Chinese language controls, pressed on the effective locale", () => {
    renderShell("/cart");

    const english = screen.getByRole("button", { name: "English" });
    const japanese = screen.getByRole("button", { name: "日本語" });
    const chinese = screen.getByRole("button", { name: "中文" });

    expect(english).toHaveAttribute("aria-pressed", "true");
    expect(japanese).toHaveAttribute("aria-pressed", "false");
    expect(chinese).toHaveAttribute("aria-pressed", "false");
  });

  it("[AC-2] offers the same three language controls in the mobile drawer", async () => {
    const user = userEvent.setup();
    renderShell("/cart");

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(dialog).getByRole("button", { name: "日本語" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "中文" })).toBeInTheDocument();
  });

  it("switching language re-renders the same page in place, in the new language", async () => {
    const user = userEvent.setup();
    renderShell("/cart");

    expect(screen.getByText("page body")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "日本語" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "日本語" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    expect(screen.getByText("page body")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Global" });
    expect(within(nav).getByText("言語")).toBeInTheDocument();
  });

  it("switching language from the mobile drawer closes the drawer and re-renders the page", async () => {
    const user = userEvent.setup();
    renderShell("/cart");

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "中文" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("page body")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "中文" })).toHaveAttribute("aria-pressed", "true"),
    );
  });
});
