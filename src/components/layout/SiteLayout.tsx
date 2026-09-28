import type { ReactNode } from "react";

import { SignOnSessionProvider } from "@/hooks/useSignOnSession";

import GlobalNav from "./GlobalNav";
import SiteFooter from "./SiteFooter";

interface SiteLayoutProps {
  children: ReactNode;
}

/**
 * The one shared shell every route renders inside (design.md § "One
 * shell"). Fixed contract: exactly one banner, one navigation landmark
 * named "Global", one main landmark holding the page content and one
 * contentinfo, in that DOM order. A page contributes only what goes inside
 * `main` — it never draws its own header, nav or footer. Wrapped in
 * SignOnSessionProvider (design.md §Interface contracts, SWHR-T-0046) so
 * GlobalNav/SiteHeader and every page share one client-side sign-on state.
 */
export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <SignOnSessionProvider>
      <GlobalNav />
      <main>{children}</main>
      <SiteFooter />
    </SignOnSessionProvider>
  );
}
