import { useParams } from "react-router";

import { EmptyState } from "@/components/state";
import { PET_CATEGORIES } from "@/constants/navigation";

export default function CategoryPlaceholder() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = PET_CATEGORIES.find((c) => c.id === categoryId);

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">{category?.label ?? "Category"}</h1>
      <EmptyState title="Coming soon" description="Browsing this category is coming soon." />
    </div>
  );
}
