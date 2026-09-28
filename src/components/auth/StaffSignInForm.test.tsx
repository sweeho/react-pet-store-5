import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StaffSignInForm } from "./StaffSignInForm";

const STRINGS = {
  heading: "Administration sign-in",
  hint: "Sign in with your administrator user ID and password to manage orders and view sales.",
  staffOnlyLabel: "Staff only",
  userIdLabel: "User ID",
  userIdPlaceholder: "Enter your user ID",
  passwordLabel: "Password",
  passwordPlaceholder: "Enter your password",
  submitLabel: "Sign in",
  emptyFieldTemplate: "{field} is empty.",
};

/**
 * UI / COMPONENT TEST
 *
 * Shared by admin and supplier sign-in (design.md P12/P13): never
 * pre-filled, blocks submission with one message per empty field, and
 * calls back with the trimmed-free values once both fields are filled.
 */
describe("StaffSignInForm", () => {
  it("renders with both fields empty — never pre-filled", () => {
    render(<StaffSignInForm strings={STRINGS} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("User ID")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("blocks submission and shows one message per empty field, without calling onSubmit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<StaffSignInForm strings={STRINGS} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("User ID"), "admin");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Password is empty.");
    expect(screen.queryByText("User ID is empty.")).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the entered user id and password", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<StaffSignInForm strings={STRINGS} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("User ID"), "admin");
    await user.type(screen.getByLabelText("Password"), "Secret1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(onSubmit).toHaveBeenCalledWith("admin", "Secret1");
  });

  it("uses the given strings as the accessible form name and field placeholders", () => {
    render(<StaffSignInForm strings={STRINGS} onSubmit={vi.fn()} />);

    expect(screen.getByRole("form", { name: "Administration sign-in" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your user ID")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
  });
});
