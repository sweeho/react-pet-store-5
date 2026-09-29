import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import AccountEditPage from "./account-edit";

const stored = {
  userId: "j2ee",
  status: "active",
  contactInfo: {
    givenName: "Maria",
    familyName: "Chen",
    telephone: "555-555-5555",
    email: "",
    address: {
      streetName1: "1 Main",
      streetName2: null,
      city: "Palo Alto",
      state: "California",
      zipCode: "94304",
      country: "United States",
    },
  },
  creditCard: {
    cardNumberMasked: "•••• •••• •••• 1111",
    cardType: "Duke Express",
    expiryMonth: "07",
    expiryYear: "2004",
  },
  profile: {
    preferredLanguage: "en_US",
    favoriteCategory: "CATS",
    myListPreference: true,
    bannerPreference: false,
  },
};

describe("AccountEditPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("opens the edit form preselected with the stored values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url === "/api/account"
          ? Promise.resolve(new Response(JSON.stringify(stored), { status: 200 }))
          : Promise.reject(new Error("offline")),
      ),
    );
    render(
      <MemoryRouter initialEntries={["/account-edit"]}>
        <LocaleProvider
          fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
        >
          <AccountEditPage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByLabelText("First Name")).toHaveValue("Maria"));
    expect((screen.getByLabelText("Card Type") as HTMLSelectElement).value).toBe("Duke Express");
    expect((screen.getByLabelText("My favourite category") as HTMLSelectElement).value).toBe(
      "CATS",
    );
  });
});
