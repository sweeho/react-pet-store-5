import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import type { AccountView } from "../../lib/account/view";
import AccountPage from "./account";

const stored: AccountView = {
  userId: "j2ee",
  status: "active",
  contactInfo: {
    givenName: "Maria",
    familyName: "Chen",
    telephone: "555-555-5555",
    email: "maria@example.com",
    address: {
      streetName1: "1400 Page Mill Road",
      streetName2: "Suite 210",
      city: "Palo Alto",
      state: "California",
      zipCode: "94304",
      country: "United States",
    },
  },
  creditCard: {
    cardNumberMasked: "•••• •••• •••• 1111",
    cardType: "Java(TM) Card",
    expiryMonth: "07",
    expiryYear: "2004",
  },
  profile: {
    preferredLanguage: "en_US",
    favoriteCategory: "FISH",
    myListPreference: true,
    bannerPreference: false,
  },
};

function stubFetch(account: AccountView | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url === "/api/account") {
        return Promise.resolve(
          account
            ? new Response(JSON.stringify(account), { status: 200 })
            : new Response("{}", { status: 404 }),
        );
      }
      return Promise.reject(new Error("offline"));
    }),
  );
}

function renderAccount(initialPath = "/account") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <AccountPage />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

const field = (name: string) => {
  const term = screen.getByText(name, { selector: "dt" });
  return term.parentElement as HTMLElement;
};

/** UI / PAGE TEST — the read-only account information page. */
describe("AccountPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("[SWHR-C-0230] shows stored fields, expiry 07/2004, My List Yes and banners No", async () => {
    stubFetch(stored);
    renderAccount();

    // The heading renders while the account is still loading; wait for the data.
    await waitFor(() =>
      expect(screen.queryByText("First Name", { selector: "dt" })).not.toBeNull(),
    );
    expect(within(field("First Name")).getByText("Maria")).toBeVisible();
    expect(within(field("Last Name")).getByText("Chen")).toBeVisible();
    expect(within(field("Telephone")).getByText("555-555-5555")).toBeVisible();
    expect(within(field("Street Address")).getByText("1400 Page Mill Road")).toBeVisible();
    expect(within(field("E-mail")).getByText("maria@example.com")).toBeVisible();
    expect(within(field("Card Type")).getByText("Java(TM) Card")).toBeVisible();
    expect(within(field("Card Number")).getByText("•••• •••• •••• 1111")).toBeVisible();
    expect(within(field("Expiry Month")).getByText("07")).toBeVisible();
    expect(within(field("Expiry Year")).getByText("2004")).toBeVisible();
    expect(within(field("Preferred Language")).getByText("English (en_US)")).toBeVisible();
    expect(within(field("Favourite Category")).getByText("Fish")).toBeVisible();
    expect(within(field("My List")).getByText("Yes")).toBeVisible();
    expect(within(field("Pet Tips Banners")).getByText("No")).toBeVisible();
  });

  it("[SWHR-C-0231] the edit control opens the account edit form", async () => {
    stubFetch(stored);
    renderAccount();

    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: "Edit Your Account Information" })?.getAttribute("href"),
      ).toBe("/account-edit"),
    );
  });

  it("renders the Japanese page copy for ?locale=ja_JP", async () => {
    stubFetch(stored);
    renderAccount("/account?locale=ja_JP");
    await waitFor(() =>
      expect(screen.queryByRole("heading", { level: 1, name: "アカウント情報" })).not.toBeNull(),
    );
  });
});
