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

/** UI / PAGE TEST — registration step 2 (design.md P8): only the preferred language. */
describe("RegisterPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults the language select to the session locale and offers all three languages", () => {
    renderPage();

    const select = screen.getByLabelText("Preferred language") as HTMLSelectElement;
    expect(select.value).toBe("en_US");
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "日本語" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "中文" })).toBeInTheDocument();
  });

  it("submits the chosen preferred language to POST /api/customers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ redirect: "/" }))),
    );
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText("Preferred language"), "ja_JP");
    await user.click(screen.getByRole("button", { name: "Finish creating my account" }));

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/customers",
      expect.objectContaining({ method: "POST" }),
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ preferredLanguage: "ja_JP" });
  });
});
