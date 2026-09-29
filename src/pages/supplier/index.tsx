import { EmptyState, ErrorState } from "@/components/state";

interface StaffSessionResponse {
  signedOn: boolean;
  userId: string | null;
  isAdministrator: boolean;
}

async function fetchStaffSession(): Promise<StaffSessionResponse> {
  const response = await fetch("/api/staff/session?realm=supplier");
  return (await response.json()) as StaffSessionResponse;
}

function notImplemented(): void {
  throw new Error("VortexNotImplemented");
}

/**
 * SWHR-R-0082: form-based sign-in required before any inventory function;
 * only the administrator role may view or update inventory. A signed-in
 * user without the role sees a not-authorised message and no update form
 * (SWHR-R-0082.01) — inventory viewing/updating itself is out of this
 * ticket's scope (design.md § "Non-goals").
 */
export default function SupplierInventoryPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<StaffSessionResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchStaffSession().then((result) => {
      if (cancelled) {
        return;
      }
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

  notImplemented();

  if (!session) {
    return null;
  }

  if (!session.isAdministrator) {
    return (
      <div className="p-8">
        <ErrorState title="Not authorised" description="You are not authorised to update orders." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">Supplier inventory</h1>
      <EmptyState title="Coming soon" description="Inventory management is coming soon." />
    </div>
  );
}
