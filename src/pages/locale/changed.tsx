import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router";

import { useLocale } from "@/i18n/LocaleProvider";
import { useScreen } from "@/i18n/screens";
import { cn } from "@/utils";

import { labelKeyForLocale } from "./options";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * The locale-change confirmation screen (SWHR-R-0023.02): shows the locale
 * now in effect for the session. `useLocale()` already reflects the switch
 * by the time this page mounts, so it needs no data of its own beyond that.
 */
export default function LocaleChanged() {
  const { locale } = useLocale();
  const t = useScreen("locale-changed");
  const labelKey = labelKeyForLocale(locale);

  return (
    <div className="border-line-2 bg-card flex flex-col items-center gap-3 rounded-xl border px-8 py-18 text-center">
      <div className="bg-primary-50 text-primary mb-2 flex size-14 items-center justify-center rounded-full">
        <CheckCircle2 aria-hidden="true" className="size-6.5" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
      <p className="text-muted-foreground-2">{t.currentLocaleLabel}</p>
      <div className="border-line-2 bg-background-1 inline-flex items-center gap-2.5 rounded-full border px-4.5 py-2.5">
        <b>{t[labelKey]}</b>
        <span className="text-muted-foreground-1 font-mono text-sm">{locale}</span>
      </div>
      <div className="mt-3 flex gap-2.5">
        <Link
          to="/"
          className={cn(
            "bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold",
            FOCUS_RING,
          )}
        >
          {t.goHome}
        </Link>
        <Link
          to="/locale"
          className={cn(
            "border-line-2 bg-background hover:bg-background-1 inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold",
            FOCUS_RING,
          )}
        >
          {t.chooseAgain}
        </Link>
      </div>
    </div>
  );
}
