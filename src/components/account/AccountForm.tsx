import { AlertCircle, CreditCard, Star, User } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { useCatalogCategories } from "@/hooks/useCatalogCategories";
import { useScreen } from "@/i18n/screens";
import { cn } from "@/utils";

import type { AccountField, AccountFormInput } from "../../../lib/account/form";
import {
  ACCOUNT_LANGUAGES,
  CARD_TYPES,
  COUNTRIES,
  DEFAULT_FAVORITE_CATEGORY,
  DEFAULT_LANGUAGE,
  EXPIRY_MONTHS,
  FAVORITE_CATEGORIES,
  STATES,
  expiryYears,
} from "../../../lib/account/reference";
import type { AccountView } from "../../../lib/account/view";

export interface AccountFormProps {
  mode: "create" | "edit";
  /** Stored account preselected in edit mode. */
  initial?: AccountView | null;
  /** Fields a server `400 { missing }` reported; rendered like the client check. */
  serverMissing?: AccountField[];
  submitting?: boolean;
  submitLabel?: string;
  /** Renders a Cancel link (edit mode goes back to the account page). */
  cancelTo?: string;
  onSubmit: (input: AccountFormInput) => void | Promise<void>;
}

type TextValues = Record<AccountField, string>;

// Client-side mirror of the server's required fields (design.md P6). Card
// number is required on create only: on edit a blank or masked one keeps the
// stored card.
const REQUIRED: readonly AccountField[] = [
  "givenName",
  "familyName",
  "streetName1",
  "city",
  "state",
  "zipCode",
  "country",
  "telephone",
  "cardNumber",
  "cardType",
  "expiryMonth",
  "expiryYear",
  "preferredLanguage",
  "favoriteCategory",
];

function initialValues(initial: AccountView | null | undefined): TextValues {
  const contact = initial?.contactInfo;
  const card = initial?.creditCard;
  const profile = initial?.profile;
  return {
    givenName: contact?.givenName ?? "",
    familyName: contact?.familyName ?? "",
    streetName1: contact?.address.streetName1 ?? "",
    streetName2: contact?.address.streetName2 ?? "",
    city: contact?.address.city ?? "",
    state: contact?.address.state ?? "",
    zipCode: contact?.address.zipCode ?? "",
    country: contact?.address.country ?? "",
    telephone: contact?.telephone ?? "",
    email: contact?.email ?? "",
    cardNumber: card?.cardNumberMasked ?? "",
    cardType: card?.cardType ?? "",
    expiryMonth: card?.expiryMonth ?? "",
    expiryYear: card?.expiryYear ?? "",
    preferredLanguage: profile?.preferredLanguage ?? DEFAULT_LANGUAGE,
    favoriteCategory: profile?.favoriteCategory ?? DEFAULT_FAVORITE_CATEGORY,
  };
}

const controlClass =
  "border-line-2 bg-background focus-visible:ring-ring flex h-11 w-full items-center rounded-md border px-3.5 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

function Section({
  icon,
  heading,
  hint,
  children,
}: {
  icon: ReactNode;
  heading: string;
  hint: string;
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
      <div className="grid grid-cols-6 gap-x-5 gap-y-4 px-6 pt-5 pb-6">{children}</div>
    </section>
  );
}

/**
 * The account-information form shared by /register and /account-edit
 * (design.md P4, P6, P9). Choice lists come from lib/account/reference.ts;
 * the states are the account form's fixed list, not StateProvinceSelect (SD6).
 */
