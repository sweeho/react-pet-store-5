import { createContext, type ReactNode } from "react";
import { useSearchParams } from "react-router";

import type { LocaleId } from "../../lib/locale/model";
import { getDefaultLocale, parseLocale } from "../../lib/locale/model";

interface LocaleContextValue {
  locale: LocaleId;
  changeLocale(id: string): Promise<{ ok: true } | { ok: false; message: string }>;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

interface FetchedLocale {
  locale: LocaleId;
  cartLocale: LocaleId;
}

type PostLocaleResult = { ok: true; locale: LocaleId } | { ok: false; message: string };

async function defaultFetchLocale(): Promise<FetchedLocale> {
  const response = await fetch("/api/locale");
  return (await response.json()) as FetchedLocale;
}

async function defaultPostLocale(id: string): Promise<PostLocaleResult> {
  const response = await fetch("/api/locale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale: id }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: unknown };
    const message =
      typeof body.message === "string" ? body.message : `Unable to change language to ${id}`;
    return { ok: false, message };
  }

  const body = (await response.json()) as { locale: LocaleId };
  return { ok: true, locale: body.locale };
}

interface LocaleProviderProps {
  children: ReactNode;
  fetchLocale?: () => Promise<FetchedLocale>;
  postLocale?: (id: string) => Promise<PostLocaleResult>;
}

/**
 * Loads the server-authoritative session locale (P2, D2) and exposes the
 * effective locale to the whole tree. A `?locale=` query parameter, when it
 * parses, overrides the session locale for this render only and is never
 * written back to the session (P3, SD-10). `fetchLocale`/`postLocale` are
 * injectable so tests don't need a real network round trip (mirrors
 * AsyncContent's `load` prop).
 */
export function LocaleProvider({
  children,
  fetchLocale = defaultFetchLocale,
  postLocale = defaultPostLocale,
}: LocaleProviderProps) {
  const [sessionLocale, setSessionLocale] = useState<LocaleId>(getDefaultLocale());
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    fetchLocale().then(
      (data) => {
        if (!cancelled) {
          setSessionLocale(data.locale);
        }
      },
      () => {
        // No session reachable (offline, SSR-less first paint): keep the
        // client-side default rather than surfacing a load error for chrome
        // that has a perfectly good fallback.
      },
    );

    return () => {
      cancelled = true;
    };
    // fetchLocale is only ever swapped in tests; re-running the load effect
    // when a caller passes a fresh inline function each render would defeat
    // the one-time session load this effect exists to do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLocale = searchParams.get("locale");
  const parsedRequestLocale = requestLocale ? parseLocale(requestLocale) : null;
  const locale = parsedRequestLocale ? parsedRequestLocale.id : sessionLocale;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const changeLocale = useCallback(
    async (id: string) => {
      const result = await postLocale(id);
      if (!result.ok) {
        return { ok: false as const, message: result.message };
      }
      setSessionLocale(result.locale);
      return { ok: true as const };
    },
    [postLocale],
  );

  const value = useMemo(() => ({ locale, changeLocale }), [locale, changeLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
