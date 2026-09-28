import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders with the fixed contract's role and test id, plus the description and action", () => {
    render(
      <EmptyState
        title="Nothing here yet"
        description="Add an item to get started."
        action={<button type="button">Add item</button>}
      />,
    );

    const frame = screen.getByTestId("empty-state");
    expect(frame).toHaveAttribute("role", "status");
    expect(screen.getByRole("heading", { name: "Nothing here yet" })).toBeInTheDocument();
    expect(screen.getByText("Add an item to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add item" })).toBeInTheDocument();
  });

  it("omits the description and action when they are not given", () => {
    render(<EmptyState title="Nothing here yet" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
