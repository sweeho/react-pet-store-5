/**
 * The header Cart count (design.md P8): `count` from GET /api/cart, refetched
 * whenever `cart:changed` fires on `window`. `null` until the first answer
 * and after a failed request.
 */
export function useCartCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      fetch("/api/cart")
        .then((response) => (response.ok ? (response.json() as Promise<{ count: number }>) : null))
        .then((cart) => {
          if (!cancelled && cart) {
            setCount(cart.count);
          }
        })
        .catch(() => undefined);
    };

    refresh();
    window.addEventListener("cart:changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("cart:changed", refresh);
    };
  }, []);

  return count;
}
