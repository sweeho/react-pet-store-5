import type { ReactNode } from "react";

interface ProtectionConfigResponse {
  signOnPage: string;
  protectedPaths: string[];
}

type GateResult = { allowed: true } | { allowed: false; redirect: string };

async function defaultFetchProtectionConfig(): Promise<ProtectionConfigResponse> {
  const response = await fetch("/api/signon/config");
  return (await response.json()) as ProtectionConfigResponse;
}

async function defaultCheckGate(pathWithQuery: string): Promise<GateResult> {
  const response = await fetch(`/api/signon/gate?path=${encodeURIComponent(pathWithQuery)}`);
  return (await response.json()) as GateResult;
}

interface SignOnGateProps {
  children: ReactNode;
  fetchProtectionConfig?: () => Promise<ProtectionConfigResponse>;
  checkGate?: (pathWithQuery: string) => Promise<GateResult>;
}

/**
 * The one gate SPA navigation goes through (design.md P6 — middleware/
 * signon.ts and requireSignOn() are the other two). Fetches the protected
 * path list once; a path not on it renders immediately with no per-request
 * call. A path on it renders nothing until GET /api/signon/gate answers,
 * then either renders the route or redirects to the page it returned.
 */
export function SignOnGate({
  children,
  fetchProtectionConfig = defaultFetchProtectionConfig,
  checkGate = defaultCheckGate,
}: SignOnGateProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathWithQuery = location.pathname + location.search;

  const [protectedPaths, setProtectedPaths] = useState<string[] | null>(null);
  // The pathWithQuery the gate last answered "allowed" for — compared
  // against the current one below, rather than a plain boolean, so a
  // navigation to a new protected path renders nothing again instead of
  // reusing the previous path's answer.
  const [gateAllowedFor, setGateAllowedFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchProtectionConfig().then(
      (config) => {
        if (!cancelled) {
          setProtectedPaths(config.protectedPaths);
        }
      },
      () => {
        // No server reachable (e.g. offline first paint): treat nothing as
        // protected rather than locking the whole SPA behind a load error.
        if (!cancelled) {
          setProtectedPaths([]);
        }
      },
    );

    return () => {
      cancelled = true;
    };
    // fetchProtectionConfig is only ever swapped in tests; re-running this
    // load on a fresh inline function each render would defeat the
    // fetch-once contract (mirrors LocaleProvider's session load).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isProtected = protectedPaths !== null && protectedPaths.includes(location.pathname);

  useEffect(() => {
    if (!isProtected) {
      return;
    }

    let cancelled = false;

    checkGate(pathWithQuery).then(
      (result) => {
        if (cancelled) {
          return;
        }
        if (result.allowed) {
          setGateAllowedFor(pathWithQuery);
        } else {
          navigate(result.redirect, { replace: true });
        }
      },
      () => {
        // No server reachable: fail closed on a page configured as
        // protected rather than serving it.
      },
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProtected, pathWithQuery]);

  const ready = protectedPaths !== null && (!isProtected || gateAllowedFor === pathWithQuery);
  if (!ready) {
    return null;
  }

  return <>{children}</>;
}

export default SignOnGate;
