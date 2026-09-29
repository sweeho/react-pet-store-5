import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import SupplierUpdatedPage from "./updated";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function renderPage(session: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(jsonResponse(session))),
  );
  return render(
    <MemoryRouter initialEntries={["/supplier/updated"]}>
      <Routes>
        <Route path="/supplier/updated" element={<SupplierUpdatedPage />} />
        <Route path="/supplier/signin" element={<div>SUPPLIER SIGNIN PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SupplierUpdatedPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[SWHR-C-0411] states the inventory was updated successfully with Display Inventory and Logout", async () => {
    renderPage({ signedOn: true, userId: "supplier", isAdministrator: true });

    expect(await screen.findByText(/updated successfully/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Display Inventory" })).toHaveAttribute(
      "href",
      "/supplier/inventory",
    );
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("redirects to the supplier sign-in when not signed on", async () => {
    renderPage({ signedOn: false, userId: null, isAdministrator: false });

    expect(await screen.findByText("SUPPLIER SIGNIN PAGE")).toBeInTheDocument();
  });
});
