import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface AddToCartButtonProps {
  itemId: string;
  label: string;
  addedLabel: string;
  size?: "sm" | "default";
}

async function postAddToCart(itemId: string): Promise<void> {
  const response = await fetch("/api/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId }),
  });
  if (response.ok) {
    window.dispatchEvent(new Event("cart:changed"));
  }
}

/**
 * The one shared Add to Cart control (design.md PLAN step 8): POSTs
 * `{ itemId }` — never gated, no sign-on required (SWHR-R-0070). Used by
 * the product, item and search rows.
 */
export default function AddToCartButton({
  itemId,
  label,
  addedLabel,
  size = "sm",
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  const handleClick = async () => {
    await postAddToCart(itemId);
    setAdded(true);
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button type="button" size={size} onClick={() => void handleClick()}>
        {size === "default" ? <ShoppingCart aria-hidden="true" className="size-4" /> : null}
        {label}
      </Button>
      {added ? <p className="text-muted-foreground-1 text-xs">{addedLabel}</p> : null}
    </div>
  );
}
