/**
 * Single source of truth for the app's navigable areas (design.md § Decisions
 * → "Primary-area list is one module"). The landing page, the Global
 * navigation and the footer all render from this file — no capability keeps
 * a second list.
 */

export type PetCategoryId = "BIRDS" | "CATS" | "DOGS" | "FISH" | "REPTILES";

export interface PetCategory {
  id: PetCategoryId;
  href: string;
}

export const PET_CATEGORIES: PetCategory[] = [
  { id: "BIRDS", href: "/category/BIRDS" },
  { id: "CATS", href: "/category/CATS" },
  { id: "DOGS", href: "/category/DOGS" },
  { id: "FISH", href: "/category/FISH" },
  { id: "REPTILES", href: "/category/REPTILES" },
];

export interface PrimaryArea {
  id: string;
  href: string;
}

export const PRIMARY_AREAS: PrimaryArea[] = [
  ...PET_CATEGORIES.map(({ id, href }) => ({ id, href })),
  { id: "SEARCH", href: "/search" },
  { id: "CART", href: "/cart" },
  { id: "CHECKOUT", href: "/checkout" },
  { id: "ACCOUNT", href: "/account" },
  { id: "SIGNIN", href: "/signin" },
  { id: "ADMIN", href: "/admin" },
  { id: "SUPPLIER", href: "/supplier" },
];
