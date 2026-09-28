import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import SupplierSignedOutPage from "./signed-out";

/** UI / PAGE TEST — SWHR-R-0083: a page linking back into the supplier application. */
describe("SupplierSignedOutPage", () => {
  /** SWHR-R-0083.01 (server half in routes/api/staff/signoff.test.ts; SWHR-T-0048 owns the full flow). */
  it("shows the signed-out message with a link back to supplier sign-in", () => {
    render(
      <MemoryRouter>
        <SupplierSignedOutPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "You are signed out" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to supplier sign-in" })).toHaveAttribute(
      "href",
      "/supplier/signin",
    );
  });
});
