export interface SupplierSession {
  signedOn: boolean;
  userId: string | null;
  isAdministrator: boolean;
}

/** Shared gate for the supplier pages: signed off redirects to sign-in, no role is refused. */
export function useSupplierSession(): SupplierSession | null {
  const navigate = useNavigate();
  const [session, setSession] = useState<SupplierSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/staff/session?realm=supplier")
      .then((response) => response.json() as Promise<SupplierSession>)
      .then((result) => {
        if (cancelled) return;
        if (!result.signedOn) {
          navigate("/supplier/signin", { replace: true });
          return;
        }
        setSession(result);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return session;
}

/** Posts the supplier sign-off and follows its redirect (SWHR-R-0229.03). */
export function useSupplierLogout(): () => Promise<void> {
  const navigate = useNavigate();
  return async () => {
    const response = await fetch("/api/staff/signoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ realm: "supplier" }),
    });
    const result = (await response.json()) as { redirect: string };
    navigate(result.redirect);
  };
}
