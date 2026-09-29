import { Bird, Cat, Dog, Fish, PawPrint, Turtle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * The home map's fixed picture region per legacy category id (design.md
 * P5): a lookup, not a source of labels — every displayed name comes from
 * the live GET /api/catalog/categories response.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  BIRDS: Bird,
  CATS: Cat,
  DOGS: Dog,
  FISH: Fish,
  REPTILES: Turtle,
};

export function getCategoryIcon(categoryId: string): LucideIcon {
  return CATEGORY_ICONS[categoryId] ?? PawPrint;
}
