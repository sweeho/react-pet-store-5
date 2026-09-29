import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import CheckoutPage from "./checkout";

const ACCOUNT = {
  userId: "jane",
  status: "OK",
  contactInfo: {
    givenName: "Jane",
    familyName: "Doe",
    telephone: "555-0100",
    email: "jane@example.com",
    address: {
      streetName1: "1 Main St",
      streetName2: "",
      city: "Palo Alto",
      state: "California",
      zipCode: "94301",
      country: "United States",
    },
  },
  creditCard: {
    cardNumberMasked: "•••• •••• •••• 4242",
    cardType: "Java(TM) Card",
    expiryMonth: "12",
    expiryYear: "2027",
  },
  profile: {},
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function Where() {
  return <span data-testid="where">{useLocation().pathname}</span>;
}

function renderCheckout(initialPath = "/checkout") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("CheckoutPage", () => {
  it("[SWHR-C-0259] shows the stored contact in both sections with a Submit control", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(json(ACCOUNT))),
    );

    renderCheckout();

    await waitFor(() => expect(screen.queryAllByRole("region")).toHaveLength(2));
    for (const name of ["Billing Information", "Shipping Information"]) {
      const section = screen.getByRole("region", { name });
      const q = within(section);
      expect(q.getByLabelText("First name")).toHaveValue("Jane");
      expect(q.getByLabelText("Last name")).toHaveValue("Doe");
      expect(q.getByLabelText("Street address", { exact: true })).toHaveValue("1 Main St");
      expect(q.getByLabelText("City")).toHaveValue("Palo Alto");
      expect(q.getByLabelText("State / province")).toHaveValue("California");
      expect(q.getByLabelText("Postal code")).toHaveValue("94301");
      expect(q.getByLabelText("Country")).toHaveValue("United States");
      expect(q.getByLabelText("Telephone")).toHaveValue("555-0100");
      expect(q.getByLabelText(/^E-mail/)).toHaveValue("jane@example.com");
    }
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
    expect(screen.getByText(/4242/)).toBeInTheDocument();
  });

  it("posts the form, announces cart:changed and goes to the order complete page", async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === "POST"
          ? json({ orderId: "10017", email: "jane@example.com" })
          : json(ACCOUNT),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const changed = vi.fn();
    window.addEventListener("cart:changed", changed);

    renderCheckout();
    await userEvent.click(await screen.findByRole("button", { name: "Submit" }));

    await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/order-complete"));
    expect(changed).toHaveBeenCalled();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(post?.[0]).toBe("/api/orders");
    expect(JSON.parse(String(post?.[1]?.body)).shipping.city).toBe("Palo Alto");
    window.removeEventListener("cart:changed", changed);
  });

  it.each([
    ["/order-error", "/order-error"],
    [null, "/error"],
  ])("a failure naming screen %s goes to %s", async (screenName, expected) => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) =>
        Promise.resolve(
          init?.method === "POST"
            ? json({ kind: "EmptyCart", screen: screenName, message: "x" }, 409)
            : json(ACCOUNT),
        ),
      ),
    );

    renderCheckout();
    await userEvent.click(await screen.findByRole("button", { name: "Submit" }));

    await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent(expected));
  });

  it("renders the Chinese screen content for ?locale=zh_CN", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(json(ACCOUNT))),
    );

    renderCheckout("/checkout?locale=zh_CN");

    expect(await screen.findByRole("heading", { level: 1, name: "订单信息" })).toBeInTheDocument();
  });
});
