import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminLandingPage from "./index";

function setNavigatorLanguage(language: string) {
  vi.spyOn(window.navigator, "language", "get").mockReturnValue(language);
}

function renderAdminLanding() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <AdminLandingPage />
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * The public administration landing page (design.md P12): anyone can see
 * it, a Sign in link leads to /admin/signin. navigator.language drives the
 * en/de catalogue the same way the legacy Swing admin client's JVM-default
 * locale did (design SD-5) — stubbed per test via vi.spyOn.
 */
describe("Admin landing page", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the English catalogue by default with a link to sign in", () => {
    setNavigatorLanguage("en-US");

    renderAdminLanding();

    expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link).toHaveAttribute("href", "/admin/signin");
  });

  it("renders the German catalogue's labels, tooltip and mnemonic for a German browser language", () => {
    setNavigatorLanguage("de-DE");

    renderAdminLanding();

    const heading = screen.getByRole("heading", { name: "Verwaltung" });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute("title", "Shopverwaltung");
    expect(heading).toHaveAttribute("accesskey", "v");
    expect(screen.getByRole("link", { name: "Anmelden" })).toHaveAttribute("href", "/admin/signin");
  });
});
