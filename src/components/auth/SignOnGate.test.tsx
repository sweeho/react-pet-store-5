import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { SignOnGate } from "./SignOnGate";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

/**
 * UI / COMPONENT TEST
 *
 * The client-side half of the gate (design.md P6): an unprotected path
 * renders immediately with no gate call, a protected path renders nothing
 * until the gate answers, and a refused path is redirected rather than
 * shown. `fetchProtectionConfig`/`checkGate` are injected so no test needs
 * a real network round trip (mirrors LocaleProvider.test.tsx).
 */
describe("SignOnGate", () => {
  it("renders an unprotected path immediately and never calls the gate", async () => {
    const checkGate = vi.fn();

    render(
      <MemoryRouter initialEntries={["/cart"]}>
        <SignOnGate
          fetchProtectionConfig={() =>
            Promise.resolve({ signOnPage: "/signin", protectedPaths: ["/account"] })
          }
          checkGate={checkGate}
        >
          <div data-testid="content">content</div>
        </SignOnGate>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId("content")).toBeInTheDocument());
    expect(checkGate).not.toHaveBeenCalled();
  });

  it("renders nothing for a protected path until the gate allows it", async () => {
    let resolveGate!: (result: { allowed: true }) => void;
    const checkGate = vi.fn(
      () =>
        new Promise<{ allowed: true }>((resolve) => {
          resolveGate = resolve;
        }),
    );

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <SignOnGate
          fetchProtectionConfig={() =>
            Promise.resolve({ signOnPage: "/signin", protectedPaths: ["/account"] })
          }
          checkGate={checkGate}
        >
          <div data-testid="content">content</div>
        </SignOnGate>
      </MemoryRouter>,
    );

    await waitFor(() => expect(checkGate).toHaveBeenCalledWith("/account"));
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();

    resolveGate({ allowed: true });
    await waitFor(() => expect(screen.getByTestId("content")).toBeInTheDocument());
  });

  it("[SWHR-R-0065] redirects to the returned target when the gate refuses a protected path", async () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <LocationProbe />
        <SignOnGate
          fetchProtectionConfig={() =>
            Promise.resolve({ signOnPage: "/signin", protectedPaths: ["/account"] })
          }
          checkGate={() => Promise.resolve({ allowed: false, redirect: "/signin" })}
        >
          <div data-testid="content">content</div>
        </SignOnGate>
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/signin"));
  });
});
