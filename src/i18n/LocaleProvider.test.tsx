import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider, useLocale } from "./LocaleProvider";

function Probe() {
  const { locale } = useLocale();
  return <span data-testid="locale">{locale}</span>;
}

function ChangeButton({ to }: { to: string }) {
  const { changeLocale } = useLocale();
  return (
    <button type="button" onClick={() => void changeLocale(to)}>
      change
    </button>
  );
}

/**
 * UI / COMPONENT TEST
 *
 * The client-side locale seam (P2, P3): the effective locale starts as the
 * session locale loaded via `fetchLocale`, a parseable `?locale=` overrides
 * it for the render without persisting, and `changeLocale` writes through
 * `postLocale` and updates every consumer. `fetchLocale`/`postLocale` are
 * injected so no test needs a real network round trip.
 */
describe("LocaleProvider", () => {
  it("starts at the default locale before the session loads, then adopts it", async () => {
    render(
      <MemoryRouter>
        <LocaleProvider
          fetchLocale={() => Promise.resolve({ locale: "zh_CN", cartLocale: "zh_CN" })}
        >
          <Probe />
        </LocaleProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId("locale")).toHaveTextContent("zh_CN"));
  });

  it("[AC-3] a parseable ?locale= overrides the session locale without persisting it", async () => {
    const postLocale = vi.fn();

    render(
      <MemoryRouter initialEntries={["/product?locale=ja_JP"]}>
        <LocaleProvider
          fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
          postLocale={postLocale}
        >
          <Probe />
        </LocaleProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId("locale")).toHaveTextContent("ja_JP"));
    expect(postLocale).not.toHaveBeenCalled();
  });

  it("an unparseable ?locale= is ignored and the session locale is used", async () => {
    render(
      <MemoryRouter initialEntries={["/product?locale=ja"]}>
        <LocaleProvider
          fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
        >
          <Probe />
        </LocaleProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId("locale")).toHaveTextContent("en_US"));
  });

  it("changeLocale writes through postLocale and updates the effective locale", async () => {
    const postLocale = vi.fn().mockResolvedValue({ ok: true, locale: "zh_CN" });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LocaleProvider
          fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
          postLocale={postLocale}
        >
          <Probe />
          <ChangeButton to="zh_CN" />
        </LocaleProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId("locale")).toHaveTextContent("en_US"));
    await user.click(screen.getByRole("button", { name: "change" }));

    expect(postLocale).toHaveBeenCalledWith("zh_CN");
    await waitFor(() => expect(screen.getByTestId("locale")).toHaveTextContent("zh_CN"));
  });

  it("changeLocale surfaces the rejection message and leaves the locale unchanged", async () => {
    const postLocale = vi
      .fn()
      .mockResolvedValue({ ok: false, message: "Unable to change language to ja" });
    const user = userEvent.setup();

    function ChangeAndReport() {
      const { changeLocale } = useLocale();
      const [result, setResult] = useState<string | null>(null);
      return (
        <>
          <button
            type="button"
            onClick={() => void changeLocale("ja").then((r) => setResult(JSON.stringify(r)))}
          >
            change
          </button>
          <span data-testid="result">{result}</span>
        </>
      );
    }

    render(
      <MemoryRouter>
        <LocaleProvider
          fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
          postLocale={postLocale}
        >
          <Probe />
          <ChangeAndReport />
        </LocaleProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId("locale")).toHaveTextContent("en_US"));
    await user.click(screen.getByRole("button", { name: "change" }));

    await waitFor(() =>
      expect(screen.getByTestId("result")).toHaveTextContent(
        JSON.stringify({ ok: false, message: "Unable to change language to ja" }),
      ),
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("en_US");
  });

  it("useLocale throws when used outside a LocaleProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(
        <MemoryRouter>
          <Probe />
        </MemoryRouter>,
      ),
    ).toThrow("useLocale must be used within a LocaleProvider");

    consoleError.mockRestore();
  });
});
