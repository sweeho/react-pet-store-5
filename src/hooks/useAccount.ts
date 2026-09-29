import type { AccountView } from "../../lib/account/view";

export interface AccountState {
  account: AccountView | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * The signed-on user's account from GET /api/account (design.md P8, P10).
 * `account` is null for an anonymous visitor (401) or a user with no
 * customer (404); any other failure is reported as `error`.
 */
async function fetchAccount(): Promise<AccountView | null> {
  const response = await fetch("/api/account");
  if (response.status === 401 || response.status === 404) return null;
  if (!response.ok) throw new Error(`Failed to load account (${response.status})`);
  return (await response.json()) as AccountView;
}

export function useAccount(): AccountState {
  const [state, setState] = useState<Omit<AccountState, "refresh">>({
    account: null,
    loading: true,
    error: null,
  });
  const mounted = useRef(true);

  const load = useCallback(
    () =>
      fetchAccount().then(
        (account) => {
          if (mounted.current) setState({ account, loading: false, error: null });
        },
        (cause: unknown) => {
          if (mounted.current) {
            const error = cause instanceof Error ? cause : new Error(String(cause));
            setState({ account: null, loading: false, error });
          }
        },
      ),
    [],
  );

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { ...state, refresh: load };
}
