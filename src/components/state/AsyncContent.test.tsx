import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import AsyncContent from "./AsyncContent";

function renderList(load: () => Promise<string[]>) {
  return render(
    <MemoryRouter>
      <AsyncContent
        load={load}
        isEmpty={(items: string[]) => items.length === 0}
        empty={<p>No items yet.</p>}
      >
        {(items: string[]) => (
          <ul>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </AsyncContent>
    </MemoryRouter>,
  );
}

describe("AsyncContent", () => {
  it("[SWHR-C-0009] shows the empty frame and no data rows when load resolves with no items", async () => {
    const load = vi.fn().mockResolvedValue([]);

    renderList(load);

    await waitFor(() => expect(screen.getByText("No items yet.")).toBeInTheDocument());
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("[SWHR-C-0010] shows the error frame with a visible Try again button when load rejects", async () => {
    const load = vi.fn().mockRejectedValue(new Error("network error"));

    renderList(load);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(screen.queryByText("No items yet.")).not.toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("[SWHR-C-0011] retrying after a rejection calls load again, clears the error frame and renders the items", async () => {
    const user = userEvent.setup();
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(["Bulldog", "Poodle"]);

    renderList(load);

    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(screen.getByText("Bulldog")).toBeInTheDocument());
    expect(screen.getByText("Poodle")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
