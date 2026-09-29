import { createElement } from "react";

import { getCategoryIcon } from "@/components/catalog/categoryIcons";
import { useAccount } from "@/hooks";
import { useScreen } from "@/i18n/screens";

const BANNER_CATEGORIES = ["dogs", "cats", "reptiles", "birds", "fish"] as const;

function CategoryIcon({ categoryId }: { categoryId: string }) {
  return createElement(getCategoryIcon(categoryId), {
    "aria-hidden": true,
    className: "size-7.5",
  });
}

/**
 * The pet-tips banner (design.md P10): shown on home and cart for a
 * signed-on customer with the banner preference on. The favourite category
 * is matched case-insensitively; anything else falls back to dogs.
 */
export default function PetTipsBanner() {
  const { account } = useAccount();
  const t = useScreen("pet-tips");
  const profile = account?.profile;
  if (!profile?.bannerPreference) return null;

  const favourite = (profile.favoriteCategory ?? "").trim().toLowerCase();
  const category = BANNER_CATEGORIES.find((id) => id === favourite) ?? "dogs";

  return (
    <section
      data-testid="pet-tips-banner"
      data-category={category}
      className="border-primary-200 bg-primary-50 flex items-center gap-5 rounded-xl border px-6 py-4.5"
    >
      <span className="bg-background border-primary-100 text-primary flex size-14 shrink-0 items-center justify-center rounded-xl border">
        <CategoryIcon categoryId={category.toUpperCase()} />
      </span>
      <div className="flex-1">
        <span className="text-primary-700 text-xs font-semibold tracking-wide uppercase">
          {t.label} · {t[`${category}Name`]}
        </span>
        <p className="mt-0.5 text-base font-semibold">{t[`${category}Headline`]}</p>
        <p className="text-muted-foreground-2 text-sm">{t[`${category}Body`]}</p>
      </div>
    </section>
  );
}
