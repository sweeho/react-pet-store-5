import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import PetTipsBanner from "./PetTipsBanner";

function stubAccount(status: number, profile?: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(profile ? { userId: "j2ee", profile } : {}), { status }),
      ),
    ),
  );
}

function renderBanner() {
  return render(
    <MemoryRouter>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <PetTipsBanner />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

async function settled() {
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  await new Promise((resolve) => setTimeout(resolve, 20));
}

describe("PetTipsBanner", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["CATS", "cats"],
    ["fish", "fish"],
    ["Reptiles", "reptiles"],
    ["", "dogs"],
    ["HAMSTERS", "dogs"],
  ])("[SWHR-C-0228] favourite %j shows the %s banner", async (favoriteCategory, expected) => {
    stubAccount(200, { favoriteCategory, bannerPreference: true, myListPreference: true });
    renderBanner();

    const banner = await screen.findByTestId("pet-tips-banner");
    expect(banner).toHaveAttribute("data-category", expected);
  });

  it("shows nothing when the banner preference is off", async () => {
    stubAccount(200, { favoriteCategory: "CATS", bannerPreference: false, myListPreference: true });
    renderBanner();
    await settled();
    expect(screen.queryByTestId("pet-tips-banner")).not.toBeInTheDocument();
  });

  it("shows nothing to an anonymous visitor", async () => {
    stubAccount(401);
    renderBanner();
    await settled();
    expect(screen.queryByTestId("pet-tips-banner")).not.toBeInTheDocument();
  });
});
