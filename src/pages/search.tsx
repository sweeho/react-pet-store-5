import { EmptyState } from "@/components/state";
import { useScreen } from "@/i18n/screens";

export default function SearchPlaceholder() {
  const t = useScreen("search");

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <EmptyState title={t.comingSoonTitle} description={t.comingSoonDescription} />
    </div>
  );
}
