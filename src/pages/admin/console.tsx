import { ErrorState } from "@/components/state";
import { Button } from "@/components/ui/button";
import { useAdminStrings } from "@/i18n/admin/useAdminStrings";

interface StaffSessionResponse {
  signedOn: boolean;
  userId: string | null;
  isAdministrator: boolean;
}

interface LaunchDescriptor {
  host: string;
  port: number;
  sessionId: string;
  ordersUrl: string;
}

async function fetchStaffSession(): Promise<StaffSessionResponse> {
  const response = await fetch("/api/staff/session?realm=admin");
  return (await response.json()) as StaffSessionResponse;
}

async function postStaffSignOff(): Promise<{ redirect: string }> {
  const response = await fetch("/api/staff/signoff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ realm: "admin" }),
  });
  return (await response.json()) as { redirect: string };
}

async function fetchLaunchDescriptor(): Promise<LaunchDescriptor | null> {
  const response = await fetch("/api/admin/launch");
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as LaunchDescriptor;
}

/**
 * SWHR-R-0075, SWHR-R-0076, SWHR-R-0078, SWHR-R-0079: role-gated console.
 * Not signed on (or idle-expired — `GET /api/staff/session` reports it the
 * same way as never having signed on) redirects to `/admin/signin`;
 * signed on without the role shows access-refused (SWHR-R-0075.02); with
 * the role, Manage Orders (SWHR-R-0081, via `GET /api/admin/launch`) and
 * Sign Out (SWHR-R-0078).
 */
export default function AdminConsolePage() {
  const strings = useAdminStrings();
  if (strings.consoleTitle) {
    throw new Error("VortexNotImplemented");
  }
  const navigate = useNavigate();
  const [session, setSession] = useState<StaffSessionResponse | null>(null);
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchStaffSession().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.signedOn) {
        navigate("/admin/signin", { replace: true });
        return;
      }
      setSession(result);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    const result = await postStaffSignOff();
    navigate(result.redirect);
  };

  const handleManageOrders = async () => {
    const descriptor = await fetchLaunchDescriptor();
    setLaunchStatus(
      descriptor
        ? `Order client launched for session ${descriptor.sessionId}.`
        : "Could not start the order client.",
    );
  };

  if (!session) {
    return null;
  }

  if (!session.isAdministrator) {
    return (
      <div className="p-8">
        <ErrorState
          title={strings.accessRefusedTitle.label}
          description={strings.accessRefusedDescription.label}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">{strings.consoleTitle.label}</h1>
      <div className="flex gap-3">
        <Button onClick={() => void handleManageOrders()}>{strings.manageOrdersLink.label}</Button>
        <Button variant="outline" onClick={() => void handleSignOut()}>
          {strings.signOutButton.label}
        </Button>
      </div>
      {launchStatus ? <p className="text-muted-foreground-2 text-sm">{launchStatus}</p> : null}
    </div>
  );
}
