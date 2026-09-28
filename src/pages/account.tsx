import { EmptyState } from "@/components/state";
import { useScreen } from "@/i18n/screens";

export default function AccountPlaceholder() {
  const t = useScreen("account");

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <EmptyState title={t.comingSoonTitle} description={t.comingSoonDescription} />
    </div>
  );
}
