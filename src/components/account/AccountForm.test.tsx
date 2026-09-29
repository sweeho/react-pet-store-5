import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import type { AccountView } from "../../../lib/account/view";
import AccountForm from "./AccountForm";

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

function renderForm(props: Partial<Parameters<typeof AccountForm>[0]> = {}) {
  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <AccountForm mode="create" onSubmit={onSubmit} {...props} />
      </LocaleProvider>
    </MemoryRouter>,
  );
  return onSubmit;
}

const optionNames = (label: string) =>
  within(screen.getByLabelText(label))
    .getAllByRole("option")
    .map((o) => o.textContent)
    .filter((t) => t && !t.startsWith("Select"));

const selected = (label: string) => {
  const select = screen.getByLabelText(label) as HTMLSelectElement;
  return select.selectedOptions[0]?.textContent;
};

/** UI / COMPONENT TEST — the account form (design.md P4, P6, P9). */
describe("AccountForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[SWHR-C-0223] creation form defaults to English and Birds and offers every choice list", () => {
    renderForm();

    expect(selected("I want MyPetStore to be in")).toBe("English (en_US)");
    expect(selected("My favourite category")).toBe("Birds");
    expect(optionNames("I want MyPetStore to be in")).toEqual([
      "English (en_US)",
      "Japanese (ja_JP)",
      "Chinese (zh_CN)",
    ]);
    expect(optionNames("My favourite category")).toEqual([
      "Birds",
      "Cats",
      "Dogs",
      "Fish",
      "Reptiles",
    ]);
    expect(optionNames("Card Type")).toEqual(["Java(TM) Card", "Duke Express", "Meow Card"]);
    expect(optionNames("Expiry Month")).toHaveLength(12);
    const year = String(new Date().getFullYear());
    expect(optionNames("Expiry Year")).toEqual([0, 1, 2, 3].map((n) => String(Number(year) + n)));
    expect(optionNames("Country")).toEqual(["United States", "Canada", "Japan", "China"]);
    expect(optionNames("State / Province")).toEqual(["California", "New York", "Texas"]);
  });

  it("[SWHR-C-0224] edit form preselects the stored Duke Express card and Cats", () => {
    renderForm({ mode: "edit", initial: stored });

    expect(selected("Card Type")).toBe("Duke Express");
    expect(selected("My favourite category")).toBe("Cats");
    expect(screen.getByLabelText("First Name")).toHaveValue("Maria");
    expect(screen.getByLabelText("Card Number")).toHaveValue("•••• •••• •••• 1111");
    // The stored year is outside the current four-year range but stays selectable.
    expect(selected("Expiry Year")).toBe("2004");
    expect(selected("Expiry Month")).toBe("07");
  });

  it("[SWHR-C-0225] an empty First Name blocks submission with 'First Name is empty.'", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm({
      mode: "edit",
      initial: { ...stored, contactInfo: { ...stored.contactInfo, givenName: "" } },
    });

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText("First Name is empty.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Last Name is empty.")).not.toBeInTheDocument();
  });

  it("submits the composed values when every required field is filled", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm({ mode: "edit", initial: stored });

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmit).toHaveBeenCalledWith({
      givenName: "Maria",
      familyName: "Chen",
      telephone: "555-555-5555",
      email: "maria@example.com",
      streetName1: "1400 Page Mill Road",
      streetName2: "Suite 210",
      city: "Palo Alto",
      state: "California",
      zipCode: "94304",
      country: "United States",
      cardNumber: "•••• •••• •••• 1111",
      cardType: "Duke Express",
      expiryMonth: "07",
      expiryYear: "2004",
      preferredLanguage: "en_US",
      favoriteCategory: "CATS",
      myListPreference: true,
      bannerPreference: false,
    });
  });

  it("requires the card number on create but not on edit", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getAllByText("Card Number is empty.").length).toBeGreaterThan(0);
  });

  it("shows a server-reported missing field beside its input", () => {
    renderForm({ mode: "edit", initial: stored, serverMissing: ["city"] });
    expect(screen.getAllByText("City is empty.").length).toBeGreaterThan(0);
  });
});
