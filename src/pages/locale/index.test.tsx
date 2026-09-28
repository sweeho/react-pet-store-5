import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import LocaleChanged from "./changed";
import LocaleSelection from "./index";

type PostLocaleResult = { ok: true; locale: string } | { ok: false; message: string };

function renderLocaleFlow(options: {
  initialPath?: string;
  postLocale?: (id: string) => Promise<PostLocaleResult>;
}) {
  const { initialPath = "/locale", postLocale } = options;

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider
        fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
        postLocale={postLocale}
      >
        <Routes>
          <Route path="/locale" element={<LocaleSelection />} />
          <Route path="/locale/changed" element={<LocaleChanged />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/**
 * UI / PAGE TEST
 *
 * The locale selection screen, the successful change confirmation, and the
 * rejected-change error (SWHR-R-0023, SWHR-R-0009). Prefer
 * e2e/locale-selection.spec.ts for anything needing a real browser/server.
 */
describe("LocaleSelection", () => {
  it("[AC-1] shows the four-option choice list and a Change Locale control", async () => {
    renderLocaleFlow({});

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Change language" }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "US English" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "German" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Japanese" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Simplified Chinese" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change Locale" })).toBeInTheDocument();
  });

  it("[AC-2] submitting Japanese switches the session locale and shows the confirmation screen with ja_JP", async () => {
    const postLocale = vi.fn().mockResolvedValue({ ok: true, locale: "ja_JP" });
    const user = userEvent.setup();

    renderLocaleFlow({ postLocale });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Change language" }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("radio", { name: "Japanese" }));
    await user.click(screen.getByRole("button", { name: "Change Locale" }));

    expect(postLocale).toHaveBeenCalledWith("ja_JP");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "言語を変更しました" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("ja_JP")).toBeInTheDocument();
  });

  it("a rejected change (a malformed ?requested= link) leaves the session locale unchanged and shows the error", async () => {
    const postLocale = vi
      .fn()
      .mockResolvedValue({ ok: false, message: "Unable to change language to ja" });

    renderLocaleFlow({ initialPath: "/locale?requested=ja", postLocale });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Unable to change language to ja" }),
      ).toBeInTheDocument(),
    );

    expect(postLocale).toHaveBeenCalledWith("ja");
    expect(screen.getByText(/en_US/)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Choose a language" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Change language" }),
      ).toBeInTheDocument(),
    );
  });
});
