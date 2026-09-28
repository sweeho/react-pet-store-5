import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import ErrorState from "./ErrorState";

describe("ErrorState", () => {
  it("renders with the fixed contract's role and test id, and a Back to Home link to '/'", () => {
    render(
      <MemoryRouter>
        <ErrorState title="We couldn't load this page" />
      </MemoryRouter>,
    );

    const frame = screen.getByTestId("error-state");
    expect(frame).toHaveAttribute("role", "alert");
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
  });

  it("renders primaryAction as a link and lets the secondary label be overridden", () => {
    render(
      <MemoryRouter>
        <ErrorState
          title="Sign-in Error"
          primaryAction={{ label: "Try again", to: "/signin" }}
          secondaryLabel="Keep browsing"
        />
      </MemoryRouter>,
    );

    const tryAgain = screen.getByRole("link", { name: "Try again" });
    expect(tryAgain).toHaveAttribute("href", "/signin");
    expect(screen.getByRole("link", { name: "Keep browsing" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("prefers primaryAction over onRetry when both are given", () => {
    render(
      <MemoryRouter>
        <ErrorState primaryAction={{ label: "Choose another user name", to: "/signin" }} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Choose another user name" })).toBeInTheDocument();
  });

  it("shows Try again only when onRetry is given, and calls it on click", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <ErrorState />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ErrorState onRetry={onRetry} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
