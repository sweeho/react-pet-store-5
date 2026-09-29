import type { FormEvent } from "react";
import { Link } from "react-router";

import { ErrorState, LoadingState } from "@/components/state";
import { useAccount } from "@/hooks/useAccount";
import { useScreen } from "@/i18n/screens";
import { cn } from "@/utils";

import { COUNTRIES, STATES } from "../../lib/account/reference";
import type { AccountView } from "../../lib/account/view";
import type { OrderContactInput, OrderForm } from "../../lib/checkout/contact";

type Field = keyof OrderContactInput;

const controlClass =
  "border-line-2 bg-background focus-visible:ring-ring h-[42px] w-full rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

function contactFrom(account: AccountView): OrderContactInput {
  const { contactInfo } = account;
  return {
    givenName: contactInfo.givenName,
    familyName: contactInfo.familyName,
    streetName1: contactInfo.address.streetName1,
    streetName2: contactInfo.address.streetName2 ?? "",
    city: contactInfo.address.city,
    state: contactInfo.address.state,
    zipCode: contactInfo.address.zipCode,
    country: contactInfo.address.country,
    telephone: contactInfo.telephone,
    email: contactInfo.email ?? "",
  };
}

function ContactSection({
  prefix,
  step,
  heading,
  value,
  onChange,
}: {
  prefix: string;
  step: number;
  heading: string;
  value: OrderContactInput;
  onChange: (field: Field, next: string) => void;
}) {
  const t = useScreen("checkout");
  const headingId = `${prefix}-heading`;

  const field = (
    name: Field,
    label: string,
    span: string,
    options: { required?: boolean; unmarked?: boolean; choices?: readonly string[] } = {},
  ) => {
    const { required = true, unmarked = false, choices } = options;
    const id = `${prefix}-${name}`;
    return (
      <div className={cn("flex flex-col gap-1.5", span)}>
        <label
          htmlFor={id}
          className={cn(
            "text-[13px] font-medium",
            required && "after:text-destructive after:ml-1 after:content-['*']",
          )}
        >
          {label}
          {required || unmarked ? null : (
            <span className="text-muted-foreground-1 ml-1 font-normal">{t.optional}</span>
          )}
        </label>
        {choices ? (
          <select
            id={id}
            value={value[name]}
            onChange={(event) => onChange(name, event.target.value)}
            className={controlClass}
          >
            <option value="">{t.select}</option>
            {choices.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            value={value[name]}
            placeholder={name === "streetName2" ? t.street2Placeholder : undefined}
            onChange={(event) => onChange(name, event.target.value)}
            className={controlClass}
          />
        )}
      </div>
    );
  };

  return (
    <section
      aria-labelledby={headingId}
      className="border-line-2 bg-background rounded-xl border px-7 py-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-primary-50 text-primary-700 border-primary-100 flex size-7 items-center justify-center rounded-full border text-[13px] font-semibold"
        >
          {step}
        </span>
        <h2 id={headingId} className="text-[17px] font-semibold">
          {heading}
        </h2>
        <p className="text-muted-foreground-1 ml-auto text-[13px]">{t.prefilled}</p>
      </div>
      <div className="grid grid-cols-6 gap-4">
        {field("givenName", t.firstName, "col-span-6 sm:col-span-3")}
        {field("familyName", t.lastName, "col-span-6 sm:col-span-3")}
        {field("streetName1", t.street1, "col-span-6")}
        {field("streetName2", t.street2, "col-span-6", { required: false })}
        {field("city", t.city, "col-span-6 sm:col-span-2")}
        {field("state", t.state, "col-span-6 sm:col-span-2", { choices: STATES })}
        {field("zipCode", t.postalCode, "col-span-6 sm:col-span-2")}
        {field("country", t.country, "col-span-6 sm:col-span-2", {
          required: false,
          unmarked: true,
          choices: COUNTRIES,
        })}
        {field("telephone", t.telephone, "col-span-6 sm:col-span-2")}
        {field("email", t.email, "col-span-6 sm:col-span-2", { required: false })}
      </div>
    </section>
  );
}

function OrderFormFields({ account }: { account: AccountView }) {
  const t = useScreen("checkout");
  const navigate = useNavigate();
  const [billing, setBilling] = useState(() => contactFrom(account));
  const [shipping, setShipping] = useState(() => contactFrom(account));
  const [pending, setPending] = useState(false);
  const { cardNumberMasked, cardType, expiryMonth, expiryYear } = account.creditCard;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    try {
      const form: OrderForm = { billing, shipping };
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        window.dispatchEvent(new Event("cart:changed"));
        navigate("/order-complete");
        return;
      }
      const body = (await response.json().catch(() => null)) as { screen?: string | null } | null;
      navigate(body?.screen ?? "/error");
    } catch {
      navigate("/error");
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex items-start gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <ContactSection
          prefix="billing"
          step={1}
          heading={t.billing}
          value={billing}
          onChange={(name, next) => setBilling((current) => ({ ...current, [name]: next }))}
        />
        <ContactSection
          prefix="shipping"
          step={2}
          heading={t.shipping}
          value={shipping}
          onChange={(name, next) => setShipping((current) => ({ ...current, [name]: next }))}
        />
        <p className="text-muted-foreground-1 text-[13px]">
          <span className="text-destructive">*</span> {t.requiredNote}
        </p>
      </div>
      <div className="flex w-80 flex-none flex-col gap-4">
        <section className="border-line-2 bg-background rounded-xl border p-5">
          <h2 className="mb-1 text-[15px] font-semibold">{t.payment}</h2>
          <p className="text-muted-foreground-1 mb-3.5 text-[13px]">{t.paymentNote}</p>
          <div className="border-line-2 bg-background-1 flex items-center gap-3.5 rounded-[10px] border p-3.5">
            <span
              aria-hidden="true"
              className="bg-secondary text-secondary-foreground flex h-[30px] w-11 items-center justify-center rounded-md text-[10px] font-bold"
            >
              JAVA
            </span>
            <div>
              <div className="font-semibold">{cardType}</div>
              <div className="text-muted-foreground-1 text-[13px]">
                <span className="font-mono">{cardNumberMasked}</span> · {t.expires} {expiryMonth}/
                {expiryYear}
              </div>
            </div>
          </div>
          <Link
            to="/account-edit"
            className="text-primary mt-3 inline-block text-[13px] font-semibold"
          >
            {t.changeCard}
          </Link>
        </section>
        <section className="border-line-2 bg-background flex flex-col gap-3 rounded-xl border p-5">
          <button
            type="submit"
            disabled={pending}
            className="bg-primary text-primary-foreground hover:bg-primary-hover h-[46px] w-full rounded-lg text-[15px] font-semibold disabled:opacity-60"
          >
            {pending ? t.submitting : t.submit}
          </button>
          <p className="text-muted-foreground-1 text-center text-[13px]">{t.submitNote}</p>
          <Link
            to="/cart"
            className="border-line-2 bg-background hover:bg-background-1 flex h-[42px] items-center justify-center rounded-lg border text-sm font-semibold"
          >
            {t.backToCart}
          </Link>
        </section>
      </div>
    </form>
  );
}

/** The order information form, pre-filled from the account (design.md P8). */
export default function CheckoutPage() {
  const t = useScreen("checkout");
  const { account, loading, error } = useAccount();

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <nav aria-label="Breadcrumb" className="text-muted-foreground-1 flex gap-2 text-[13px]">
          <Link to="/cart" className="text-muted-foreground-2 font-medium">
            {t.crumbCart}
          </Link>
          <span aria-hidden="true">›</span>
          <b className="text-foreground font-medium">{t.crumbCheckout}</b>
        </nav>
        <h1 className="mt-2.5 text-[28px] leading-tight font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground-2 mt-1.5 text-[15px]">{t.subtitle}</p>
      </div>
      {loading ? (
        <LoadingState />
      ) : error || !account ? (
        <ErrorState title={t.loadError} />
      ) : (
        <OrderFormFields account={account} />
      )}
    </div>
  );
}
