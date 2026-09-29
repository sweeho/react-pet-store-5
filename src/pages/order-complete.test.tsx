import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import OrderCompletePage from "./order-complete";

function renderPage(initialPath = "/order-complete") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <OrderCompletePage />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("OrderCompletePage", () => {
  it("[SWHR-C-0273] shows the order id and the confirmation e-mail address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ orderId: "10017", email: "jane@example.com" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        ),
      ),
    );

    renderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Your Order is Complete" }),
    ).toBeInTheDocument();
    expect(screen.getByText("10017")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText(/A confirmation e-mail will be sent to/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue shopping" })).toHaveAttribute("href", "/");
  });

  it("renders the Japanese screen content for ?locale=ja_JP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ orderId: "10017", email: "jane@example.com" }), {
            status: 200,
          }),
        ),
      ),
    );

    renderPage("/order-complete?locale=ja_JP");

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "ご注文が完了しました",
    );
  });
});
