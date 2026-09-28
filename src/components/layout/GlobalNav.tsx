import { Dialog, DialogPanel } from "@headlessui/react";
import { Bird, Cat, Dog, Fish, PawPrint, Turtle, X } from "lucide-react";
import { Link } from "react-router";

import { PET_CATEGORIES, PRIMARY_AREAS, type PetCategoryId } from "@/constants/navigation";
import { cn } from "@/utils";

import SiteHeader from "./SiteHeader";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const CATEGORY_ICONS: Record<PetCategoryId, typeof Bird> = {
  BIRDS: Bird,
  CATS: Cat,
  DOGS: Dog,
  FISH: Fish,
  REPTILES: Turtle,
};

// PRIMARY_AREAS already carries every PET_CATEGORIES entry (same id/href) —
// SiteHeader renders Account/Cart/Sign in/Administration/Supplier, so the
// remaining areas this row needs to cover are the pet categories plus
// Search and Checkout.
const SECONDARY_AREAS = PRIMARY_AREAS.filter(
  (area) => area.id === "SEARCH" || area.id === "CHECKOUT",
);

/**
 * The shell's one navigation landmark. Wraps SiteHeader's visual content
 * (header actions) and the pet-category / primary-area links in a single
 * <nav aria-label="Global"> per design.md SD-3, and owns the header banner
 * element and the below-`lg` menu panel (headlessui Dialog, same pattern as
 * the removed template home page).
 */
export default function GlobalNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-background border-line-2 border-b">
      <nav aria-label="Global">
        <SiteHeader onOpenMenu={() => setMobileOpen(true)} />

        <div className="border-line-2 hidden items-center gap-1 border-t px-4 py-1.5 lg:flex lg:px-8">
          {PET_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id];
            return (
              <Link
                key={category.id}
                to={category.href}
                className={cn(
                  "hover:bg-background-1 flex h-11 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium",
                  FOCUS_RING,
                )}
              >
                <Icon aria-hidden="true" className="text-muted-foreground-1 size-4" />
                {category.label}
              </Link>
            );
          })}
          <span className="border-line-2 mx-1 h-5 border-l" aria-hidden="true" />
          {SECONDARY_AREAS.map((area) => (
            <Link
              key={area.id}
              to={area.href}
              className={cn(
                "hover:bg-background-1 flex h-11 items-center rounded-md px-2.5 text-sm font-medium",
                FOCUS_RING,
              )}
            >
              {area.label}
            </Link>
          ))}
        </div>
      </nav>

      <Dialog open={mobileOpen} onClose={setMobileOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50 bg-black/30" aria-hidden="true" />
        <DialogPanel className="bg-background fixed inset-y-0 right-0 z-50 w-full max-w-xs overflow-y-auto p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              aria-label="Pet Store home"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 text-base font-bold",
                FOCUS_RING,
                "rounded-sm",
              )}
            >
              <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <PawPrint aria-hidden="true" className="size-4" />
              </span>
              Pet Store
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "hover:bg-background-1 flex size-11 items-center justify-center rounded-md",
                FOCUS_RING,
              )}
            >
              <span className="sr-only">Close menu</span>
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <p className="text-muted-foreground-1 px-2.5 pt-2 text-xs font-semibold tracking-wide uppercase">
              Shop by pet
            </p>
            {PET_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.id];
              return (
                <Link
                  key={category.id}
                  to={category.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "hover:bg-background-1 flex h-11 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium",
                    FOCUS_RING,
                  )}
                >
                  <Icon aria-hidden="true" className="text-muted-foreground-1 size-4" />
                  {category.label}
                </Link>
              );
            })}

            <p className="text-muted-foreground-1 px-2.5 pt-3 text-xs font-semibold tracking-wide uppercase">
              Storefront
            </p>
            {PRIMARY_AREAS.filter((area) => !PET_CATEGORIES.some((c) => c.id === area.id)).map(
              (area) => (
                <Link
                  key={area.id}
                  to={area.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "hover:bg-background-1 flex h-11 items-center rounded-md px-2.5 text-sm font-medium",
                    FOCUS_RING,
                  )}
                >
                  {area.label}
                </Link>
              ),
            )}
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
