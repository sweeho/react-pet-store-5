import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignOnSessionProvider } from "@/hooks/useSignOnSession";
import { LocaleProvider } from "@/i18n/LocaleProvider";

import RegisterPage from "./register";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderPage(initialPath = "/register") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <SignOnSessionProvider
          fetchSession={() => Promise.resolve({ signedOn: false, userId: "bob" })}
        >
          <RegisterPage />
        </SignOnSessionProvider>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/** UI / PAGE TEST — registration step 2 (design.md P8, P9): the full account form. */
describe("RegisterPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preselects English and Birds", () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
    renderPage();

    expect((screen.getByLabelText("I want MyPetStore to be in") as HTMLSelectElement).value).toBe(
      "en_US",
    );
    expect((screen.getByLabelText("My favourite category") as HTMLSelectElement).value).toBe(
      "BIRDS",
    );
  });

  it("blocks an empty form and posts nothing", async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error("offline")));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage();
    fetchMock.mockClear();

    await user.click(screen.getByRole("button", { name: "Finish creating my account" }));

    expect(screen.getAllByText("First Name is empty.").length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the completed form to POST /api/customers", async () => {
    const fetchMock = vi.fn((url: string) =>
      url === "/api/customers"
        ? Promise.resolve(jsonResponse({ redirect: "/" }))
        : Promise.reject(new Error("offline")),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("First Name"), "Bob");
    await user.type(screen.getByLabelText("Last Name"), "Ross");
    await user.type(screen.getByLabelText("Street Address"), "1 Main");
    await user.type(screen.getByLabelText("City"), "Palo Alto");
    await user.selectOptions(screen.getByLabelText("State / Province"), "California");
    await user.type(screen.getByLabelText("Postal Code"), "94304");
    await user.selectOptions(screen.getByLabelText("Country"), "United States");
    await user.type(screen.getByLabelText("Telephone Number"), "555");
    await user.type(screen.getByLabelText("Card Number"), "4111-1111-1111-1111");
    await user.selectOptions(screen.getByLabelText("Card Type"), "Meow Card");
    await user.selectOptions(screen.getByLabelText("Expiry Month"), "07");
    await user.selectOptions(
      screen.getByLabelText("Expiry Year"),
      String(new Date().getFullYear()),
    );
    await user.click(screen.getByRole("button", { name: "Finish creating my account" }));

    const call = fetchMock.mock.calls.find(([url]) => url === "/api/customers");
    expect(call).toBeDefined();
    const init = (call as unknown as [string, RequestInit])[1];
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({
      givenName: "Bob",
      cardNumber: "4111-1111-1111-1111",
      preferredLanguage: "en_US",
      favoriteCategory: "BIRDS",
    });
  });
});
