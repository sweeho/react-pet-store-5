import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StateProvinceSelect } from "./StateProvinceSelect";

/**
 * UI / COMPONENT TEST
 *
 * Same pattern as src/components/ui/button.test.tsx: render into jsdom,
 * assert on what's visible/interactive, not on internals.
 */
describe("StateProvinceSelect", () => {
  it("[AC-1] renders the Japanese prefecture choices for ja_JP", () => {
    render(<StateProvinceSelect locale="ja_JP" name="state" />);

    expect(screen.getByRole("radio", { name: "東京" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "大阪" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "長野" })).toBeInTheDocument();
  });

  it("renders the English state choices for en_US", () => {
    render(<StateProvinceSelect locale="en_US" name="state" />);

    expect(screen.getByRole("radio", { name: "California" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "New York" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Texas" })).toBeInTheDocument();
  });

  it("marks the current value as checked and the rest as unchecked", () => {
    render(<StateProvinceSelect locale="ja_JP" name="state" value="osaka" />);

    expect(screen.getByRole("radio", { name: "大阪" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "東京" })).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange with the selected option's value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StateProvinceSelect locale="ja_JP" name="state" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "長野" }));

    expect(onChange).toHaveBeenCalledWith("nagano");
  });
});
