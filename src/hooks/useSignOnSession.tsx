import { createContext, type ReactNode } from "react";

export interface SignOnSessionValue {
  signedOn: boolean;
  userId: string | null;
  refresh: () => Promise<void>;
}

interface SessionResponse {
  signedOn: boolean;
  userId: string | null;
}

const SignOnSessionContext = createContext<SignOnSessionValue | undefined>(undefined);

async function defaultFetchSession(): Promise<SessionResponse> {
  const response = await fetch("/api/session");
  return (await response.json()) as SessionResponse;
}

interface SignOnSessionProviderProps {
  children: ReactNode;
  fetchSession?: () => Promise<SessionResponse>;
}

/**
 * Loads GET /api/session once and exposes it to the whole tree (design.md
 * §Interface contracts) — the seam SiteHeader/GlobalNav read for Sign
 * in/Sign out, and pages call `refresh()` on after sign-on, registration
 * and sign-out so the header updates without a full reload. Mirrors
 * LocaleProvider's fetch-once-then-injectable-refresh shape so tests don't
 * need a real network round trip.
 */
export function SignOnSessionProvider({
  children,
  fetchSession = defaultFetchSession,
}: SignOnSessionProviderProps) {
  const [session, setSession] = useState<SessionResponse>({ signedOn: false, userId: null });
  const fetchRef = useRef(fetchSession);

  useEffect(() => {
    fetchRef.current = fetchSession;
  });

  const refresh = useCallback(async () => {
    try {
      const data = await fetchRef.current();
      setSession(data);
    } catch {
      // No server reachable (offline, first paint): keep the last known
      // session rather than surfacing a load error for chrome that has a
      // perfectly good fallback.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ signedOn: session.signedOn, userId: session.userId, refresh }),
    [session, refresh],
  );

  return <SignOnSessionContext.Provider value={value}>{children}</SignOnSessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSignOnSession(): SignOnSessionValue {
  const context = useContext(SignOnSessionContext);
  if (!context) {
    throw new Error("useSignOnSession must be used within a SignOnSessionProvider");
  }
  return context;
}
