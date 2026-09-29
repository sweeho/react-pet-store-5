import { Check, CreditCard, Pencil, Star, User, X } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { EmptyState, ErrorState, LoadingState } from "@/components/state";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/hooks/useAccount";
import { useCatalogCategories } from "@/hooks/useCatalogCategories";
import { useScreen } from "@/i18n/screens";
import { cn } from "@/utils";

import { ACCOUNT_LANGUAGES, FAVORITE_CATEGORIES } from "../../lib/account/reference";

function Card({
  icon,
  heading,
  hint,
  columns,
  children,
}: {
  icon: ReactNode;
  heading: string;
  hint: string;
  columns: "two" | "three";
  children: ReactNode;
}) {
  return (
    <section className="border-line-2 bg-background rounded-xl border">
      <div className="border-line-2 flex items-center gap-3 border-b px-6 py-4.5">
        <span className="bg-primary-50 text-primary flex size-9 items-center justify-center rounded-lg">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-semibold">{heading}</h2>
          <span className="text-muted-foreground-1 text-[13px]">{hint}</span>
        </div>
      </div>
      <dl className={cn("grid", columns === "three" ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {children}
      </dl>
    </section>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-line-1 border-b px-6 py-3.5">
      <dt className="text-muted-foreground-1 text-xs font-medium">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-medium">{children}</dd>
    </div>
  );
}

function YesNo({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  const Icon = on ? Check : X;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold",
        on ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {on ? yes : no}
    </span>
  );
}

/** The read-only account information page (design.md P3, P8). */
export default function AccountPage() {
  const t = useScreen("account");
  const { account, loading, error } = useAccount();
  const { categories } = useCatalogCategories();

  const body = () => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState title={t.loadError} />;
    if (!account) {
      return <EmptyState title={t.noAccountTitle} description={t.noAccountDescription} />;
    }
    const { contactInfo: contact, creditCard: card, profile } = account;
    const address = contact.address;
    const language = ACCOUNT_LANGUAGES.find((l) => l.id === profile.preferredLanguage);
    const favorite = FAVORITE_CATEGORIES.find((c) => c.id === profile.favoriteCategory);
    const favoriteName = favorite
      ? (categories.find((c) => c.categoryId === favorite.id)?.name ?? favorite.label)
      : (profile.favoriteCategory ?? "");

    return (
      <>
        <Card
          icon={<User aria-hidden="true" className="size-4.5" />}
          heading={t.contactHeading}
          hint={t.contactHint}
          columns="three"
        >
          <Item label={t.firstName}>{contact.givenName}</Item>
          <Item label={t.lastName}>{contact.familyName}</Item>
          <Item label={t.telephone}>{contact.telephone}</Item>
          <Item label={t.street1}>{address.streetName1}</Item>
          <Item label={t.street2}>{address.streetName2}</Item>
          <Item label={t.email}>{contact.email}</Item>
          <Item label={t.city}>{address.city}</Item>
          <Item label={t.state}>{address.state}</Item>
          <Item label={t.postalCode}>{address.zipCode}</Item>
          <Item label={t.country}>{address.country}</Item>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            icon={<CreditCard aria-hidden="true" className="size-4.5" />}
            heading={t.cardHeading}
            hint={t.cardHint}
            columns="two"
          >
            <Item label={t.cardType}>{card.cardType}</Item>
            <Item label={t.cardNumber}>
              <span className="font-mono tracking-wide">{card.cardNumberMasked}</span>
            </Item>
            <Item label={t.expiryMonth}>{card.expiryMonth}</Item>
            <Item label={t.expiryYear}>{card.expiryYear}</Item>
          </Card>
          <Card
            icon={<Star aria-hidden="true" className="size-4.5" />}
            heading={t.profileHeading}
            hint={t.profileHint}
            columns="two"
          >
            <Item label={t.language}>{language?.label ?? profile.preferredLanguage}</Item>
            <Item label={t.favoriteCategory}>{favoriteName}</Item>
            <Item label={t.myList}>
              <YesNo on={profile.myListPreference} yes={t.yes} no={t.no} />
            </Item>
            <Item label={t.banners}>
              <YesNo on={profile.bannerPreference} yes={t.yes} no={t.no} />
            </Item>
          </Card>
        </div>
        <p className="text-muted-foreground-1 text-xs">{t.footnote}</p>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground-2 mt-1.5">{t.subtitle}</p>
        </div>
        <Button asChild>
          <Link to="/account-edit">
            <Pencil aria-hidden="true" className="size-4.5" />
            {t.editButton}
          </Link>
        </Button>
      </div>
      {body()}
    </div>
  );
}
