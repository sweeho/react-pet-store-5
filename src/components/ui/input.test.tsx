import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Input } from "./input";

/**
 * UI / COMPONENT TEST
 *
 * Mirrors button.test.tsx's pattern: render into jsdom, query by role/label
 * the way a user or assistive tech would.
 */
describe("Input", () => {
  it("associates the visible label with the field", () => {
    render(<Input label="User name" />);

    const field = screen.getByLabelText("User name");
    expect(field).toBeInTheDocument();
    expect(field.tagName).toBe("INPUT");
  });

  it("shows helper text under the field", () => {
    render(<Input label="User name" helperText="Up to 25 characters" />);

    expect(screen.getByText("Up to 25 characters")).toBeInTheDocument();
  });

  it("shows an error message and marks the field invalid", () => {
    render(<Input label="Password" errorMessage="Password is empty." />);

    const field = screen.getByLabelText("Password");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Password is empty.")).toBeInTheDocument();
  });

  it("is not marked invalid when there is no error", () => {
    render(<Input label="Password" />);

    expect(screen.getByLabelText("Password")).not.toHaveAttribute("aria-invalid");
  });

  it("accepts typed input and reports it through onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input label="User name" onChange={onChange} />);

    await user.type(screen.getByLabelText("User name"), "alice");

    expect(onChange).toHaveBeenCalled();
  });

  it("uses distinct generated ids for two unlabeled instances so both fields stay queryable", () => {
    render(
      <>
        <Input label="User name" />
        <Input label="User name" />
      </>,
    );

    const fields = screen.getAllByLabelText("User name");
    expect(fields).toHaveLength(2);
    expect(fields[0].id).not.toBe(fields[1].id);
  });
});
