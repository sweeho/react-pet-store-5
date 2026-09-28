import { useParams } from "react-router";

import { PET_CATEGORIES } from "@/constants/navigation";

export default function CategoryPlaceholder() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = PET_CATEGORIES.find((c) => c.id === categoryId);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{category?.label ?? "Category"}</h1>
      <p className="text-muted-foreground-1 mt-2">Browsing this category is coming soon.</p>
    </div>
  );
}
