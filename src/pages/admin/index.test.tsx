import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminPlaceholder from "./index";

function setNavigatorLanguage(language: string) {
  vi.spyOn(window.navigator, "language", "get").mockReturnValue(language);
}

/**
 * UI / PAGE TEST
 *
 * Same render+assert pattern as src/pages/index.test.tsx. navigator.language
 * is the browser-language analogue of the legacy Swing admin client's
 * JVM-default locale (design SD-5) — stubbed per test via vi.spyOn.
 */
describe("Admin page", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the English catalogue by default", () => {
    setNavigatorLanguage("en-US");

    render(<AdminPlaceholder />);

    expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByText("Order approval is coming soon.")).toBeInTheDocument();
  });

  it("[AC-3] renders the German catalogue's labels, tooltip and mnemonic for a German browser language", () => {
    setNavigatorLanguage("de-DE");

    render(<AdminPlaceholder />);

    const heading = screen.getByRole("heading", { name: "Verwaltung" });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute("title", "Shopverwaltung");
    expect(heading).toHaveAttribute("accesskey", "v");
    expect(screen.getByText("Demnächst verfügbar")).toBeInTheDocument();
    expect(screen.getByText("Die Bestellfreigabe ist demnächst verfügbar.")).toBeInTheDocument();
  });
});
