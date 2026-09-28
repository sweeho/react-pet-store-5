import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SignOnSessionProvider, useSignOnSession } from "./useSignOnSession";

function Probe() {
  const { signedOn, userId, refresh } = useSignOnSession();
  return (
    <>
      <span data-testid="signedOn">{String(signedOn)}</span>
      <span data-testid="userId">{userId ?? "null"}</span>
      <button type="button" onClick={() => void refresh()}>
        refresh
      </button>
    </>
  );
}

/**
 * UI / COMPONENT TEST
 *
 * The client-side sign-on session seam (design.md §Interface contracts):
 * loads GET /api/session once, and `refresh()` re-fetches on demand — the
 * seam a page calls after sign-on, registration or sign-out so the header
 * updates. `fetchSession` is injected so no test needs a real network round
 * trip (mirrors LocaleProvider's `fetchLocale`).
 */
describe("useSignOnSession", () => {
  it("starts anonymous, then adopts the loaded session", async () => {
    render(
      <SignOnSessionProvider
        fetchSession={() => Promise.resolve({ signedOn: true, userId: "alice" })}
      >
        <Probe />
      </SignOnSessionProvider>,
    );

    expect(screen.getByTestId("signedOn")).toHaveTextContent("false");

    await waitFor(() => expect(screen.getByTestId("signedOn")).toHaveTextContent("true"));
    expect(screen.getByTestId("userId")).toHaveTextContent("alice");
  });

  it("refresh() re-fetches and updates every consumer", async () => {
    const fetchSession = vi
      .fn()
      .mockResolvedValueOnce({ signedOn: false, userId: null })
      .mockResolvedValueOnce({ signedOn: true, userId: "bob" });
    const user = userEvent.setup();

    render(
      <SignOnSessionProvider fetchSession={fetchSession}>
        <Probe />
      </SignOnSessionProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("signedOn")).toHaveTextContent("false"));

    await user.click(screen.getByRole("button", { name: "refresh" }));

    await waitFor(() => expect(screen.getByTestId("signedOn")).toHaveTextContent("true"));
    expect(screen.getByTestId("userId")).toHaveTextContent("bob");
    expect(fetchSession).toHaveBeenCalledTimes(2);
  });

  it("keeps the last known session when refresh fails, rather than throwing", async () => {
    const fetchSession = vi
      .fn()
      .mockResolvedValueOnce({ signedOn: true, userId: "alice" })
      .mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();

    render(
      <SignOnSessionProvider fetchSession={fetchSession}>
        <Probe />
      </SignOnSessionProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("signedOn")).toHaveTextContent("true"));

    await user.click(screen.getByRole("button", { name: "refresh" }));

    await waitFor(() => expect(fetchSession).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId("signedOn")).toHaveTextContent("true");
    expect(screen.getByTestId("userId")).toHaveTextContent("alice");
  });

  it("useSignOnSession throws when used outside a SignOnSessionProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(
      "useSignOnSession must be used within a SignOnSessionProvider",
    );

    consoleError.mockRestore();
  });
});
