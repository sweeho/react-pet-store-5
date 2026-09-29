import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import type { CategoryView } from "../../lib/catalog/queries";
import { useCatalogCategories } from "./useCatalogCategories";

function Probe({
  fetchCategories,
}: {
  fetchCategories: (locale: string) => Promise<CategoryView[]>;
}) {
  const state = useCatalogCategories(fetchCategories);
  return (
    <span data-testid="state">
      {state.status}:{state.categories.map((c) => c.categoryId).join(",")}
    </span>
  );
}

function renderProbe(
  initialPath: string,
  fetchCategories: (locale: string) => Promise<CategoryView[]>,
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <Probe fetchCategories={fetchCategories} />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

const DOGS: CategoryView = {
  categoryId: "DOGS",
  name: "Dogs",
  description: null,
  image: null,
  locale: "en_US",
};

/**
 * UI / HOOK TEST
 *
 * Fetches GET /api/catalog/categories for the session locale (design.md
 * P5), mirroring useSignOnSession's injectable-fetch-then-Probe pattern so
 * no test needs a real network round trip.
 */
describe("useCatalogCategories", () => {
  it("starts loading, then reports the fetched categories", async () => {
    const fetchCategories = vi.fn().mockResolvedValue([DOGS]);
    renderProbe("/", fetchCategories);

    expect(screen.getByTestId("state")).toHaveTextContent("loading:");

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("success:DOGS"));
    expect(fetchCategories).toHaveBeenCalledWith("en_US");
  });

  it("fetches for the locale requested via ?locale=", async () => {
    const fetchCategories = vi.fn().mockResolvedValue([DOGS]);
    renderProbe("/?locale=ja_JP", fetchCategories);

    await waitFor(() => expect(fetchCategories).toHaveBeenCalledWith("ja_JP"));
  });

  it("reports an error state when the fetch fails, without throwing", async () => {
    const fetchCategories = vi.fn().mockRejectedValue(new Error("offline"));
    renderProbe("/", fetchCategories);

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error:"));
  });
});
