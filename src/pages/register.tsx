import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useSignOnSession } from "@/hooks/useSignOnSession";
import { useLocale } from "@/i18n/LocaleProvider";
import { LANGUAGES } from "@/components/layout/SiteHeader";
import { useScreen } from "@/i18n/screens";

interface RedirectResult {
  redirect: string;
}

async function postRegistration(preferredLanguage: string): Promise<RedirectResult> {
  const response = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preferredLanguage }),
  });
  return (await response.json()) as RedirectResult;
}

/**
 * Registration step 2 (design.md P8) — a minimal seam: only the preferred
 * language, defaulting to the session locale. customer-account
 * (swhr-i-0007) replaces this form with the full account-information one;
 * this ticket owns only getting a freshly created account signed on. No
 * mockup — built from the shared shell and form pattern per PLAN.md.
 */
export default function RegisterPage() {
  const t = useScreen("register");
  const { locale } = useLocale();
  const { refresh } = useSignOnSession();
  const navigate = useNavigate();

  const [preferredLanguage, setPreferredLanguage] = useState(locale);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await postRegistration(preferredLanguage);
    await refresh();
    navigate(result.redirect);
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground-2 mt-1 max-w-2xl">{t.subtitle}</p>
      </div>
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="border-line-2 bg-background flex max-w-md flex-col gap-4.5 rounded-xl border p-7"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="preferred-language" className="text-sm font-medium">
            {t.languageLabel}
          </label>
          <select
            id="preferred-language"
            value={preferredLanguage}
            onChange={(event) => setPreferredLanguage(event.target.value)}
            className="border-line-2 bg-background flex h-11 w-full items-center rounded-md border px-3.5 text-sm"
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="self-start">
          {t.submitButton}
        </Button>
      </form>
    </div>
  );
}
