import { Bird, Cat, Dog, Fish, LogIn, Shield, Truck, Turtle, User } from "lucide-react";
import { Link } from "react-router";

import { PET_CATEGORIES, type PetCategoryId } from "@/constants/navigation";

const CATEGORY_ICONS: Record<PetCategoryId, typeof Bird> = {
  BIRDS: Bird,
  CATS: Cat,
  DOGS: Dog,
  FISH: Fish,
  REPTILES: Turtle,
};

const Home = () => {
  return (
    <div className="flex flex-col gap-6">
      <section className="border-line-2 from-primary-50 to-background flex flex-wrap items-center gap-10 rounded-xl border bg-gradient-to-br p-10">
        <div className="flex min-w-64 flex-1 flex-col gap-3.5">
          <span className="text-primary text-sm font-semibold">
            Birds, cats, dogs, fish and reptiles
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Find your next pet</h1>
          <p className="text-muted-foreground-2 max-w-xl text-base">
            Browse by kind of pet or search by name. Fill your cart without an account — you only
            sign in when you check out.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              to="/category/DOGS"
              className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold"
            >
              Shop dogs
            </Link>
            <Link
              to="/cart"
              className="border-line-2 bg-background hover:bg-background-1 inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold"
            >
              View cart
            </Link>
            <Link to="/search" className="text-primary text-sm font-semibold hover:underline">
              Search all pets
            </Link>
            <Link to="/checkout" className="text-primary text-sm font-semibold hover:underline">
              Go to checkout
            </Link>
          </div>
        </div>
      </section>

      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Shop by pet</h2>
        <span className="text-muted-foreground-1 text-sm">{PET_CATEGORIES.length} categories</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {PET_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.id];
          return (
            <Link
              key={category.id}
              to={category.href}
              className="border-line-2 bg-card flex flex-col overflow-hidden rounded-xl border"
            >
              <div className="bg-background-2 text-muted-foreground-2 flex h-21 items-center justify-center">
                <Icon aria-hidden="true" className="size-8" />
              </div>
              <div className="flex flex-col gap-1 p-4">
                <span className="font-semibold">{category.label}</span>
                <span className="text-muted-foreground-1 line-clamp-2 text-sm">
                  {category.sampleBreeds}
                </span>
                <span className="text-primary mt-1 text-sm font-semibold">
                  Browse {category.label} →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="border-line-2 bg-card flex items-center gap-4 rounded-xl border p-5">
          <div className="bg-primary-50 text-primary flex size-11 shrink-0 items-center justify-center rounded-md">
            <User aria-hidden="true" className="size-5" />
          </div>
          <div className="flex-1">
            <Link to="/account" className="font-semibold hover:underline">
              Your account
            </Link>
            <p className="text-muted-foreground-1 text-sm">
              Contact details, card on file, language.
            </p>
          </div>
          <Link
            to="/signin"
            className="border-line-2 bg-background hover:bg-background-1 inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold"
          >
            <LogIn aria-hidden="true" className="size-4" />
            Sign in
          </Link>
        </div>

        <div className="border-line-2 bg-card flex items-center gap-4 rounded-xl border p-5">
          <div className="bg-background-2 text-muted-foreground-2 flex size-11 shrink-0 items-center justify-center rounded-md">
            <Truck aria-hidden="true" className="size-5" />
          </div>
          <div className="flex-1">
            <span className="font-semibold">Store staff</span>
            <p className="text-muted-foreground-1 text-sm">
              Order approval, sales and stock levels.
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Link
              to="/admin"
              className="text-primary hover:bg-background-1 inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold"
            >
              <Shield aria-hidden="true" className="size-4" />
              Administration
            </Link>
            <Link
              to="/supplier"
              className="text-primary hover:bg-background-1 inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold"
            >
              <Truck aria-hidden="true" className="size-4" />
              Supplier
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
