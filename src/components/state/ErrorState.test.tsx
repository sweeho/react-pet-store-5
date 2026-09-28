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
