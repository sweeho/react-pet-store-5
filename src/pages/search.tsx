import { useSearchParams } from "react-router";

import { EmptyState } from "@/components/state";
import { useScreen } from "@/i18n/screens";

// SWHR-R-0055.03: search itself is a later capability's placeholder, but
// the header's keyword search (built for the storefront header) must land
// on a page that states the keyword it searched for. Real results are
// still "coming soon" — only the heading reflects the query.
export default function SearchPlaceholder() {
  const t = useScreen("search");
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keywords");

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">
        {keyword ? t.resultsForTemplate.replace("{keyword}", keyword) : t.title}
      </h1>
      <EmptyState title={t.comingSoonTitle} description={t.comingSoonDescription} />
    </div>
  );
}
