import { Link } from "react-router";

import { cn } from "@/utils";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop by pet", href: "/" },
  { label: "Cart", href: "/cart" },
  { label: "Account", href: "/account" },
  { label: "Administration", href: "/admin" },
  { label: "Supplier", href: "/supplier" },
];

/**
 * The shell's one contentinfo landmark. Its link list is a separate
 * navigation landmark named "Footer" — distinct from the header's "Global"
 * nav (design.md § "Landmarks are the contract").
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-line-2 bg-background text-muted-foreground-1 border-t">
      <div className="flex flex-col items-center gap-3 px-4 py-6 text-sm sm:flex-row sm:justify-between sm:px-8">
        <span>© {year} Pet Store</span>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {FOOTER_LINKS.map((link) => (
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
