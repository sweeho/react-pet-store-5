import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import MyListPanel from "./MyListPanel";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function account(profile: { favoriteCategory: string | null; myListPreference: boolean }) {
  return { userId: "j2ee", status: "active", profile: { bannerPreference: true, ...profile } };
}

const FISH_PRODUCTS = Array.from({ length: 12 }, (_, i) => ({
  productId: `FI-${i + 1}`,
  categoryId: "FISH",
  name: `Fish ${i + 1}`,
  description: null,
  image: null,
  locale: "en_US",
}));

function stubFetch(accountResponse: Response) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/account")) return Promise.resolve(accountResponse.clone());
    if (url.startsWith("/api/catalog/categories/FISH")) {
      const count = Number(new URL(url, "http://localhost").searchParams.get("count"));
      return Promise.resolve(
        jsonResponse({
          category: { categoryId: "FISH", name: "Fish" },
          items: FISH_PRODUCTS.slice(0, count),
          paging: { start: 0, count, total: 12 },
        }),
      );
    }
    return Promise.resolve(jsonResponse({}, 404));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <MyListPanel />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe("MyListPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[SWHR-C-0226] lists the first 10 of 12 Fish products, each linking to its product page", async () => {
    const fetchMock = stubFetch(
      jsonResponse(account({ favoriteCategory: "FISH", myListPreference: true })),
    );
    renderPanel();

    const panel = await screen.findByRole("navigation", { name: /My List/ });
    const links = await waitFor(() => {
      const found = within(panel).getAllByRole("link");
      expect(found).toHaveLength(10);
      return found;
    });
    expect(links[0]).toHaveAttribute("href", "/product/FI-1");
    expect(links[9]).toHaveAttribute("href", "/product/FI-10");
    expect(links[9]).toHaveTextContent("Fish 10");
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("start=0&count=10"))).toBe(
      true,
    );
  });

  it("[SWHR-C-0227] shows no panel when My List is off", async () => {
    const fetchMock = stubFetch(
      jsonResponse(account({ favoriteCategory: "FISH", myListPreference: false })),
    );
    renderPanel();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByRole("navigation", { name: /My List/ })).not.toBeInTheDocument();
  });

  it("shows no panel to an anonymous visitor", async () => {
    const fetchMock = stubFetch(jsonResponse({}, 401));
    renderPanel();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByRole("navigation", { name: /My List/ })).not.toBeInTheDocument();
  });
});
