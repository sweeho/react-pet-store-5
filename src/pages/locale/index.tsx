import { AlertCircle } from "lucide-react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router";

import { useLocale } from "@/i18n/LocaleProvider";
import { useScreen } from "@/i18n/screens";
import { cn } from "@/utils";

import type { LocaleId } from "../../../lib/locale/model";
import { labelKeyForLocale, LOCALE_CHOICES } from "./options";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface Rejection {
  message: string;
}

/**
 * The locale selection screen (D6, SD-3): a choice list of the four legacy
 * demo options plus a Change Locale control. A rejected change — reachable
 * from a malformed `?requested=` link the way the legacy `changelocale.do`
 * demo could be, since every choice-list option here is always well-formed
 * (SWHR-R-0009) — leaves the session locale unchanged and shows the error
 * inline rather than navigating away.
 */
export default function LocaleSelection() {
  const { locale, changeLocale } = useLocale();
  const t = useScreen("locale");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selected, setSelected] = useState<LocaleId>(locale);
  const [rejection, setRejection] = useState<Rejection | null>(null);

  useEffect(() => {
    const requested = searchParams.get("requested");
    if (!requested) {
      return;
    }

    let cancelled = false;
    void changeLocale(requested).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        navigate("/locale/changed", { replace: true });
      } else {
        setRejection({ message: result.message });
      }
    });

    return () => {
      cancelled = true;
    };
    // Runs once for the `requested` link that landed on this page; changeLocale
    // and navigate are stable enough not to need to re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await changeLocale(selected);
    if (result.ok) {
      navigate("/locale/changed");
    } else {
      setRejection({ message: result.message });
    }
  }

  if (rejection) {
    const currentLabelKey = labelKeyForLocale(locale);
    return (
      <div className="border-line-2 bg-card flex flex-col items-center gap-3 rounded-xl border px-8 py-18 text-center">
        <div className="text-destructive mb-2 flex size-14 items-center justify-center rounded-full bg-red-50">
          <AlertCircle aria-hidden="true" className="size-6.5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{rejection.message}</h1>
        <p className="text-muted-foreground-2 max-w-md">
          {t.rejectedReason} {t.stillShoppingIn}{" "}
          <b className="text-foreground">
            {t[currentLabelKey]} ({locale})
          </b>{" "}
          {t.cartUnaffected}
        </p>
        <div className="mt-3 flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              setRejection(null);
              navigate("/locale", { replace: true });
            }}
            className={cn(
              "bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold",
              FOCUS_RING,
            )}
          >
            {t.chooseLanguage}
          </button>
          <Link
            to="/"
            className={cn(
              "border-line-2 bg-background hover:bg-background-1 inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold",
              FOCUS_RING,
            )}
          >
            {t.goToHomePage}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground-1 mt-1.5">{t.description}</p>
      </div>
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="border-line-2 bg-card flex max-w-lg flex-col gap-5 rounded-xl border p-7"
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.fieldLabel}</span>
          <div
            role="radiogroup"
            aria-label={t.fieldLabel}
            className="border-line-2 overflow-hidden rounded-lg border"
          >
            {LOCALE_CHOICES.map((choice) => {
              const checked = choice.id === selected;
              return (
                <button
                  key={choice.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => setSelected(choice.id)}
                  className={cn(
                    "flex h-11 w-full items-center justify-between px-3.5 text-left",
                    checked ? "bg-primary-50 text-primary-700 font-semibold" : "text-foreground",
                  )}
                >
                  <span>{t[choice.labelKey]}</span>
                  <span aria-hidden="true" className="text-muted-foreground-1 font-mono text-xs">
                    {choice.id}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-muted-foreground-1 text-sm">
            {t.currentlyInEffect} <span className="text-foreground font-mono">{locale}</span>
          </span>
        </div>
        <div>
          <button
            type="submit"
            className={cn(
              "bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold",
              FOCUS_RING,
            )}
          >
            {t.changeLocale}
          </button>
        </div>
      </form>
    </div>
  );
}
