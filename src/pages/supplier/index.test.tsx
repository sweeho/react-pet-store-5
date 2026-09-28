import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import SupplierInventoryPage from "./index";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderInventory() {
  return render(
    <MemoryRouter initialEntries={["/supplier"]}>
      <Routes>
        <Route path="/supplier" element={<SupplierInventoryPage />} />
        <Route path="/supplier/signin" element={<div>SUPPLIER SIGNIN PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * SWHR-R-0082: form-based sign-in required, administrator role required
 * for the inventory page itself.
 */
describe("SupplierInventoryPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects to the supplier sign-in form when not signed on", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ signedOn: false, userId: null, isAdministrator: false })),
      ),
    );

    renderInventory();

    expect(await screen.findByText("SUPPLIER SIGNIN PAGE")).toBeInTheDocument();
  });

  /** SWHR-R-0082.01 */
  it("[SWHR-C-0146] shows a not-authorised message and no update form for a non-administrator", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({ signedOn: true, userId: "someone", isAdministrator: false }),
        ),
      ),
    );

    renderInventory();

    expect(await screen.findByText("You are not authorised to update orders.")).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the inventory placeholder for a signed-on administrator", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({ signedOn: true, userId: "supplier", isAdministrator: true }),
        ),
      ),
    );

    renderInventory();

    expect(await screen.findByRole("heading", { name: "Supplier inventory" })).toBeInTheDocument();
  });
});
