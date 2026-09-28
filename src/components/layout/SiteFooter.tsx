import { Link } from "react-router";

import { useScreen } from "@/i18n/screens";
import { cn } from "@/utils";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * The shell's one contentinfo landmark. Its link list is a separate
 * navigation landmark named "Footer" — distinct from the header's "Global"
 * nav (design.md § "Landmarks are the contract"). The "Language" entry goes
 * to `/locale`, the screen SWHR-T-0020 builds (Plan step 5).
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();
  const t = useScreen("shell");

  const footerLinks = [
    { label: t.footerHome, href: "/" },
    { label: t.footerShopByPet, href: "/" },
    { label: t.footerCart, href: "/cart" },
    { label: t.footerAccount, href: "/account" },
    { label: t.footerAdministration, href: "/admin" },
    { label: t.footerSupplier, href: "/supplier" },
    { label: t.footerLanguage, href: "/locale" },
  ];

  return (
    <footer className="border-line-2 bg-background text-muted-foreground-1 border-t">
      <div className="flex flex-col items-center gap-3 px-4 py-6 text-sm sm:flex-row sm:justify-between sm:px-8">
        <span>© {year} Pet Store</span>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={cn("hover:text-foreground font-medium", FOCUS_RING, "rounded-sm")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
