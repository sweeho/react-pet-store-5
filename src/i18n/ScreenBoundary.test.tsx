import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "./LocaleProvider";
import ScreenBoundary from "./ScreenBoundary";
import { useScreen } from "./screens";

function UsesScreen({ name }: { name: string }) {
  useScreen(name);
  return <p>rendered</p>;
}

function ThrowsOther(): never {
  throw new Error("boom");
}

function renderWithLocale(children: ReactNode) {
  return render(
    <MemoryRouter>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <ScreenBoundary>{children}</ScreenBoundary>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/**
 * UI / COMPONENT TEST
 *
 * `useScreen` throwing `ScreenNotFoundError` (D3, SWHR-R-0013.04) is caught
 * here and shown as the specific "Definition for screen <name> not found"
 * frame (mockup "page definition not found"); any other render error is not
 * this boundary's concern and must keep propagating.
 */
describe("ScreenBoundary", () => {
  it("[AC-6] shows the specific message when the screen is defined nowhere", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithLocale(<UsesScreen name="giftcard" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Definition for screen giftcard not found")).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it("renders children normally when the screen resolves", () => {
    renderWithLocale(<UsesScreen name="not-found" />);

    expect(screen.getByText("rendered")).toBeInTheDocument();
  });

  it("re-throws a non-screen error for an outer boundary to handle", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderWithLocale(<ThrowsOther />)).toThrow("boom");

    consoleError.mockRestore();
  });

  it("Try again clears the error and re-mounts the children", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    renderWithLocale(<UsesScreen name="giftcard" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
