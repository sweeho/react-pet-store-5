import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import RootErrorBoundary from "./RootErrorBoundary";

function Thrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("boom");
  }
  return <p>Recovered content</p>;
}

describe("RootErrorBoundary", () => {
  it("catches a render error and shows the shared error frame with Try again", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <RootErrorBoundary>
          <Thrower shouldThrow />
        </RootErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it("Try again re-mounts the children instead of re-rendering the failed instance", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    let shouldThrow = true;
    function ToggleThrower() {
      return <Thrower shouldThrow={shouldThrow} />;
    }

    render(
      <MemoryRouter>
        <RootErrorBoundary>
          <ToggleThrower />
        </RootErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();

    shouldThrow = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Recovered content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    consoleError.mockRestore();
  });
});
