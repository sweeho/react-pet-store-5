import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminOrdersPage from "./orders";

interface Row {
  orderId: string;
  userId: string;
  date: string;
  amount: string;
  status: string;
}

function row(orderId: string, status: string, amount = "100.00", date = "2/3/2002"): Row {
  return { orderId, userId: `user${orderId}`, date, amount, status };
}

const THREE_PENDING = [
  row("1001", "PENDING", "612.50"),
  row("1002", "PENDING", "900.00"),
  row("1003", "PENDING", "650.00"),
];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

interface Data {
  PENDING?: Row[];
  APPROVED?: Row[];
  DENIED?: Row[];
  COMPLETED?: Row[];
}

interface Call {
  type: string;
  body: Record<string, unknown>;
}

/** Stubs fetch; `handler` may override the reply to an order-data request. */
function stubServer(
  data: Data,
  handler?: (call: Call) => Response | Promise<Response> | undefined,
) {
  const calls: Call[] = [];
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/staff/session")) {
      return Promise.resolve(json({ signedOn: true, userId: "j2ee", isAdministrator: true }));
    }
    if (url.includes("/api/staff/signoff")) {
      return Promise.resolve(json({ redirect: "/admin" }));
    }
    if (url.includes("/api/admin/order-data")) {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      const call: Call = { type: String(body.type), body };
      calls.push(call);
      const custom = handler?.(call);
      if (custom) {
        return Promise.resolve(custom);
      }
      if (call.type === "GETORDERS") {
        const rows = data[body.status as keyof Data] ?? [];
        return Promise.resolve(json({ orders: rows, total: rows.length }));
      }
      if (call.type === "UPDATESTATUS") {
        return Promise.resolve(json({ result: "SUCCESS", queued: 1 }));
      }
      return Promise.resolve(json({ groups: [{ name: "Fish", value: "60.00" }], total: "60.00" }));
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/orders"]}>
      <Routes>
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/console" element={<div>CONSOLE PAGE</div>} />
        <Route path="/admin/signin" element={<div>SIGNIN PAGE</div>} />
        <Route path="/admin" element={<div>ADMIN LANDING</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function dataRows(): HTMLElement[] {
  return screen
    .queryAllByRole("row")
    .filter((r) => within(r).queryAllByRole("columnheader").length === 0);
}

function statusCalls(calls: Call[], status: string): Call[] {
  return calls.filter((c) => c.type === "GETORDERS" && c.body.status === status);
}

async function loaded(rowCount: number) {
  await waitFor(() => expect(dataRows()).toHaveLength(rowCount));
}

function badge(orderId: string): HTMLElement {
  return within(screen.getByRole("row", { name: new RegExp(orderId) })).getByTestId("status-badge");
}

async function mark(user: ReturnType<typeof userEvent.setup>, orderId: string, status: string) {
  await user.selectOptions(screen.getByLabelText(`Status of order ${orderId}`), status);
}

describe("AdminOrdersPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[SWHR-C-0297] loads all four statuses and the sales data on start", async () => {
    const calls = stubServer({
      PENDING: [row("1001", "PENDING")],
      APPROVED: [row("2001", "APPROVED")],
      DENIED: [row("2002", "DENIED")],
      COMPLETED: [row("2003", "COMPLETED")],
    });
    renderPage();
    await loaded(1);

    for (const status of ["PENDING", "APPROVED", "DENIED", "COMPLETED"]) {
      expect(statusCalls(calls, status)).toHaveLength(1);
    }
    expect(calls.filter((c) => c.type === "REVENUE")).toHaveLength(1);
    expect(calls.filter((c) => c.type === "ORDERS")).toHaveLength(1);
    expect(calls.find((c) => c.type === "REVENUE")?.body).toMatchObject({
      start: "01/01/2001",
      end: "12/31/2002",
    });
  });

  it("[SWHR-C-0326] offers the three views and enabled Refresh, About and Exit", async () => {
    stubServer({ PENDING: [row("1001", "PENDING")] });
    renderPage();
    await loaded(1);

    expect(screen.getByRole("tab", { name: /Process Pending Orders/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /View Non-Pending Orders/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sales" })).toBeInTheDocument();
    for (const name of ["Refresh", "About", "Exit"]) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
  });

  it("[SWHR-C-0328] lists only the two pending orders with a yellow PENDING status", async () => {
    stubServer({
      PENDING: [row("1001", "PENDING"), row("1002", "PENDING")],
      APPROVED: [row("2001", "APPROVED")],
    });
    renderPage();
    await loaded(2);

    const first = screen.getByRole("row", { name: /1001/ });
    expect(within(first).getByText("user1001")).toBeInTheDocument();
    expect(within(first).getByText("2/3/2002")).toBeInTheDocument();
    expect(within(first).getByText("100.00")).toBeInTheDocument();
    expect(badge("1001")).toHaveTextContent("PENDING");
    expect(badge("1001").className).toContain("bg-yellow-100");
    expect(screen.queryByText("user2001")).not.toBeInTheDocument();
  });

  it("[SWHR-C-0329] sorts the rows by amount when the Amount heading is clicked", async () => {
    stubServer({
      PENDING: [row("1001", "PENDING", "900.00"), row("1002", "PENDING", "650.00")],
    });
    const user = userEvent.setup();
    renderPage();
    await loaded(2);

    const amounts = () => screen.getAllByTestId("amount-cell").map((c) => c.textContent);
    expect(amounts()).toEqual(["900.00", "650.00"]);
    await user.click(screen.getByRole("button", { name: /Amount/ }));
    expect(amounts()).toEqual(["650.00", "900.00"]);
    await user.click(screen.getByRole("button", { name: /Amount/ }));
    expect(amounts()).toEqual(["900.00", "650.00"]);
  });

  it("[SWHR-C-0330] shows no rows when nothing is pending", async () => {
    const calls = stubServer({ APPROVED: [row("2001", "APPROVED")] });
    renderPage();
    await waitFor(() => expect(statusCalls(calls, "COMPLETED")).toHaveLength(1));
    await screen.findByRole("tab", { name: /Process Pending Orders/ });
    expect(dataRows()).toHaveLength(0);
    expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
  });

  it("[SWHR-C-0331] marks three selected rows APPROVED in green without submitting", async () => {
    const calls = stubServer({ PENDING: THREE_PENDING });
    const user = userEvent.setup();
    renderPage();
    await loaded(3);

    await user.click(screen.getByRole("checkbox", { name: "Select all orders" }));
    await user.click(screen.getByRole("button", { name: "Approve" }));

    for (const id of ["1001", "1002", "1003"]) {
      expect(badge(id)).toHaveTextContent("APPROVED");
      expect(badge(id).className).toContain("bg-green-100");
    }
    expect(calls.filter((c) => c.type === "UPDATESTATUS")).toHaveLength(0);
  });

  it("[SWHR-C-0332] shows a row edited to DENIED in red", async () => {
    stubServer({ PENDING: [row("1001", "PENDING")] });
    const user = userEvent.setup();
    renderPage();
    await loaded(1);

    await mark(user, "1001", "DENIED");

    expect(badge("1001")).toHaveTextContent("DENIED");
    expect(badge("1001").className).toContain("bg-red-100");
  });

  it("[SWHR-C-0333] does not let the amount of a pending row be edited", async () => {
    stubServer({ PENDING: [row("1001", "PENDING", "612.50")] });
    const user = userEvent.setup();
    renderPage();
    await loaded(1);

    const cell = screen.getByTestId("amount-cell");
    await user.dblClick(cell);
    expect(cell.querySelector("input, select, button, textarea")).toBeNull();
    expect(cell).toHaveTextContent("612.50");
  });

  it("[SWHR-C-0334] submits the approved row and reloads the view on Commit", async () => {
    const calls = stubServer({ PENDING: [row("1001", "PENDING")] });
    const user = userEvent.setup();
    renderPage();
    await loaded(1);

    await mark(user, "1001", "APPROVED");
    await user.click(screen.getByRole("button", { name: /Commit/ }));

    await waitFor(() => expect(statusCalls(calls, "PENDING")).toHaveLength(2));
    const updates = calls.filter((c) => c.type === "UPDATESTATUS");
    expect(updates).toHaveLength(1);
    expect(updates[0].body.orders).toEqual([{ orderId: "1001", status: "APPROVED" }]);
  });

  it("[SWHR-C-0298] submits an approval batch and a denial batch, then reloads", async () => {
    const calls = stubServer({ PENDING: THREE_PENDING });
    const user = userEvent.setup();
    renderPage();
    await loaded(3);

    await mark(user, "1001", "APPROVED");
    await mark(user, "1002", "APPROVED");
    await mark(user, "1003", "DENIED");
    await user.click(screen.getByRole("button", { name: /Commit/ }));

    await waitFor(() => expect(statusCalls(calls, "PENDING")).toHaveLength(2));
    const updates = calls.filter((c) => c.type === "UPDATESTATUS");
    expect(updates.map((u) => u.body.orders)).toEqual([
      [
        { orderId: "1001", status: "APPROVED" },
        { orderId: "1002", status: "APPROVED" },
      ],
      [{ orderId: "1003", status: "DENIED" }],
    ]);
  });

  it("[SWHR-C-0299] submits nothing when Commit is used with no changes", async () => {
    const calls = stubServer({ PENDING: THREE_PENDING });
    const user = userEvent.setup();
    renderPage();
    await loaded(3);

    await user.click(screen.getByRole("button", { name: /Commit/ }));

    expect(calls.filter((c) => c.type === "UPDATESTATUS")).toHaveLength(0);
    expect(statusCalls(calls, "PENDING")).toHaveLength(1);
  });

  it("[SWHR-C-0309] keeps 1001 marked DENIED and reloads nothing when the refresh warning is cancelled", async () => {
    const calls = stubServer({ PENDING: [row("1001", "PENDING")] });
    const user = userEvent.setup();
    renderPage();
    await loaded(1);

    await mark(user, "1001", "DENIED");
    await user.click(screen.getByRole("button", { name: "Refresh" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Data is not committed. Are you sure you want to refresh?");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(statusCalls(calls, "PENDING")).toHaveLength(1);
    expect(badge("1001")).toHaveTextContent("DENIED");
  });

  it("[SWHR-C-0310] reloads and shows 1001 as PENDING when the refresh warning is confirmed", async () => {
    const calls = stubServer({ PENDING: [row("1001", "PENDING")] });
    const user = userEvent.setup();
    renderPage();
    await loaded(1);

    await mark(user, "1001", "DENIED");
    await user.click(screen.getByRole("button", { name: "Refresh" }));
    await user.click(await screen.findByRole("button", { name: "Discard and refresh" }));

    await waitFor(() => expect(statusCalls(calls, "PENDING")).toHaveLength(2));
    await waitFor(() => expect(badge("1001")).toHaveTextContent("PENDING"));
  });

  it("[SWHR-C-0311] shows the busy message and disables the controls while a commit is pending", async () => {
    let release: (() => void) | undefined;
    stubServer({ PENDING: [row("1001", "PENDING")] }, (call) => {
      if (call.type !== "UPDATESTATUS") {
        return undefined;
      }
      return new Promise<Response>((resolve) => {
        release = () => resolve(json({ result: "SUCCESS", queued: 1 }));
      }) as unknown as Response;
    });
    const user = userEvent.setup();
    renderPage();
    await loaded(1);

    await mark(user, "1001", "APPROVED");
    await user.click(screen.getByRole("button", { name: /Commit/ }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Updating data on the server..."),
    );
    for (const name of ["Approve", "Deny", /Commit/, "Refresh"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }

    release?.();
    await waitFor(() => expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled());
    for (const name of ["Approve", "Deny", /Commit/]) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
  });

  it("[SWHR-C-0312] shows Fatal Error and ends the session when the data service is unavailable", async () => {
    let failing = false;
    stubServer({ PENDING: [row("1001", "PENDING")] }, () => {
      if (!failing) {
        return undefined;
      }
      return json({ error: "Could not find PENDING orders" }, 500);
    });
    const user = userEvent.setup();
    renderPage();
    await loaded(1);

    failing = true;
    await user.click(screen.getByRole("button", { name: "Refresh" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Fatal Error!");
    expect(dialog).toHaveTextContent("Could not find PENDING orders");
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();

    await user.click(within(dialog).getByRole("button", { name: "Sign out" }));
    expect(await screen.findByText("ADMIN LANDING")).toBeInTheDocument();
  });

  it("[SWHR-C-0335] lists approved, denied and completed orders but not pending ones", async () => {
    stubServer({
      PENDING: [row("1001", "PENDING")],
      APPROVED: [row("2001", "APPROVED")],
      DENIED: [row("2002", "DENIED")],
      COMPLETED: [row("2003", "COMPLETED")],
    });
    const user = userEvent.setup();
    renderPage();
    await loaded(1);

    await user.click(screen.getByRole("tab", { name: /View Non-Pending Orders/ }));

    await loaded(3);
    expect(screen.getByRole("row", { name: /2001/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /2002/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /2003/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /1001/ })).not.toBeInTheDocument();
  });

  it("[SWHR-C-0336] renders no editing controls for an APPROVED order in the non-pending view", async () => {
    stubServer({ APPROVED: [row("2001", "APPROVED")] });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: /View Non-Pending Orders/ }));
    await loaded(1);

    const table = screen.getByRole("table");
    expect(within(table).queryAllByRole("combobox")).toHaveLength(0);
    expect(within(table).queryAllByRole("checkbox")).toHaveLength(0);
    expect(badge("2001")).toHaveTextContent("APPROVED");
  });

  it("[SWHR-C-0339] shows the date without padding and the amount as sent", async () => {
    stubServer({ PENDING: [row("1001", "PENDING", "612.50", "2/3/2002")] });
    renderPage();
    await loaded(1);

    expect(screen.getByTestId("date-cell")).toHaveTextContent("2/3/2002");
    expect(screen.getByTestId("amount-cell")).toHaveTextContent("612.50");
  });
});
