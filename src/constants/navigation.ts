/**
 * Single source of truth for the app's navigable areas (design.md § Decisions
 * → "Primary-area list is one module"). The landing page, the Global
 * navigation and the footer all render from this file — no capability keeps
 * a second list.
 */

export type PetCategoryId = "BIRDS" | "CATS" | "DOGS" | "FISH" | "REPTILES";

export interface PetCategory {
  id: PetCategoryId;
  label: string;
  href: string;
  sampleBreeds: string;
}

export const PET_CATEGORIES: PetCategory[] = [
  { id: "BIRDS", label: "Birds", href: "/category/BIRDS", sampleBreeds: "Amazon Parrot, Finch" },
  { id: "CATS", label: "Cats", href: "/category/CATS", sampleBreeds: "Manx, Persian" },
  {
    id: "DOGS",
    label: "Dogs",
    href: "/category/DOGS",
    sampleBreeds: "Bulldog, Poodle, Dalmation, Golden Retriever, Labrador Retriever, Chihuahua",
  },
  {
    id: "FISH",
    label: "Fish",
    href: "/category/FISH",
    sampleBreeds: "Angelfish, Tiger Shark, Koi, Goldfish",
  },
  {
    id: "REPTILES",
    label: "Reptiles",
    href: "/category/REPTILES",
    sampleBreeds: "Rattlesnake, Iguana",
  },
];

export interface PrimaryArea {
  id: string;
  label: string;
  href: string;
}

export const PRIMARY_AREAS: PrimaryArea[] = [
  ...PET_CATEGORIES.map(({ id, label, href }) => ({ id, label, href })),
  { id: "SEARCH", label: "Search", href: "/search" },
  { id: "CART", label: "Cart", href: "/cart" },
  { id: "CHECKOUT", label: "Checkout", href: "/checkout" },
  { id: "ACCOUNT", label: "Account", href: "/account" },
  { id: "SIGNIN", label: "Sign in", href: "/signin" },
  { id: "ADMIN", label: "Administration", href: "/admin" },
  { id: "SUPPLIER", label: "Supplier", href: "/supplier" },
];
