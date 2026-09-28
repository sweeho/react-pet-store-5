import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignOnSessionProvider } from "@/hooks/useSignOnSession";
import { LocaleProvider } from "@/i18n/LocaleProvider";

import SignInPage from "./signin";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubFetch(handler: (url: string, init?: RequestInit) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
      Promise.resolve(handler(String(input), init)),
    ),
  );
}

function setRememberedUserName(userId: string | null) {
  if (userId) {
    document.cookie = `signon_username=${encodeURIComponent(userId)}; path=/`;
  } else {
    document.cookie = "signon_username=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  }
}

function renderSignIn(initialPath = "/signin") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <SignOnSessionProvider
          fetchSession={() => Promise.resolve({ signedOn: false, userId: null })}
        >
          <SignInPage />
        </SignOnSessionProvider>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * SWHR-R-0053: the returning-customer and new-account forms, each queried
 * through its own `aria-labelledby`'d <form> since both forms carry a
 * field literally labelled "User name"/"Password" (matching the mockup).
 * SignOnSessionProvider gets its own injected `fetchSession` (not the
 * `fetch` stub below, which covers the page's own /api/signon and
 * /api/users calls), so the two seams don't collide.
 */
describe("SignInPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setRememberedUserName(null);
  });

  it("[SWHR-C-0099] pre-fills the remembered user name, leaves the password empty, and checks Remember My User Name", () => {
    setRememberedUserName("alice");
    renderSignIn();

    const form = screen.getByRole("form", { name: "Are you a returning customer?" });
    expect(within(form).getByLabelText("User name")).toHaveValue("alice");
    expect(within(form).getByLabelText("Password")).toHaveValue("");
    expect(within(form).getByRole("checkbox", { name: "Remember My User Name" })).toBeChecked();
  });

  it("[SWHR-C-0100] leaves the checkbox unchecked and every new-account field empty when no user name is remembered", () => {
    renderSignIn();

    const returningForm = screen.getByRole("form", { name: "Are you a returning customer?" });
    expect(
      within(returningForm).getByRole("checkbox", { name: "Remember My User Name" }),
    ).not.toBeChecked();
    expect(within(returningForm).getByLabelText("User name")).toHaveValue("");

    const newAccountForm = screen.getByRole("form", {
      name: "I would like to sign up for an account",
    });
    expect(within(newAccountForm).getByLabelText("User name")).toHaveValue("");
    expect(within(newAccountForm).getByLabelText("Password")).toHaveValue("");
    expect(within(newAccountForm).getByLabelText("Repeat password")).toHaveValue("");
  });

  it("[SWHR-C-0101] blocks submission and shows one message per empty field, without calling the API", async () => {
    stubFetch(() => jsonResponse({ redirect: "/signin-error" }, 401));
    const user = userEvent.setup();
    renderSignIn();

    const form = screen.getByRole("form", { name: "Are you a returning customer?" });
    await user.type(within(form).getByLabelText("User name"), "alice");
    await user.click(within(form).getByRole("button", { name: "Sign In" }));

    expect(within(form).getByRole("alert")).toHaveTextContent("Password is empty.");
    expect(within(form).queryByText("User name is empty.")).not.toBeInTheDocument();

    await user.clear(within(form).getByLabelText("User name"));
    await user.click(within(form).getByRole("button", { name: "Sign In" }));

    const alert = within(form).getByRole("alert");
    expect(alert).toHaveTextContent("User name is empty.");
    expect(alert).toHaveTextContent("Password is empty.");

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes("/api/signon"))).toBe(
      false,
    );
  });

  it("[SWHR-C-0102] submits the user name and password once for account creation", async () => {
    stubFetch(() => jsonResponse({ redirect: "/register" }, 201));
    const user = userEvent.setup();
    renderSignIn();

    const form = screen.getByRole("form", { name: "I would like to sign up for an account" });
    await user.type(within(form).getByLabelText("User name"), "bob");
    await user.type(within(form).getByLabelText("Password"), "Pass123");
    await user.type(within(form).getByLabelText("Repeat password"), "Pass123");
    await user.click(within(form).getByRole("button", { name: "Create New Account" }));

    const fetchMock = vi.mocked(fetch);
    const creationCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes("/api/users"),
    );
    expect(creationCalls).toHaveLength(1);
    const [, init] = creationCalls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ userId: "bob", password: "Pass123" });
  });

  it("renders the Japanese screen content for ?locale=ja_JP", () => {
    renderSignIn("/signin?locale=ja_JP");

    expect(screen.getByRole("heading", { level: 1, name: "サインイン" })).toBeInTheDocument();
  });
});
