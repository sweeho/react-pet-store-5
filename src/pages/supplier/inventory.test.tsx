import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import SupplierInventoryUpdatePage from "./inventory";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const ADMIN = { signedOn: true, userId: "supplier", isAdministrator: true };

function stubApi(inventory: () => Response | Promise<Response>, post?: () => Response) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.startsWith("/api/staff/session")) return Promise.resolve(jsonResponse(ADMIN));
    if (url === "/api/supplier/inventory" && init?.method === "POST") {
      return Promise.resolve(post ? post() : jsonResponse({ updated: [] }));
    }
    if (url === "/api/supplier/inventory") return Promise.resolve(inventory());
    return Promise.reject(new Error(`unexpected ${url}`));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/supplier/inventory"]}>
      <Routes>
        <Route path="/supplier/inventory" element={<SupplierInventoryUpdatePage />} />
        <Route path="/supplier/updated" element={<div>UPDATED PAGE</div>} />
        <Route path="/supplier/signin" element={<div>SUPPLIER SIGNIN PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const TWO_ITEMS = () =>
  jsonResponse({
    items: [
      { itemId: "EST-1", quantity: 10000 },
      { itemId: "EST-2", quantity: 7 },
    ],
  });

const NO_ITEMS = "There are no items in inventory.";

describe("SupplierInventoryUpdatePage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[SWHR-C-0407] lists EST-1 at 10000 and EST-2 at 7 with empty inputs and one Submit", async () => {
    stubApi(TWO_ITEMS);

    renderPage();

    expect(await screen.findByRole("columnheader", { name: "Item Id" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Existing Quantity" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "New Quantity" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Update" })).toBeInTheDocument();
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText("EST-1")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("10000")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("EST-2")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("7")).toBeInTheDocument();
    for (const row of rows) {
      expect(within(row).getByRole("textbox")).toHaveValue("");
      expect(within(row).getByRole("checkbox")).not.toBeChecked();
    }
    expect(screen.getAllByRole("button", { name: "Submit" })).toHaveLength(1);
  });

  it("[SWHR-C-0409] an empty inventory shows the no-items message without table or Submit", async () => {
    stubApi(() => jsonResponse({ items: [] }));

    renderPage();

    expect(await screen.findByText(NO_ITEMS)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
  });

  it("[SWHR-C-0410] a failed stock lookup shows the no-items message without table or Submit", async () => {
    stubApi(() => jsonResponse({ error: "INVENTORY_UNAVAILABLE" }, 500));

    renderPage();

    expect(await screen.findByText(NO_ITEMS)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
  });

  it("submit posts every row with its update flag and opens the confirmation on 200", async () => {
    const fetchMock = stubApi(TWO_ITEMS, () => jsonResponse({ updated: ["EST-1"] }));

    renderPage();
    const rows = (await screen.findAllByRole("row")).slice(1);
    await userEvent.type(within(rows[0]!).getByRole("textbox"), "50");
    await userEvent.click(within(rows[0]!).getByRole("checkbox"));
    await userEvent.type(within(rows[1]!).getByRole("textbox"), "60");
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText("UPDATED PAGE")).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(post?.[1]?.body as string)).toEqual({
      rows: [
        { itemId: "EST-1", update: true, quantity: "50" },
        { itemId: "EST-2", update: false, quantity: "60" },
      ],
    });
  });

  it.each([400, 500])("a %s answer shows an error and never the confirmation", async (status) => {
    stubApi(TWO_ITEMS, () => jsonResponse({ error: "INVALID_BATCH" }, status));

    renderPage();
    const rows = (await screen.findAllByRole("row")).slice(1);
    await userEvent.type(within(rows[0]!).getByRole("textbox"), "abc");
    await userEvent.click(within(rows[0]!).getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("UPDATED PAGE")).not.toBeInTheDocument();
  });

  it("redirects to the supplier sign-in when not signed on", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ signedOn: false, userId: null, isAdministrator: false })),
      ),
    );

    renderPage();

    expect(await screen.findByText("SUPPLIER SIGNIN PAGE")).toBeInTheDocument();
  });

  it("shows not-authorised for a non-administrator", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ signedOn: true, userId: "x", isAdministrator: false })),
      ),
    );

    renderPage();

    expect(await screen.findByText("Not authorised")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
  });
});
