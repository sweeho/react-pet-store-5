import { LogIn, Menu, PawPrint, Search, ShoppingCart, User } from "lucide-react";
import type { FormEvent } from "react";
import { Link } from "react-router";

import { useLocale } from "@/i18n/LocaleProvider";
import { useScreen } from "@/i18n/screens";
import { cn } from "@/utils";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

// eslint-disable-next-line react-refresh/only-export-components
export const LANGUAGES = [
  { code: "en_US", label: "English", cjk: false },
  { code: "ja_JP", label: "日本語", cjk: true },
  { code: "zh_CN", label: "中文", cjk: true },
] as const;

interface SiteHeaderProps {
  onOpenMenu: () => void;
}

/**
 * The header's visual content — logo, search, account actions, language
 * labels and staff links (design.md § "Landmarks are the contract"; visual
 * reference artifacts/SWHR-S-0001/design/mockup-site-shell.html). Rendered
 * inside GlobalNav's <nav aria-label="Global">, not its own landmark — the
 * shell owns exactly one banner and one navigation (SD-3).
 */
export default function SiteHeader({ onOpenMenu }: SiteHeaderProps) {
  const [keywords, setKeywords] = useState("");
  const navigate = useNavigate();
  const { locale, changeLocale } = useLocale();
  const t = useScreen("shell");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = keywords.trim();
    navigate(trimmed ? `/search?keywords=${encodeURIComponent(trimmed)}` : "/search");
  };

  return (
    <>
      <div className="border-line-2 bg-background-1 text-muted-foreground-2 hidden items-center justify-between gap-4 border-b px-4 text-xs sm:flex sm:px-8">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground-1 mr-1">{t.language}</span>
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              aria-pressed={language.code === locale}
              onClick={() => void changeLocale(language.code)}
              style={
                language.cjk
                  ? { fontFamily: '"Noto Sans JP", "Noto Sans SC", sans-serif' }
                  : undefined
              }
              className={cn(
                "inline-flex h-8 items-center rounded-full px-2.5 font-medium",
                FOCUS_RING,
                language.code === locale
                  ? "border-line-2 bg-background text-foreground border"
                  : "hover:text-foreground",
              )}
            >
              {language.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span>{t.storeStaff}</span>
          <Link to="/admin" className={cn("font-medium hover:underline", FOCUS_RING, "rounded-sm")}>
            {t.administration}
          </Link>
          <Link
            to="/supplier"
            className={cn("font-medium hover:underline", FOCUS_RING, "rounded-sm")}
          >
            {t.supplier}
          </Link>
        </div>
      </div>

      <div className="flex h-18 items-center gap-4 px-4 sm:gap-6 sm:px-8">
        <Link
          to="/"
          aria-label="Pet Store home"
          className={cn(
            "flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight",
            FOCUS_RING,
            "rounded-sm",
          )}
        >
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
            <PawPrint aria-hidden="true" className="size-5" />
          </span>
          <span className="hidden sm:inline">Pet Store</span>
        </Link>

        <form role="search" onSubmit={handleSearch} className="hidden max-w-xl flex-1 md:flex">
          <label className="sr-only" htmlFor="global-search">
            {t.searchPlaceholder}
          </label>
          <span className="border-line-2 bg-background text-muted-foreground flex h-11 flex-1 items-center gap-2 rounded-l-md border border-r-0 px-3.5">
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <input
              id="global-search"
              name="keywords"
              type="search"
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none"
            />
          </span>
          <button
            type="submit"
            className={cn(
              "bg-primary text-primary-foreground hover:bg-primary-hover h-11 shrink-0 rounded-r-md px-4.5 text-sm font-semibold",
              FOCUS_RING,
            )}
          >
            {t.searchButton}
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/account"
            className={cn(
              "hover:bg-background-1 hidden h-11 items-center gap-2 rounded-md px-3 text-sm font-medium sm:flex",
              FOCUS_RING,
            )}
          >
            <User aria-hidden="true" className="size-4.5" />
            {t.account}
          </Link>
          <Link
            to="/cart"
            className={cn(
              "hover:bg-background-1 flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium",
              FOCUS_RING,
            )}
          >
            <ShoppingCart aria-hidden="true" className="size-4.5" />
            <span className="hidden sm:inline">{t.cart}</span>
          </Link>
          <Link
            to="/signin"
            className={cn(
              "hover:bg-background-1 hidden h-11 items-center gap-2 rounded-md px-3 text-sm font-medium sm:flex",
              FOCUS_RING,
            )}
          >
            <LogIn aria-hidden="true" className="size-4.5" />
            {t.signIn}
          </Link>
        </div>

        <button
          type="button"
          onClick={onOpenMenu}
          className={cn(
            "hover:bg-background-1 flex size-11 shrink-0 items-center justify-center rounded-md lg:hidden",
            FOCUS_RING,
          )}
        >
          <span className="sr-only">{t.openMenu}</span>
          <Menu aria-hidden="true" className="size-5" />
        </button>
      </div>
    </>
  );
}
