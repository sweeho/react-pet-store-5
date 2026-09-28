import { useParams } from "react-router";

import { EmptyState } from "@/components/state";
import { PET_CATEGORIES } from "@/constants/navigation";
import { useScreen } from "@/i18n/screens";

export default function CategoryPlaceholder() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = PET_CATEGORIES.find((c) => c.id === categoryId);
  const t = useScreen("category");

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">{category?.label ?? t.fallbackTitle}</h1>
      <EmptyState title={t.comingSoonTitle} description={t.comingSoonDescription} />
    </div>
  );
}