export default function AccountForm({
  mode,
  initial,
  serverMissing = [],
  submitting = false,
  submitLabel,
  cancelTo,
  onSubmit,
}: AccountFormProps) {
  const t = useScreen("account");
  const { categories } = useCatalogCategories();
  const [values, setValues] = useState<TextValues>(() => initialValues(initial));
  const [myList, setMyList] = useState(initial?.profile.myListPreference ?? true);
  const [banner, setBanner] = useState(initial?.profile.bannerPreference ?? true);
  const [clientMissing, setClientMissing] = useState<AccountField[]>([]);

  const missing = [...new Set([...clientMissing, ...serverMissing])];
  const years = expiryYears(new Date(), initial?.creditCard.expiryYear);
  const categoryName = (id: string, fallback: string) =>
    categories.find((c) => c.categoryId === id)?.name ?? fallback;

  const labels: Record<AccountField, string> = {
    givenName: t.firstName,
    familyName: t.lastName,
    streetName1: t.street1,
    streetName2: t.street2,
    city: t.city,
    state: t.state,
    zipCode: t.postalCode,
    country: t.country,
    telephone: t.telephoneField,
    email: t.email,
    cardNumber: t.cardNumber,
    cardType: t.cardType,
    expiryMonth: t.expiryMonth,
    expiryYear: t.expiryYear,
    preferredLanguage: t.languageField,
    favoriteCategory: t.favoriteField,
  };
  const emptyMessage = (field: AccountField) => t.emptyField.replace("{field}", labels[field]);

  const set = (field: AccountField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setClientMissing((current) => current.filter((f) => f !== field));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const blank = REQUIRED.filter((field) => {
      const value = values[field].trim();
      if (field === "cardNumber" && mode === "edit") {
        return false;
      }
      return value === "";
    });
    setClientMissing(blank);
    if (blank.length > 0) return;
    void onSubmit({
      ...values,
      cardNumber: values.cardNumber.trim(),
      myListPreference: myList,
      bannerPreference: banner,
    });
  };

  const field = (
    name: AccountField,
    span: string,
    control: (props: { id: string; invalid: boolean }) => ReactNode,
    options: { required?: boolean; help?: string } = {},
  ) => {
    const { required = REQUIRED.includes(name), help } = options;
    const id = `account-${name}`;
    const invalid = missing.includes(name);
    return (
      <div className={cn("flex flex-col gap-1.5", span)}>
        <label
          htmlFor={id}
          className={cn(
            "text-[13px] font-medium",
            required && "after:text-destructive after:ml-1 after:content-['*']",
          )}
        >
          {labels[name]}
          {required || name === "cardNumber" ? null : (
            <i className="text-muted-foreground-1 ml-1 font-normal not-italic">{t.optional}</i>
          )}
        </label>
        {control({ id, invalid })}
        {help ? <span className="text-muted-foreground-1 text-xs">{help}</span> : null}
        {invalid ? (
          <span id={`${id}-error`} className="text-destructive flex items-center gap-1 text-xs">
            <AlertCircle aria-hidden="true" className="size-3.5" />
            {emptyMessage(name)}
          </span>
        ) : null}
      </div>
    );
  };

  const text = (
    name: AccountField,
    span: string,
    options?: { required?: boolean; help?: string },
  ) =>
    field(
      name,
      span,
      ({ id, invalid }) => (
        <input
          id={id}
          value={values[name]}
          onChange={(event) => set(name, event.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className={cn(controlClass, invalid && "border-destructive")}
        />
      ),
      options,
    );

  const select = (
    name: AccountField,
    span: string,
    choices: readonly { value: string; label: string }[],
    options?: { help?: string },
  ) =>
    field(
      name,
      span,
      ({ id, invalid }) => (
        <select
          id={id}
          value={values[name]}
          onChange={(event) => set(name, event.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className={cn(controlClass, invalid && "border-destructive")}
        >
          <option value="">{t.select}</option>
          {choices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      ),
      options,
    );

  const same = (list: readonly string[]) => list.map((value) => ({ value, label: value }));

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {missing.length > 0 ? (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-red-100 bg-red-50 px-4.5 py-3.5 text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4.5 shrink-0" />
          <div>
            <b>{t.blockedHeading}</b>
            <ul className="mt-1.5 ml-4.5 list-disc">
              {missing.map((name) => (
                <li key={name}>{emptyMessage(name)}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <Section
        icon={<User aria-hidden="true" className="size-4.5" />}
        heading={t.contactHeading}
        hint={t.contactHint}
      >
        {text("givenName", "col-span-6 sm:col-span-3")}
        {text("familyName", "col-span-6 sm:col-span-3")}
        {text("streetName1", "col-span-6")}
        {text("streetName2", "col-span-6", { required: false })}
        {text("city", "col-span-6 sm:col-span-2")}
        {select("state", "col-span-6 sm:col-span-2", same(STATES))}
        {text("zipCode", "col-span-6 sm:col-span-2")}
        {select("country", "col-span-6 sm:col-span-2", same(COUNTRIES))}
        {text("telephone", "col-span-6 sm:col-span-2")}
        {text("email", "col-span-6 sm:col-span-2", { required: false })}
      </Section>

      <Section
        icon={<CreditCard aria-hidden="true" className="size-4.5" />}
        heading={t.cardHeading}
        hint={t.cardHint}
      >
        {text("cardNumber", "col-span-6 sm:col-span-2", {
          required: mode === "create",
          help: mode === "edit" ? t.cardMaskedHelp : t.cardCreateHelp,
        })}
        {select("cardType", "col-span-6 sm:col-span-2", same(CARD_TYPES))}
        {select("expiryMonth", "col-span-3 sm:col-span-1", same(EXPIRY_MONTHS))}
        {select("expiryYear", "col-span-3 sm:col-span-1", same(years))}
      </Section>

      <Section
        icon={<Star aria-hidden="true" className="size-4.5" />}
        heading={t.profileHeading}
        hint={t.profileHint}
      >
        {select(
          "preferredLanguage",
          "col-span-6 sm:col-span-3",
          ACCOUNT_LANGUAGES.map((language) => ({ value: language.id, label: language.label })),
          { help: t.languageHelp },
        )}
        {select(
          "favoriteCategory",
          "col-span-6 sm:col-span-3",
          FAVORITE_CATEGORIES.map((category) => ({
            value: category.id,
            label: categoryName(category.id, category.label),
          })),
          { help: t.favoriteHelp },
        )}
        <label className="border-line-2 col-span-6 flex items-start gap-3 rounded-lg border p-3.5 sm:col-span-3">
          <input
            type="checkbox"
            checked={myList}
            onChange={(event) => setMyList(event.target.checked)}
            className="mt-1"
          />
          <span>
            <b className="block font-semibold">{t.enableMyList}</b>
            <span className="text-muted-foreground-1 text-[13px]">{t.enableMyListHint}</span>
          </span>
        </label>
        <label className="border-line-2 col-span-6 flex items-start gap-3 rounded-lg border p-3.5 sm:col-span-3">
          <input
            type="checkbox"
            checked={banner}
            onChange={(event) => setBanner(event.target.checked)}
            className="mt-1"
          />
          <span>
            <b className="block font-semibold">{t.enableBanner}</b>
            <span className="text-muted-foreground-1 text-[13px]">{t.enableBannerHint}</span>
          </span>
        </label>
      </Section>

      <div className="flex justify-end gap-3">
        {cancelTo ? (
          <Button asChild variant="outline">
            <Link to={cancelTo}>{t.cancel}</Link>
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitLabel ?? t.submit}
        </Button>
      </div>
    </form>
  );
}
