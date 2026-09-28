import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminConsolePage from "./console";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderConsole() {
  return render(
    <MemoryRouter initialEntries={["/admin/console"]}>
      <Routes>
        <Route path="/admin/console" element={<AdminConsolePage />} />
        <Route path="/admin/signin" element={<div>SIGNIN PAGE</div>} />
        <Route path="/admin" element={<div>ADMIN LANDING</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * Server halves (GET /api/staff/session, POST /api/staff/signoff,
 * GET /api/admin/launch) are stubbed the same way CartPage's test stubs
 * global.fetch. The full browser flow (sign in then see the console) is
 * e2e SWHR-C-0140 (SWHR-T-0048).
 */
describe("AdminConsolePage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** SWHR-R-0075.01 */
  it("[SWHR-C-0138] redirects to the administrator sign-in form for an unauthenticated request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ signedOn: false, userId: null, isAdministrator: false })),
      ),
    );

    renderConsole();

    expect(await screen.findByText("SIGNIN PAGE")).toBeInTheDocument();
  });

  /** SWHR-R-0075.02 */
  it("[SWHR-C-0139] refuses access for an authenticated non-administrator", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ signedOn: true, userId: "carol", isAdministrator: false })),
      ),
    );

    renderConsole();

    expect(await screen.findByText("Access refused")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Administration console" }),
    ).not.toBeInTheDocument();
  });

  it("shows the console with Manage orders and Sign out for a signed-on administrator", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({ signedOn: true, userId: "jps_admin", isAdministrator: true }),
        ),
      ),
    );

    renderConsole();

    expect(
      await screen.findByRole("heading", { name: "Administration console" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manage orders" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  /** SWHR-R-0078.01 */
  it("ends the session and shows the administration landing page on sign out", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/staff/session")) {
        return Promise.resolve(
          jsonResponse({ signedOn: true, userId: "jps_admin", isAdministrator: true }),
        );
      }
      if (url.includes("/api/staff/signoff")) {
        return Promise.resolve(jsonResponse({ redirect: "/admin" }));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderConsole();
    await screen.findByRole("heading", { name: "Administration console" });
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("ADMIN LANDING")).toBeInTheDocument();
  });

  /** Server half of SWHR-C-0145 (routes/api/admin/launch.test.ts covers the descriptor itself). */
  it("reports the launched session id after Manage orders", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/staff/session")) {
        return Promise.resolve(
          jsonResponse({ signedOn: true, userId: "jps_admin", isAdministrator: true }),
        );
      }
      if (url.includes("/api/admin/launch")) {
        return Promise.resolve(
          jsonResponse({
            host: "localhost",
            port: 5000,
            sessionId: "sess-1",
            ordersUrl: "/api/admin/orders",
          }),
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderConsole();
    await screen.findByRole("heading", { name: "Administration console" });
    await user.click(screen.getByRole("button", { name: "Manage orders" }));

    await waitFor(() =>
      expect(screen.getByText(/Order client launched for session sess-1\./)).toBeInTheDocument(),
    );
  });
});
