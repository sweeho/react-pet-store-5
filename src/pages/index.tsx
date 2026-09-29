import { LogIn, Shield, Truck, User } from "lucide-react";
import { Link } from "react-router";

import PetTipsBanner from "@/components/account/PetTipsBanner";
import { getCategoryIcon } from "@/components/catalog/categoryIcons";
import PetsMenu from "@/components/layout/PetsMenu";
import { useCatalogCategories } from "@/hooks";
import { useScreen } from "@/i18n/screens";

interface HomeMapRegion {
  area: string;
  large?: boolean;
}

// The home map's fixed picture region per legacy category id (design.md
// P5) — a region whose category the API doesn't return for this locale is
// simply not rendered (the grid area is left empty).
const HOME_MAP_REGIONS: Record<string, HomeMapRegion> = {
  BIRDS: { area: "b" },
  DOGS: { area: "d", large: true },
  CATS: { area: "c" },
  FISH: { area: "f" },
  REPTILES: { area: "r" },
};

const Home = () => {
  const t = useScreen("home");
  const { categories } = useCatalogCategories();
  const regions = categories.filter((category) => HOME_MAP_REGIONS[category.categoryId]);

  return (
    <div className="flex gap-8">
      <PetsMenu />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <section className="border-line-2 from-primary-50 to-background flex flex-wrap items-center gap-10 rounded-xl border bg-gradient-to-br p-10">
          <div className="flex min-w-64 flex-1 flex-col gap-3.5">
            <span className="text-primary text-sm font-semibold">{t.eyebrow}</span>
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="text-muted-foreground-2 max-w-xl text-base">{t.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                to="/category/DOGS"
                className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold"
              >
                {t.shopDogs}
              </Link>
              <Link
                to="/cart"
                className="border-line-2 bg-background hover:bg-background-1 inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold"
              >
                {t.viewCart}
              </Link>
              <Link to="/search" className="text-primary text-sm font-semibold hover:underline">
                {t.searchAll}
              </Link>
              <Link to="/checkout" className="text-primary text-sm font-semibold hover:underline">
                {t.goToCheckout}
              </Link>
            </div>
          </div>
        </section>

        <PetTipsBanner />

        <div className="border-line-2 bg-card flex flex-col gap-5 rounded-xl border p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{t.pictureMapHeading}</h2>
            <span className="text-muted-foreground-1 text-sm">{t.pictureMapHelp}</span>
          </div>
          <div
            role="group"
            aria-label={t.pictureMapHeading}
            className="from-primary-50 to-background-1 grid h-105 gap-4 rounded-2xl bg-gradient-to-b p-5"
            style={{
              gridTemplateColumns: "1fr 1.3fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gridTemplateAreas: `"b d c" "f d r"`,
            }}
          >
            {regions.map((category) => {
              const region = HOME_MAP_REGIONS[category.categoryId]!;
              const Icon = getCategoryIcon(category.categoryId);

              return (
                <Link
                  key={category.categoryId}
                  to={`/category/${category.categoryId}`}
                  style={{ gridArea: region.area }}
                  className="border-primary-100 bg-background text-primary-700 flex flex-col items-center justify-center gap-3 rounded-2xl border"
                >
                  <Icon
                    aria-hidden="true"
                    className={region.large ? "size-30" : "size-16"}
                    strokeWidth={1.3}
                  />
                  <span className="border-line-2 bg-background text-foreground rounded-full border px-3.5 py-1 text-sm font-semibold">
                    {category.name} →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border-line-2 bg-card flex items-center gap-4 rounded-xl border p-5">
            <div className="bg-primary-50 text-primary flex size-11 shrink-0 items-center justify-center rounded-md">
              <User aria-hidden="true" className="size-5" />
            </div>
            <div className="flex-1">
              <Link to="/account" className="font-semibold hover:underline">
                {t.yourAccount}
              </Link>
              <p className="text-muted-foreground-1 text-sm">{t.accountDescription}</p>
            </div>
            <Link
              to="/signin"
              className="border-line-2 bg-background hover:bg-background-1 inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold"
            >
              <LogIn aria-hidden="true" className="size-4" />
              {t.signIn}
            </Link>
          </div>

          <div className="border-line-2 bg-card flex items-center gap-4 rounded-xl border p-5">
            <div className="bg-background-2 text-muted-foreground-2 flex size-11 shrink-0 items-center justify-center rounded-md">
              <Truck aria-hidden="true" className="size-5" />
            </div>
            <div className="flex-1">
              <span className="font-semibold">{t.storeStaff}</span>
              <p className="text-muted-foreground-1 text-sm">{t.staffDescription}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Link
                to="/admin"
                className="text-primary hover:bg-background-1 inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold"
              >
                <Shield aria-hidden="true" className="size-4" />
                {t.administration}
              </Link>
              <Link
                to="/supplier"
                className="text-primary hover:bg-background-1 inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold"
              >
                <Truck aria-hidden="true" className="size-4" />
                {t.supplier}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
