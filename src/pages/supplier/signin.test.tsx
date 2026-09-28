import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import SupplierSignInPage from "./signin";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderSignIn() {
  return render(
    <MemoryRouter initialEntries={["/supplier/signin"]}>
      <Routes>
        <Route path="/supplier/signin" element={<SupplierSignInPage />} />
        <Route path="/supplier" element={<div>INVENTORY PAGE</div>} />
        <Route path="/supplier/login-error" element={<div>LOGIN ERROR PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * mockup-supplier-sign-in.html's heading/hint/labels (English literals,
 * SD-5), and the POST /api/staff/signon { realm: "supplier" } round trip.
 */
describe("SupplierSignInPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the mockup's heading, hint and field labels", () => {
    render(
      <MemoryRouter>
        <SupplierSignInPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Supplier sign-in" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sign in with your supplier user ID and password to view and update inventory.",
      ),
    ).toBeInTheDocument();
  });

  it("posts realm supplier and navigates to the returned redirect on success", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ redirect: "/supplier" })));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderSignIn();
    await user.type(screen.getByLabelText("User ID"), "supplier");
    await user.type(screen.getByLabelText("Password"), "Secret1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("INVENTORY PAGE")).toBeInTheDocument();
    // vi.fn()'s inferred call-args type mirrors its zero-arg implementation, not fetch's real
    // signature — the mock is only ever invoked through the page's real `fetch(url, init)` call.
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/staff/signon");
    expect(JSON.parse(init.body as string)).toEqual({
      realm: "supplier",
      userId: "supplier",
      password: "Secret1",
    });
  });

  it("navigates to the login-error redirect on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ redirect: "/supplier/login-error" }, 401))),
    );
    const user = userEvent.setup();

    renderSignIn();
    await user.type(screen.getByLabelText("User ID"), "supplier");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("LOGIN ERROR PAGE")).toBeInTheDocument();
  });
});
