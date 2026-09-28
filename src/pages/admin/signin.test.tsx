import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminSignInPage from "./signin";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderSignIn() {
  return render(
    <MemoryRouter initialEntries={["/admin/signin"]}>
      <Routes>
        <Route path="/admin/signin" element={<AdminSignInPage />} />
        <Route path="/admin/console" element={<div>CONSOLE PAGE</div>} />
        <Route path="/admin/login-error" element={<div>LOGIN ERROR PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * mockup-administrator-sign-in.html's heading/hint/labels, and the
 * POST /api/staff/signon { realm: "admin" } round trip via StaffSignInForm.
 */
describe("AdminSignInPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the mockup's heading, hint and field labels", () => {
    render(
      <MemoryRouter>
        <AdminSignInPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Administration sign-in" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sign in with your administrator user ID and password to manage orders and view sales.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("User ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("posts realm admin and navigates to the returned redirect on success", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ redirect: "/admin/console" })));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderSignIn();
    await user.type(screen.getByLabelText("User ID"), "jps_admin");
    await user.type(screen.getByLabelText("Password"), "Secret1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("CONSOLE PAGE")).toBeInTheDocument();
    // vi.fn()'s inferred call-args type mirrors its zero-arg implementation, not fetch's real
    // signature — the mock is only ever invoked through the page's real `fetch(url, init)` call.
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/staff/signon");
    expect(JSON.parse(init.body as string)).toEqual({
      realm: "admin",
      userId: "jps_admin",
      password: "Secret1",
    });
  });

  it("navigates to the login-error redirect on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ redirect: "/admin/login-error" }, 401))),
    );
    const user = userEvent.setup();

    renderSignIn();
    await user.type(screen.getByLabelText("User ID"), "jps_admin");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("LOGIN ERROR PAGE")).toBeInTheDocument();
  });
});
