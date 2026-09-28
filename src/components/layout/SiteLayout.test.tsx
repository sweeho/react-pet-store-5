import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { PET_CATEGORIES, PRIMARY_AREAS } from "@/constants/navigation";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import Home from "@/pages/index";

import SiteLayout from "./SiteLayout";

/**
 * UI / COMPONENT TEST
 *
 * Renders the shared shell around a routed child in a MemoryRouter, mirroring
 * how src/main.tsx mounts it in production (SiteLayout wraps the routed
 * pages, not the other way round). `fetchLocale` is stubbed so the shell
 * renders synchronously in en_US without a real network round trip
 * (SiteHeader/GlobalNav/SiteFooter all read their copy via useScreen()).
 */
function renderShell(initialPath: string) {
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

  it("the Global nav contains a link with href '/' and one link per PRIMARY_AREAS and PET_CATEGORIES entry", () => {
    renderShell("/cart");

    const nav = screen.getByRole("navigation", { name: "Global" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("/");
    for (const area of PRIMARY_AREAS) {
      expect(hrefs).toContain(area.href);
    }
    for (const category of PET_CATEGORIES) {
      expect(hrefs).toContain(category.href);
    }
  });

  it("opens the mobile menu panel and closes it again", async () => {
    const user = userEvent.setup();
    renderShell("/cart");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Birds" })).toBeInTheDocument();

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
});
