import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoadingState from "./LoadingState";

describe("LoadingState", () => {
  it("renders with the fixed contract's role, aria-busy and test id", () => {
    render(<LoadingState label="Loading pets…" />);

    const frame = screen.getByTestId("loading-state");
    expect(frame).toHaveAttribute("role", "status");
    expect(frame).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading pets…")).toBeInTheDocument();
  });
});
