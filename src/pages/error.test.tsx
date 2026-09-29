import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import ErrorPage from "./error";

describe("ErrorPage", () => {
  it("shows the general error page with Try again and Go to home page", () => {
    render(
      <MemoryRouter>
        <LocaleProvider
          fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
        >
          <ErrorPage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/checkout");
    expect(screen.getByRole("link", { name: "Go to home page" })).toHaveAttribute("href", "/");
  });
});
