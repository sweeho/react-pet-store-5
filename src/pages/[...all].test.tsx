import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import CatchAll from "./[...all]";

describe("Catch-all route", () => {
  it("renders the shared error frame with 'Page not found' copy, Back to Home, and no retry", () => {
    render(
      <MemoryRouter>
        <LocaleProvider
          fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
        >
          <CatchAll />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
